import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { View, StyleSheet, Animated, StatusBar, SafeAreaView } from 'react-native';
import HomeScreen from './HomeScreen';
// Applications / App Restrictions module hidden — re-enable by uncommenting:
// import AppsScreen from './AppsScreen';
import NotificationsScreen from './NotificationsScreen';
import ProfileScreen from './ProfileScreen';
import BottomNavBar from '../components/BottomNavBar';
import { fetchDashboard, fetchNotifications } from '../../services/studentService';
import syncService from '../../services/syncService';

export const StudentDashboardScreen = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('home');
  const [dashboardData, setDashboardData] = useState({
    student: null,
    restrictionStatus: null,
    blockedApps: [],
    recentActivity: [],
    notifications: [],
  });
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const isMountedRef = useRef(true);

  const loadData = useCallback(async () => {
    if (!isMountedRef.current) return;
    try {
      const [dash, notifs] = await Promise.all([
        fetchDashboard().catch(() => null),
        // Applications / App Restrictions module hidden — the /student/apps
        // poll is disabled (was: fetchApps()).
        fetchNotifications().catch(() => null),
      ]);

      if (isMountedRef.current) {
        const backendBlocked = dash?.blockedApps || [];
        const realNotifications = notifs?.notifications || dash?.notifications || [];

        setDashboardData({
          student: dash?.student || null,
          restrictionStatus: dash?.restrictionStatus || null,
          blockedApps: backendBlocked,
          recentActivity: dash?.recentActivity || [],
          notifications: realNotifications,
        });
      }
    } catch (err) {
      if (err?.status === 401 || err?.status === 403) {
        onLogout && onLogout();
      }
    }
  }, [onLogout]);

  useEffect(() => {
    isMountedRef.current = true;
    loadData();

    const interval = setInterval(loadData, 60 * 1000);

    // Periodic policy sync (30s /policy/latest poll + AppState-foreground sync)
    // so the dashboard/timer stays fresh even when a socket rule:update event
    // is missed while backgrounded or offline.
    syncService.startPeriodicSync();

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
      syncService.stopPeriodicSync();
    };
  }, [loadData]);

  const handleTabChange = useCallback(
    (newTab) => {
      // Applications / App Restrictions module hidden — any attempt to reach
      // the Apps tab is redirected to Home so no route can land there.
      if (newTab === 'apps') newTab = 'home';
      if (newTab === activeTab) return;

      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.9,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();

      setActiveTab(newTab);
    },
    [activeTab, fadeAnim],
  );

  const handleOpenProfile = useCallback(() => handleTabChange('profile'), [handleTabChange]);

  const handleNotificationRead = useCallback((notificationId) => {
    setDashboardData((prev) => ({
      ...prev,
      notifications: (prev.notifications || []).filter(
        (n) => (n._id || n.id) !== notificationId,
      ),
    }));
  }, []);

  const handleClearAllNotifications = useCallback(() => {
    setDashboardData((prev) => ({
      ...prev,
      notifications: (prev.notifications || []).filter(
        (n) => n.type === 'restriction',
      ),
    }));
  }, []);

  const renderActiveScreen = useMemo(() => {
    switch (activeTab) {
      case 'home':
        return (
          <HomeScreen
            key="home"
            data={dashboardData}
            onNavigateTab={handleTabChange}
            onOpenProfile={handleOpenProfile}
          />
        );
      // Applications / App Restrictions module hidden — Apps route disabled.
      // Re-enable by uncommenting:
      // case 'apps':
      //   return <AppsScreen key="apps" data={dashboardData} />;
      case 'notifications':
        return (
          <NotificationsScreen
            key="notifications"
            data={dashboardData}
            onNotificationRead={handleNotificationRead}
            onClearAll={handleClearAllNotifications}
          />
        );
      case 'profile':
        return (
          <ProfileScreen
            key="profile"
            student={dashboardData.student}
            onLogout={onLogout}
          />
        );
      default:
        return (
          <HomeScreen
            key="default"
            data={dashboardData}
            onNavigateTab={handleTabChange}
            onOpenProfile={handleOpenProfile}
          />
        );
    }
  }, [
    activeTab,
    dashboardData,
    onLogout,
    handleTabChange,
    handleOpenProfile,
    handleNotificationRead,
    handleClearAllNotifications,
  ]);

  const unreadNotificationsCount = useMemo(
    () =>
      (dashboardData?.notifications || []).filter(
        (n) => !n.read && n.type !== 'restriction',
      ).length,
    [dashboardData?.notifications],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.container}>
        <Animated.View style={[styles.screenContainer, { opacity: fadeAnim }]}>
          {renderActiveScreen}
        </Animated.View>

        <BottomNavBar
          activeTab={activeTab}
          onSelectTab={handleTabChange}
          unreadNotificationsCount={unreadNotificationsCount}
        />
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
});

export default StudentDashboardScreen;

