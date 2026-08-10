import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BottomTabBar from './components/BottomTabBar';
import DashboardScreen from './screens/DashboardScreen';
import StudentsScreen from './screens/StudentsScreen';
import StaffScreen from './screens/StaffScreen';
import DevicesScreen from './screens/DevicesScreen';
import SettingsScreen from './screens/SettingsScreen';

import colors from './styles/colors';
import syncService from '../services/syncService';

/**
 * AdminPanel
 * Root component of the Admin Panel module. Renders a bottom tab bar
 * (Dashboard | Students | Staff | Devices | Settings) and swaps the
 * visible screen using local component state.
 *
 * This deliberately does NOT use React Navigation (or any routing
 * library) so that it works as a drop-in module without adding new
 * dependencies to the host project. If the host app later adopts
 * React Navigation, each screen in `./screens` can be registered with
 * a Tab.Navigator individually -- see index.js for named exports.
 */
const TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { key: 'students', label: 'Students', icon: 'school' },
  { key: 'staff', label: 'Staff', icon: 'groups' },
  { key: 'devices', label: 'Devices', icon: 'devices' },
  { key: 'settings', label: 'Settings', icon: 'settings' },
];

const AdminPanel = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    syncService.requestAllPermissions().catch(() => null);
  }, []);

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'students':
        return <StudentsScreen />;
      case 'staff':
        return <StaffScreen />;
      case 'devices':
        return <DevicesScreen />;
      case 'settings':
        return <SettingsScreen onLogout={onLogout} />;
      case 'dashboard':
      default:
        return <DashboardScreen />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.screenContainer}>{renderActiveScreen()}</View>
      <BottomTabBar tabs={TABS} activeTab={activeTab} onTabPress={setActiveTab} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  screenContainer: { flex: 1 },
});

export default AdminPanel;
