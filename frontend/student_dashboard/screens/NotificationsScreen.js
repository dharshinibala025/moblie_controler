import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, StatusBar } from 'react-native';
import { colors } from '../styles/theme';
import NotificationsCard from '../components/NotificationsCard';
import { markNotificationRead } from '../../services/studentService';

const STATUSBAR_OFFSET = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 16;

const formatTime = (createdAt) => {
  if (!createdAt) return '';
  const ts = new Date(createdAt).getTime();
  if (Number.isNaN(ts)) return '';
  const diffMs = Date.now() - ts;
  const diffMins = Math.max(0, Math.round(diffMs / 60000));
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.round(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return `${Math.round(diffHrs / 24)}d ago`;
};

const mapNotifications = (notifs = []) =>
  notifs.map((n) => ({
    id: n._id || n.id,
    title: n.title || '',
    message: n.message || '',
    read: !!n.read,
    time: formatTime(n.createdAt || n.time),
  }));

export const NotificationsScreen = ({ data }) => {
  const [notifications, setNotifications] = useState(() =>
    mapNotifications(data.notifications || []),
  );

  useEffect(() => {
    setNotifications(mapNotifications(data.notifications || []));
  }, [data]);

  const handlePressNotification = async (item) => {
    if (!item || !item.id) return;
    // Auto-clear once read: remove from the list immediately, sync with server.
    setNotifications((prev) => prev.filter((n) => n.id !== item.id));
    try {
      await markNotificationRead(item.id);
    } catch (e) {
      // Server sync failed - restore the item so the user can retry.
      setNotifications((prev) => [...prev, item]);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>Notifications</Text>
        <Text style={styles.screenSubtitle}>
          Broadcast updates and policy notifications from Department HOD/Admin
        </Text>
      </View>

      <NotificationsCard
        notifications={notifications}
        onPressNotification={handlePressNotification}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingTop: STATUSBAR_OFFSET,
    paddingBottom: 100,
  },
  screenHeader: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  screenSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 4,
  },
});

export default NotificationsScreen;
