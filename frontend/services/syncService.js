import { NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch } from './apiConfig';

const { AppScannerModule } = NativeModules;

const CACHE_KEYS = {
  DEVICE_ID: '@focussync:deviceId',
  POLICY_VERSION: '@focussync:policyVersion',
  APPS_CACHE: '@focussync:appsCache',
};

class SyncService {
  isSyncing = false;
  _intervalId = null;
  _appStateSubscription = null;

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
      const registrationPayload = {
        fcmToken: 'fcm_placeholder', // fallback FCM token
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

      // 3. Scan installed apps
      const installedApps = await AppScannerModule.getInstalledApps();
      const appsPayload = installedApps.map((app) => ({
        packageName: app.packageName,
        appName: app.appName,
        versionName: app.versionName || '1.0.0',
        isSystemApp: !!app.isSystemApp,
        isGame: !!app.isGame,
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
        await AppScannerModule.savePolicy(
          (policy.policyVersion || 1).toString(),
          policy.blockedPackages || [],
          policy.scheduleStart || '09:00',
          policy.scheduleEnd || '16:00',
          policy.activeDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          policy.restrictionReason || 'Institutional restriction policy',
          policy.policyVersion || 1
        );
        await AsyncStorage.setItem(CACHE_KEYS.POLICY_VERSION, (policy.policyVersion || 1).toString());
      }
    } catch (error) {
      console.warn('FocusSync: Background Synchronization failed:', error.message);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Periodic background sync so the 09:00-16:00 restriction policy is refreshed
   * even when the student is not actively opening the Apps screen.
   */
  startPeriodicSync(intervalMs = 15 * 60 * 1000) {
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
      AppScannerModule.openAccessibilitySettings();
    }
  }

  openOverlaySettings() {
    if (AppScannerModule && AppScannerModule.openOverlaySettings) {
      AppScannerModule.openOverlaySettings();
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

  async requestAllPermissions() {
    try {
      const { PermissionsAndroid, Platform, Alert } = require('react-native');
      
      // 1. Notification Permission (Android 13+)
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: 'Notification Permission Required',
            message: 'Allow Smart Classroom to send you alerts about your restriction status and important updates.',
            buttonPositive: 'Allow',
            buttonNegative: 'Don\'t Allow',
          }
        );
      }

      // 2. Check and prompt for Accessibility and Overlay
      if (AppScannerModule && AppScannerModule.checkPermissions) {
        const permissions = await AppScannerModule.checkPermissions();
        
        if (!permissions.accessibilityEnabled) {
          Alert.alert(
            'Accessibility Permission Required',
            'Please turn on "Smart Classroom Protection Service" under Installed Services in your Accessibility settings to monitor application usage.',
            [
              {
                text: 'Grant Permission',
                onPress: () => {
                  if (AppScannerModule.openAccessibilitySettings) {
                    AppScannerModule.openAccessibilitySettings();
                  }
                }
              },
              { text: 'Cancel', style: 'cancel' }
            ]
          );
          return;
        }

        if (!permissions.overlayEnabled) {
          Alert.alert(
            'Overlay Permission Required',
            'Please enable "Display Over Other Apps" for Smart Classroom to enforce restrictions.',
            [
              {
                text: 'Grant Permission',
                onPress: () => {
                  if (AppScannerModule.openOverlaySettings) {
                    AppScannerModule.openOverlaySettings();
                  }
                }
              },
              { text: 'Cancel', style: 'cancel' }
            ]
          );
        }
      }
    } catch (err) {
      console.warn('FocusSync: Failed to prompt permissions:', err);
    }
  }
}

export default new SyncService();
