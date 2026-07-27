import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  AppState,
} from 'react-native';
import HomeScreen from './HomeScreen';
import AppsScreen from './AppsScreen';
import NotificationsScreen from './NotificationsScreen';
import ProfileScreen from './ProfileScreen';
import BottomNavBar from '../components/BottomNavBar';
import AppDetailScreen from './AppDetailScreen';
import ActivityTimelineScreen from './ActivityTimelineScreen';
import DeviceInfoScreen from './DeviceInfoScreen';
import SyncStatusScreen from './SyncStatusScreen';
import RestrictionInfoScreen from './RestrictionInfoScreen';
import { fetchDashboard, fetchApps, fetchNotifications, fetchUnreadCount } from '../../services/studentService';
import syncService from '../../services/syncService';
import { colors } from '../styles/theme';

export const StudentDashboardScreen = ({ onLogout }) => {
  // ─── Navigation state ──────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('home');
  const [profileSubScreen, setProfileSubScreen] = useState(null); // 'deviceInfo' | 'syncStatus'
  const [selectedApp, setSelectedApp] = useState(null);          // App object for detail
  const [showActivityTimeline, setShowActivityTimeline] = useState(false);
  const [showRestrictionInfo, setShowRestrictionInfo] = useState(false);

  // ─── Real data state ───────────────────────────────────────────────────────
  const [dashboardData, setDashboardData] = useState(null);
  const [appsData, setAppsData] = useState(null);
  const [notificationsData, setNotificationsData] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // ─── UI state ──────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  // ─── Load data ─────────────────────────────────────────────────────────────
  const loadAllData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [dash, apps, notifs, countData] = await Promise.all([
        fetchDashboard(),
        fetchApps(),
        fetchNotifications(),
        fetchUnreadCount(),
      ]);
      setDashboardData(dash);
      setAppsData(apps);
      setNotificationsData(notifs);
      setUnreadCount(countData?.unreadCount ?? 0);
    } catch (err) {
      if (err?.status === 401 || err?.status === 403) {
        // Session expired — force logout
        onLogout && onLogout();
        return;
      }
      setError(err?.message || 'Failed to load data. Pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [onLogout]);

  useEffect(() => {
    let isMounted = true;
    const initSyncAndLoad = async () => {
      try {
        await syncService.sync('login');
      } catch (e) {
        console.warn('Sync notice:', e.message);
      }
      if (isMounted) {
        await loadAllData(false);
      }
    };
    initSyncAndLoad();

    // Sync on foreground AppState transitions
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'active') {
        try {
          await syncService.sync('foreground');
        } catch (e) {}
        loadAllData(true);
      }
    });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, [loadAllData]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await syncService.sync('reconnect');
    } catch (e) {}
    await loadAllData(true);
  }, [loadAllData]);

  // ─── Tab switching animation ───────────────────────────────────────────────
  const handleTabChange = (newTab) => {
    // Reset all sub-screens when switching tabs
    setProfileSubScreen(null);
    setSelectedApp(null);
    setShowActivityTimeline(false);
    setShowRestrictionInfo(false);

    if (newTab === activeTab) return;

    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0.9, duration: 100, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();

    setActiveTab(newTab);
  };

  // ─── Sub-screen navigation ─────────────────────────────────────────────────
  const openDeviceInfo = () => setProfileSubScreen('deviceInfo');
  const openSyncStatus = () => setProfileSubScreen('syncStatus');
  const openAppDetail = (app) => setSelectedApp(app);
  const openActivityTimeline = () => setShowActivityTimeline(true);
  const openRestrictionInfo = () => setShowRestrictionInfo(true);

  const goBack = () => {
    if (profileSubScreen) { setProfileSubScreen(null); return; }
    if (selectedApp) { setSelectedApp(null); return; }
    if (showActivityTimeline) { setShowActivityTimeline(false); return; }
    if (showRestrictionInfo) { setShowRestrictionInfo(false); return; }
  };

  // ─── Loading screen ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Error screen ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.centerContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Unable to Connect</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadAllData(false)}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Sub-screen rendering ──────────────────────────────────────────────────
  const renderSubScreen = () => {
    // App Detail
    if (selectedApp) {
      return (
        <AppDetailScreen
          app={selectedApp}
          restrictionStatus={dashboardData?.restrictionStatus}
          onBack={goBack}
        />
      );
    }

    // Activity Timeline
    if (showActivityTimeline) {
      return (
        <ActivityTimelineScreen
          activities={dashboardData?.recentActivity || []}
          onBack={goBack}
          onRefresh={handleRefresh}
          refreshing={refreshing}
        />
      );
    }

    // Restriction Info
    if (showRestrictionInfo) {
      return (
        <RestrictionInfoScreen
          restrictionStatus={dashboardData?.restrictionStatus}
          onBack={goBack}
        />
      );
    }

    // Device Info
    if (profileSubScreen === 'deviceInfo') {
      return (
        <DeviceInfoScreen
          student={dashboardData?.student}
          deviceStatus={dashboardData?.deviceStatus}
          onBack={goBack}
        />
      );
    }

    // Sync Status
    if (profileSubScreen === 'syncStatus') {
      return (
        <SyncStatusScreen
          deviceStatus={dashboardData?.deviceStatus}
          student={dashboardData?.student}
          onBack={goBack}
          onRefresh={handleRefresh}
          refreshing={refreshing}
        />
      );
    }

    return null;
  };

  const subScreen = renderSubScreen();

  // ─── Active tab content ────────────────────────────────────────────────────
  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomeScreen
            data={dashboardData}
            onNavigateTab={handleTabChange}
            onOpenProfile={() => handleTabChange('profile')}
            onViewActivityTimeline={openActivityTimeline}
            onOpenRestrictionInfo={openRestrictionInfo}
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        );
      case 'apps':
        return (
          <AppsScreen
            data={appsData}
            onSelectApp={openAppDetail}
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        );
      case 'notifications':
        return (
          <NotificationsScreen
            data={notificationsData}
            onRefresh={handleRefresh}
            refreshing={refreshing}
            onNotificationRead={() => {
              setUnreadCount((prev) => Math.max(0, prev - 1));
            }}
          />
        );
      case 'profile':
        return (
          <ProfileScreen
            student={dashboardData?.student}
            deviceStatus={dashboardData?.deviceStatus}
            onOpenDeviceInfo={openDeviceInfo}
            onOpenSyncStatus={openSyncStatus}
            onLogout={onLogout}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.container}>
        {subScreen ? (
          // Show sub-screen full-screen (no tab bar visible beneath it)
          <View style={styles.screenContainer}>
            {subScreen}
          </View>
        ) : (
          <>
            <Animated.View style={[styles.screenContainer, { opacity: fadeAnim }]}>
              {renderActiveScreen()}
            </Animated.View>
            <BottomNavBar
              activeTab={activeTab}
              onSelectTab={handleTabChange}
              unreadCount={unreadCount}
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  screenContainer: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 12,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 14,
  },
  retryText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default StudentDashboardScreen;
