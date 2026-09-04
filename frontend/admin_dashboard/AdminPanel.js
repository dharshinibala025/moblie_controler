import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BottomTabBar from './components/BottomTabBar';
import DashboardScreen from './screens/DashboardScreen';
import StudentsScreen from './screens/StudentsScreen';
import StaffScreen from './screens/StaffScreen';
import DevicesScreen from './screens/DevicesScreen';
import SettingsScreen from './screens/SettingsScreen';
import NotificationsScreen from './screens/NotificationsScreen';

import colors from './styles/colors';
import adminService from '../services/adminService';

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
  { key: 'notifications', label: 'Alerts', icon: 'notifications' },
  { key: 'settings', label: 'Settings', icon: 'settings' },
];

const AdminPanel = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [adminProfile, setAdminProfile] = useState(null);
  const [notifBadgeCount, setNotifBadgeCount] = useState(0);

  useEffect(() => {
    adminService.getAdminProfile().then((data) => {
      if (data) setAdminProfile(data);
    }).catch(() => {});
  }, []);

  // Fetch notification count on mount and every 60 seconds
  useEffect(() => {
    const fetchNotifCount = async () => {
      try {
        const data = await adminService.getAdminNotifications();
        if (Array.isArray(data)) {
          // Count unread notifications (those without a readAt timestamp)
          const unread = data.filter((n) => !n.readAt && !n.isRead).length;
          setNotifBadgeCount(unread > 0 ? unread : 0);
        }
      } catch (e) {
        // Ignore errors — badge is cosmetic
      }
    };
    fetchNotifCount();
    const interval = setInterval(fetchNotifCount, 60000);
    return () => clearInterval(interval);
  }, []);

  // Clear badge when user opens notifications tab
  useEffect(() => {
    if (activeTab === 'notifications') {
      setNotifBadgeCount(0);
    }
  }, [activeTab]);

  const navigateToNotifications = () => setActiveTab('notifications');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.screenContainer}>
        <View style={[styles.screenWrapper, activeTab !== 'dashboard' && styles.screenHidden]}>
          <DashboardScreen onNavigateNotifications={navigateToNotifications} />
        </View>
        <View style={[styles.screenWrapper, activeTab !== 'students' && styles.screenHidden]}>
          <StudentsScreen />
        </View>
        <View style={[styles.screenWrapper, activeTab !== 'staff' && styles.screenHidden]}>
          <StaffScreen />
        </View>
        <View style={[styles.screenWrapper, activeTab !== 'devices' && styles.screenHidden]}>
          <DevicesScreen />
        </View>
        <View style={[styles.screenWrapper, activeTab !== 'notifications' && styles.screenHidden]}>
          <NotificationsScreen onBack={() => setActiveTab('dashboard')} />
        </View>
        <View style={[styles.screenWrapper, activeTab !== 'settings' && styles.screenHidden]}>
          <SettingsScreen adminData={adminProfile} onLogout={onLogout} />
        </View>
      </View>
      <BottomTabBar
        tabs={TABS}
        activeTab={activeTab}
        onTabPress={setActiveTab}
        badgeCounts={{ notifications: notifBadgeCount }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  screenContainer: { flex: 1 },
  screenWrapper: { flex: 1 },
  screenHidden: { height: 0, overflow: 'hidden', flex: 0 },
});

export default AdminPanel;
