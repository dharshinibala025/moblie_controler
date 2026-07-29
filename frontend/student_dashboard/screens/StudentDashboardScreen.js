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
  const [dashboardData, setDashboardData] = useState(mockData);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        await syncService.sync('login');
        const [dash, apps, notifs] = await Promise.all([
          fetchDashboard().catch(() => null),
          fetchApps().catch(() => null),
          fetchNotifications().catch(() => null),
        ]);

        if (isMounted && (dash || apps || notifs)) {
          const backendBlocked = (apps?.apps && apps.apps.filter(a => a.blocked).length > 0)
            ? apps.apps.filter(a => a.blocked)
            : (dash?.blockedApps && dash.blockedApps.length > 0)
              ? dash.blockedApps
              : mockData.blockedApps;

          setDashboardData({
            student: dash?.student || mockData.student,
            restrictionStatus: dash?.restrictionStatus || mockData.restrictionStatus,
            blockedApps: backendBlocked,
            recentActivity: dash?.recentActivity || mockData.recentActivity,
            notifications: notifs?.notifications || dash?.notifications || mockData.notifications,
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.container}>
        <Animated.View style={[styles.screenContainer, { opacity: fadeAnim }]}>
          {renderActiveScreen()}
        </Animated.View>

        <BottomNavBar activeTab={activeTab} onSelectTab={handleTabChange} />
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

