import { NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch } from './apiConfig';

const { AppScannerModule } = NativeModules;

const CACHE_KEYS = {
  DEVICE_ID: '@focussync:deviceId',
  POLICY_VERSION: '@focussync:policyVersion',
};

class SyncService {
  isSyncing = false;

  async sync(syncType = 'periodic') {
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      // 1. Get native device info
      const nativeInfo = await AppScannerModule.getDeviceInfo();

      // 2. Register device with backend
      const registrationPayload = {
        fcmToken: 'fcm_placeholder', // fallback FCM token
        deviceInfo: {
          platform: 'android',
          osVersion: nativeInfo.osVersion,
          appVersion: nativeInfo.appVersion,
          deviceModel: nativeInfo.deviceModel,
          deviceId: nativeInfo.deviceId,
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
      }));

      // 4. Synchronize apps inventory with backend
      await apiFetch('/student/scan', {
        method: 'POST',
        body: JSON.stringify({ apps: appsPayload }),
      });

      // 5. Pull latest policy configuration
      const policy = await apiFetch(`/policy/latest?deviceId=${serverDeviceId}&syncType=${syncType}`, {
        method: 'GET',
      });

      // 6. Check policy version differences and write updates to native side
      const cachedVersionStr = await AsyncStorage.getItem(CACHE_KEYS.POLICY_VERSION);
      const cachedVersion = cachedVersionStr ? parseInt(cachedVersionStr, 10) : 0;

      if (policy && policy.policyVersion > cachedVersion) {
        await AppScannerModule.savePolicy(
          policy.policyVersion.toString(),
          policy.blockedPackages || [],
          policy.scheduleStart || '09:00',
          policy.scheduleEnd || '16:00',
          policy.activeDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          policy.restrictionReason || 'Institutional restriction policy',
          policy.policyVersion
        );
        await AsyncStorage.setItem(CACHE_KEYS.POLICY_VERSION, policy.policyVersion.toString());
      }
    } catch (error) {
      console.warn('FocusSync: Background Synchronization failed:', error.message);
    } finally {
      this.isSyncing = false;
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
