import React, { useState, useEffect } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import StaffDashboardTab from './StaffDashboardTab';
import StaffDevicesTab from './StaffDevicesTab';
import StaffStudentsTab from './StaffStudentsTab';
import StaffSettingsTab from './StaffSettingsTab';
import StaffBottomNavBar from '../components/StaffBottomNavBar';
import { getStoredUser } from '../../services/apiConfig';
import syncService from '../../services/syncService';

export const StaffDashboardScreen = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [staffInfo, setStaffInfo] = useState(null);

  useEffect(() => {
    const loadStaffInfo = async () => {
      try {
        const user = await getStoredUser();
        if (user) {
          setStaffInfo(user);
        }
        syncService.requestAllPermissions().catch(() => null);
      } catch (err) {
        console.warn('FocusSync: Failed to load staff details:', err);
      }
    };
    loadStaffInfo();
  }, []);

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return <StaffDashboardTab staffInfo={staffInfo} onNavigateTab={setActiveTab} />;
      case 'devices':
        return <StaffDevicesTab staffInfo={staffInfo} onNavigateTab={setActiveTab} />;
      case 'students':
        return <StaffStudentsTab staffInfo={staffInfo} onNavigateTab={setActiveTab} />;
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
      <StaffBottomNavBar activeTab={activeTab} onSelectTab={setActiveTab} />
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
