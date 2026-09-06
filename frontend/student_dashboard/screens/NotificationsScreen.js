import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, StatusBar, TouchableOpacity } from 'react-native';
import { colors } from '../styles/theme';
import NotificationsCard from '../components/NotificationsCard';
import { markNotificationRead, markAllNotificationsRead } from '../../services/studentService';

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
  notifs
    .filter((n) => n.type !== 'restriction')
    .map((n) => ({
    id: n._id || n.id,
    title: n.title || '',
    message: n.message || '',
    read: !!n.read,
    time: formatTime(n.createdAt || n.time),
  }));

export const NotificationsScreen = ({ data, onNotificationRead, onClearAll }) => {
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
    onNotificationRead && onNotificationRead(item.id);
    try {
      await markNotificationRead(item.id);
    } catch (e) {
      // Server sync failed - restore the item so the user can retry.
      setNotifications((prev) => [...prev, item]);
    }
  };

  const handleClearAll = async () => {
    const backup = [...notifications];
    setNotifications([]);
    onClearAll && onClearAll();
    try {
      await markAllNotificationsRead();
    } catch (e) {
      setNotifications(backup);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.screenHeader}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.screenTitle}>Notifications</Text>
          {notifications.length > 0 && (
            <TouchableOpacity
              onPress={handleClearAll}
              activeOpacity={0.7}
              style={styles.clearAllBtn}
            >
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>
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
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  clearAllBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  clearAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  screenSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 4,
  },
});

export default NotificationsScreen;
