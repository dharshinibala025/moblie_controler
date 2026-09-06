import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { View, StyleSheet, Animated, StatusBar, SafeAreaView } from 'react-native';
import HomeScreen from './HomeScreen';
import AppsScreen from './AppsScreen';
import NotificationsScreen from './NotificationsScreen';
import ProfileScreen from './ProfileScreen';
import BottomNavBar from '../components/BottomNavBar';
import { fetchDashboard, fetchApps, fetchNotifications } from '../../services/studentService';

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
      const [dash, apps, notifs] = await Promise.all([
        fetchDashboard().catch(() => null),
        fetchApps().catch(() => null),
        fetchNotifications().catch(() => null),
      ]);

      if (isMountedRef.current) {
        const backendBlocked = apps?.apps || dash?.blockedApps || [];
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

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, [loadData]);

  const handleTabChange = (newTab) => {
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
  };

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
      case 'apps':
        return <AppsScreen key="apps" data={dashboardData} />;
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

