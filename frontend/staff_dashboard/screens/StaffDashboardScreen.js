import React, { useState } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import StaffDashboardTab from './StaffDashboardTab';
import StaffDevicesTab from './StaffDevicesTab';
import StaffStudentsTab from './StaffStudentsTab';
import StaffSettingsTab from './StaffSettingsTab';
import StaffBottomNavBar from '../components/StaffBottomNavBar';

export const StaffDashboardScreen = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return <StaffDashboardTab />;
      case 'devices':
        return <StaffDevicesTab />;
      case 'students':
        return <StaffStudentsTab />;
      case 'settings':
        return <StaffSettingsTab onLogout={onLogout} />;
      default:
        return <StaffDashboardTab />;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <View style={styles.screenContainer}>
        {renderActiveScreen()}
      </View>
      <StaffBottomNavBar activeTab={activeTab} onSelectTab={setActiveTab} />
    </View>
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
