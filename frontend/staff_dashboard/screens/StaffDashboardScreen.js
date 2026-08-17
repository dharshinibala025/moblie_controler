import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import StaffDashboardTab from './StaffDashboardTab';
import StaffDevicesTab from './StaffDevicesTab';
import StaffStudentsTab from './StaffStudentsTab';
import StaffSettingsTab from './StaffSettingsTab';
import NotificationsScreen from '../../admin_dashboard/screens/NotificationsScreen';
import StaffBottomNavBar from '../components/StaffBottomNavBar';
import { getStoredUser } from '../../services/apiConfig';
import { fetchStaffNotifications } from '../../services/staffService';

export const StaffDashboardScreen = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [staffInfo, setStaffInfo] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const prevTabRef = useRef('dashboard');

  useEffect(() => {
    const loadStaffInfo = async () => {
      try {
        const user = await getStoredUser();
        if (user) {
          setStaffInfo(user);
        }

      } catch (err) {
        console.warn('FocusSync: Failed to load staff details:', err);
      }
    };
    loadStaffInfo();
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const data = await fetchStaffNotifications();
      if (Array.isArray(data)) {
        const unread = data.filter(n => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const handleTabChange = useCallback((newTab) => {
    const prevTab = prevTabRef.current;
    prevTabRef.current = newTab;

    if (prevTab === 'notifications' && newTab !== 'notifications') {
      fetchUnreadCount();
    }

    setActiveTab(newTab);
  }, [fetchUnreadCount]);

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return <StaffDashboardTab staffInfo={staffInfo} onNavigateTab={setActiveTab} />;
      case 'devices':
        return <StaffDevicesTab staffInfo={staffInfo} onNavigateTab={setActiveTab} />;
      case 'students':
        return <StaffStudentsTab staffInfo={staffInfo} onNavigateTab={setActiveTab} />;
      case 'notifications':
        return <NotificationsScreen onBack={() => setActiveTab('dashboard')} />;
      case 'settings':
        return <StaffSettingsTab staffInfo={staffInfo} onLogout={onLogout} />;
      default:
        return <StaffDashboardTab staffInfo={staffInfo} onNavigateTab={setActiveTab} />;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.screenContainer}>
        {renderActiveScreen()}
      </View>
      <StaffBottomNavBar activeTab={activeTab} onSelectTab={handleTabChange} unreadCount={unreadCount} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  screenContainer: {
    flex: 1,
  },
});

export default StaffDashboardScreen;
