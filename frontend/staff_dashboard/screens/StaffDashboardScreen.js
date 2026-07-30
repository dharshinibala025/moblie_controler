import React, { useState } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import StaffHomeScreen from './StaffHomeScreen';
import StaffStudentsScreen from './StaffStudentsScreen';
import StaffMonitorScreen from './StaffMonitorScreen';
import StaffNotificationsScreen from './StaffNotificationsScreen';
import StaffProfileScreen from './StaffProfileScreen';
import StaffBottomNavBar from '../components/StaffBottomNavBar';

export const StaffDashboardScreen = ({ onLogout, staffData }) => {
  const [activeTab, setActiveTab] = useState('home');

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'home':
        return <StaffHomeScreen onNavigateTab={setActiveTab} staffData={staffData} />;
      case 'students':
        return <StaffStudentsScreen staffData={staffData} />;
      case 'monitor':
        return <StaffMonitorScreen staffData={staffData} />;
      case 'notifications':
        return <StaffNotificationsScreen staffData={staffData} />;
      case 'profile':
        return <StaffProfileScreen onLogout={onLogout} staffData={staffData} />;
      default:
        return <StaffHomeScreen onNavigateTab={setActiveTab} staffData={staffData} />;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
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
    backgroundColor: '#FFFFFF',
  },
  screenContainer: {
    flex: 1,
  },
});

export default StaffDashboardScreen;
