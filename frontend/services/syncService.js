import { NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch, BASE_URL } from './apiConfig';

const { AppScannerModule } = NativeModules;

const CACHE_KEYS = {
  DEVICE_ID: '@focussync:deviceId',
  POLICY_VERSION: '@focussync:policyVersion',
  APPS_CACHE: '@focussync:appsCache',
  POLICY_CACHE: '@focussync:policyCache',
};

// While a policy is active, every installed app the phone classifies as
// social/games/entertainment is enforced too — even if the server's package
// list is stale/incomplete. Keeps the native accessibility service and the
// Apps screen consistent with each other.
const AUTO_BLOCK_CATEGORIES = ['social', 'games', 'entertainment'];

const enrichBlockedPackages = (packages, installedApps) => {
  const blocked = new Set(Array.isArray(packages) ? packages : []);
  for (const app of installedApps || []) {
    if (!app || !app.packageName) continue;
    if (AUTO_BLOCK_CATEGORIES.includes(String(app.category || '').toLowerCase())) {
      blocked.add(app.packageName);
    }
  }
  return Array.from(blocked);
};

class SyncService {
  isSyncing = false;
  _intervalId = null;
  _appStateSubscription = null;
  _socket = null;
  _socketConnected = false;

  async sync(syncType = 'periodic') {
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      // 1. Get native device info safely
      let nativeInfo = null;
      if (AppScannerModule && AppScannerModule.getDeviceInfo) {
        nativeInfo = await AppScannerModule.getDeviceInfo().catch(() => null);
      }
      nativeInfo = nativeInfo || {
        osVersion: '14',
        appVersion: '1.0.0',
        deviceModel: 'Android Device',
        deviceId: 'default-device-id',
      };

      const permissions = await this.checkPermissions();

      // 2. Register device with backend
      // Get the real FCM token (native Firebase) when available so pushes can
      // reach the phone even while the app is backgrounded or killed.
      let fcmToken = null;
      if (AppScannerModule && AppScannerModule.getFcmToken) {
        fcmToken = await AppScannerModule.getFcmToken().catch(() => null);
      }

      const registrationPayload = {
        fcmToken,
        deviceInfo: {
          platform: 'android',
          osVersion: nativeInfo.osVersion,
          appVersion: nativeInfo.appVersion,
          deviceModel: nativeInfo.deviceModel,
          deviceId: nativeInfo.deviceId,
          accessibilityEnabled: permissions.accessibilityEnabled,
          overlayEnabled: permissions.overlayEnabled,
        },
      };

      const registerRes = await apiFetch('/student/device/register', {
        method: 'POST',
        body: JSON.stringify(registrationPayload),
      });

      const serverDeviceId = registerRes.deviceId;
      if (serverDeviceId) {
        await AsyncStorage.setItem(CACHE_KEYS.DEVICE_ID, serverDeviceId);
      }

      // Mirror deviceId + auth token + base URL into native storage so the
      // background WorkManager sync can refresh the policy without JS.
      try {
        const accessToken = await AsyncStorage.getItem('@focussync:accessToken');
        if (AppScannerModule && AppScannerModule.saveAuth) {
          await AppScannerModule.saveAuth(
            serverDeviceId || '',
            accessToken || '',
            BASE_URL,
          ).catch(() => null);
        }
      } catch (e) {
        // ignore mirror failures
      }

      // 3. Scan installed apps
      let installedApps = [];
      if (AppScannerModule && AppScannerModule.getInstalledApps) {
        installedApps = (await AppScannerModule.getInstalledApps().catch(() => [])) || [];
      }
      const appsPayload = installedApps.map((app) => ({
        packageName: app.packageName,
        appName: app.appName,
        versionName: app.versionName || '1.0.0',
        isSystemApp: !!app.isSystemApp,
        isGame: !!app.isGame,
        isSocial: !!app.isSocial,
        category: app.category || 'uncategorized',
      }));

      // 3b. Cache scanned apps locally so the Apps screen can render offline
      try {
        await AsyncStorage.setItem(CACHE_KEYS.APPS_CACHE, JSON.stringify(installedApps));
      } catch (e) {
        // ignore cache failures
      }

      // 4. Synchronize apps inventory with backend
      await apiFetch('/student/scan', {
        method: 'POST',
        body: JSON.stringify({ apps: appsPayload }),
      });

      // 5. Pull latest policy configuration
      const policy = await apiFetch(`/policy/latest?deviceId=${serverDeviceId}&syncType=${syncType}`, {
        method: 'GET',
      });

      // 6. Save latest policy to native storage for Accessibility Service
      if (policy) {
        const policyVersion = policy.policyVersion || 1;
        const status = policy.status || 'active';
        const emergency = policy.emergency === 'active';
        // Enrich with locally-classified social/games/entertainment apps so the
        // native service enforces the same set the Apps screen shows.
        const blockedPackages = enrichBlockedPackages(policy.blockedPackages || [], installedApps);
        if (AppScannerModule && AppScannerModule.savePolicy) {
          await AppScannerModule.savePolicy(
            policyVersion.toString(),
            blockedPackages,
            policy.scheduleStart || '09:00',
            policy.scheduleEnd || '16:00',
            policy.activeDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            policy.restrictionReason || 'Institutional restriction policy',
            policyVersion,
            status,
            emergency
          ).catch(() => null);
        }
        await AsyncStorage.setItem(CACHE_KEYS.POLICY_VERSION, policyVersion.toString());

        // Cache the full policy envelope so the Apps screen can render live
        // badges and schedule info even while offline.
        try {
          await AsyncStorage.setItem(
            CACHE_KEYS.POLICY_CACHE,
            JSON.stringify({ ...policy, blockedPackages })
          );
        } catch (e) {
          // ignore cache failures
        }
      }
    } catch (error) {
      console.warn('FocusSync: Background Synchronization failed:', error.message);
    } finally {
      this.isSyncing = false;
    }
  }

  async getCachedPolicy() {
    try {
      const raw = await AsyncStorage.getItem(CACHE_KEYS.POLICY_CACHE);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  async getCachedApps() {
    try {
      const raw = await AsyncStorage.getItem(CACHE_KEYS.APPS_CACHE);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Periodic background sync — every 30 seconds so blocking is near-instant.
   */
  startPeriodicSync(intervalMs = 30 * 1000) {
    if (this._intervalId) return;

    const { AppState } = require('react-native');
    this._appStateSubscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        this.sync('periodic').catch(() => null);
      }
    });

    this._intervalId = setInterval(() => {
      this.sync('periodic').catch(() => null);
    }, intervalMs);
  }

  stopPeriodicSync() {
    if (this._intervalId) {
      clearInterval(this._intervalId);
      this._intervalId = null;
    }
    if (this._appStateSubscription) {
      this._appStateSubscription.remove();
      this._appStateSubscription = null;
    }
  }

  /**
   * Real-time Socket.io listener for instant blocking/unblocking.
   * When staff/admin pauses or resumes, student devices receive the
   * event within 1-3 seconds instead of waiting for periodic sync.
   */
  async startRealtimeListener() {
    if (this._socket && this._socketConnected) return;

    try {
      const io = require('socket.io-client');
      const AsyncStorageModule = require('@react-native-async-storage/async-storage').default;
      const token = await AsyncStorageModule.getItem('@focussync:accessToken');
      if (!token) return;

      this._socket = io(BASE_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 2000,
        reconnectionAttempts: Infinity,
      });

      this._socket.on('connect', () => {
        this._socketConnected = true;
        console.log('FocusSync: Real-time listener connected');
        // Request latest state on connect
        this._socket.emit('device:requestState');
      });

      this._socket.on('disconnect', () => {
        this._socketConnected = false;
      });

      // Listen for rule updates (pause/start/stop) from staff or admin
      this._socket.on('rule:update', async (data) => {
        try {
          console.log('FocusSync: Received rule:update', data.action);
          const { action, blockedPackages, scheduleStart, scheduleEnd, activeDays, status, policyVersion } = data;

          if (AppScannerModule && AppScannerModule.savePolicy) {
            if (action === 'pause' || action === 'stop') {
              // Unblock: save empty blocked list with inactive status
              await AppScannerModule.savePolicy(
                (policyVersion || 0).toString(),
                [],
                scheduleStart || '09:00',
                scheduleEnd || '16:00',
                activeDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                '',
                policyVersion || 0,
                'paused',
                false
              ).catch(() => null);

              // Update the policy cache so the Apps screen reflects the change
              await AsyncStorage.setItem(
                CACHE_KEYS.POLICY_CACHE,
                JSON.stringify({
                  policyVersion: policyVersion || 0,
                  blockedPackages: [],
                  status: 'inactive',
                  scheduleStart: scheduleStart || '09:00',
                  scheduleEnd: scheduleEnd || '16:00',
                  activeDays: activeDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                  scheduleActive: false,
                  source: 'realtime',
                }),
              ).catch(() => {});
            } else if (action === 'start') {
              // Block: parse the payload pushed by the server (socket sends a
              // real array, FCM sends a JSON-encoded string). Only fall back to
              // /policy/latest when no packages were provided, and if that
              // refetch fails keep the last-known list instead of wiping
              // enforcement to zero ("Restrictions Active · 0 apps blocked").
              let packages = Array.isArray(blockedPackages)
                ? blockedPackages
                : null;
              if (packages === null && typeof blockedPackages === 'string' && blockedPackages.trim()) {
                try {
                  const parsed = JSON.parse(blockedPackages);
                  if (Array.isArray(parsed)) packages = parsed;
                } catch (e) {
                  packages = null;
                }
              }
              if (packages !== null && !Array.isArray(packages)) packages = null;
              let policy = null;

              if (!packages) {
                const deviceId = await AsyncStorageModule.getItem(CACHE_KEYS.DEVICE_ID);
                if (deviceId) {
                  policy = await apiFetch(`/policy/latest?deviceId=${deviceId}&syncType=realtime`, { method: 'GET' })
                    .catch(() => null);
                  packages = policy && Array.isArray(policy.blockedPackages) ? policy.blockedPackages : [];
                }
                if (!packages || packages.length === 0) {
                  const prev = await AsyncStorage.getItem(CACHE_KEYS.POLICY_CACHE).catch(() => null);
                  if (prev) {
                    try {
                      const prevPolicy = JSON.parse(prev);
                      if (prevPolicy && Array.isArray(prevPolicy.blockedPackages) && prevPolicy.blockedPackages.length > 0) {
                        packages = prevPolicy.blockedPackages;
                      }
                    } catch (e) { /* ignore */ }
                  }
                }
              } else {
                policy = {
                  policyVersion,
                  blockedPackages: packages,
                  scheduleStart: scheduleStart || '09:00',
                  scheduleEnd: scheduleEnd || '16:00',
                  activeDays: activeDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                  status: status || 'active',
                };
              }

              // Enrich with locally-classified social/games/entertainment apps
              // so native enforcement matches what the Apps screen shows, even
              // if the server list is stale or empty.
              let installedApps = [];
              try {
                const cachedApps = await AsyncStorage.getItem(CACHE_KEYS.APPS_CACHE);
                if (cachedApps) installedApps = JSON.parse(cachedApps) || [];
              } catch (e) { /* ignore */ }
              const enriched = enrichBlockedPackages(packages || [], installedApps);
              packages = enriched;

              await AppScannerModule.savePolicy(
                (policyVersion || 1).toString(),
                packages,
                scheduleStart || '09:00',
                scheduleEnd || '16:00',
                activeDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                policy?.restrictionReason || '',
                policyVersion || 1,
                policy?.status || 'active',
                policy?.emergency === 'active'
              ).catch(() => null);

              // Update the policy cache so the Apps screen reflects the change
              await AsyncStorage.setItem(
                CACHE_KEYS.POLICY_CACHE,
                JSON.stringify({
                  policyVersion: policyVersion || 1,
                  blockedPackages: packages,
                  status: policy?.status || 'active',
                  scheduleStart: scheduleStart || '09:00',
                  scheduleEnd: scheduleEnd || '16:00',
                  activeDays: activeDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                  scheduleActive: true,
                  source: 'realtime',
                  restrictionReason: policy?.restrictionReason || '',
                }),
              ).catch(() => {});
            }
          }
        } catch (e) {
          console.warn('FocusSync: rule:update handling error:', e.message);
        }
      });

      // Listen for emergency unblock (admin only)
      this._socket.on('emergency:unblock_all', async () => {
        try {
          console.log('FocusSync: Emergency unblock received');
          if (AppScannerModule && AppScannerModule.clearPolicy) {
            await AppScannerModule.clearPolicy().catch(() => null);
          }
        } catch (e) {
          console.warn('FocusSync: emergency:unblock handling error:', e.message);
        }
      });
    } catch (e) {
      console.warn('FocusSync: Socket connection error:', e.message);
    }
  }

  stopRealtimeListener() {
    if (this._socket) {
      this._socket.disconnect();
      this._socket = null;
      this._socketConnected = false;
    }
  }

  async checkPermissions() {
    if (AppScannerModule && AppScannerModule.checkPermissions) {
      try {
        return await AppScannerModule.checkPermissions();
      } catch (e) {
        return { accessibilityEnabled: false, overlayEnabled: false };
      }
    }
    return { accessibilityEnabled: false, overlayEnabled: false };
  }

  openAccessibilitySettings() {
    if (AppScannerModule && AppScannerModule.openAccessibilitySettings) {
      AppScannerModule.openAccessibilitySettings().catch(() => null);
    }
  }

  openOverlaySettings() {
    if (AppScannerModule && AppScannerModule.openOverlaySettings) {
      AppScannerModule.openOverlaySettings().catch(() => null);
    }
  }

  async reportBlockedAttempt(packageName, appName, policyVersion) {
    try {
      const serverDeviceId = await AsyncStorage.getItem(CACHE_KEYS.DEVICE_ID);
      if (!serverDeviceId) return;

      await apiFetch('/student/blocked-attempt', {
        method: 'POST',
        body: JSON.stringify({
          packageName,
          appName: appName || '',
          policyVersion: policyVersion || 1,
          attemptedAt: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.warn('FocusSync: Blocked attempt logging failed:', error.message);
    }
  }

}

export default new SyncService();
