import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, StatusBar, SafeAreaView, AppState } from 'react-native';
import mockData from '../data/mockData';
import HomeScreen from './HomeScreen';
import AppsScreen from './AppsScreen';
import NotificationsScreen from './NotificationsScreen';
import ProfileScreen from './ProfileScreen';
import BottomNavBar from '../components/BottomNavBar';
import { fetchDashboard, fetchApps, fetchNotifications } from '../../services/studentService';
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

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        syncService.sync('login').catch(() => null);
        const [dash, apps, notifs] = await Promise.all([
          fetchDashboard().catch(() => null),
          fetchApps().catch(() => null),
          fetchNotifications().catch(() => null),
        ]);

        if (isMounted) {
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
    };

    loadData();

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        loadData();
      }
    });

    return () => {
      isMounted = false;
      subscription?.remove();
    };
  }, [onLogout]);

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

  const renderActiveScreen = () => {
    const currentData = dashboardData || mockData;
    switch (activeTab) {
      case 'home':
        return (
          <HomeScreen
            key="home"
            data={currentData}
            onNavigateTab={handleTabChange}
            onOpenProfile={() => handleTabChange('profile')}
          />
        );
      case 'apps':
        return <AppsScreen key="apps" data={currentData} />;
      case 'notifications':
        return <NotificationsScreen key="notifications" data={currentData} />;
      case 'profile':
        return (
          <ProfileScreen
            key="profile"
            student={currentData.student}
            onLogout={onLogout}
          />
        );
      default:
        return (
          <HomeScreen
            key="default"
            data={currentData}
            onNavigateTab={handleTabChange}
            onOpenProfile={() => handleTabChange('profile')}
          />
        );
    }
  };

  const unreadNotificationsCount = (dashboardData?.notifications || []).filter((n) => !n.read).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.container}>
        <Animated.View style={[styles.screenContainer, { opacity: fadeAnim }]}>
          {renderActiveScreen()}
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

