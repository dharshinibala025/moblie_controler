import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import VectorIcon from '../../student_dashboard/components/VectorIcon';
import staffMockData, { getNotificationsForClass } from '../data/staffMockData';

const STATUSBAR_OFFSET = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 16;

export const StaffNotificationsScreen = ({ staffData }) => {
  const staffInfo = staffData || staffMockData.staff;
  const [notifications, setNotifications] = useState(
    getNotificationsForClass(staffInfo.assignedClass)
  );

  useEffect(() => {
    setNotifications(getNotificationsForClass(staffInfo.assignedClass));
  }, [staffData?.email, staffInfo.assignedClass]);

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleToggleRead = (id) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: !n.read } : n))
    );
  };

  const renderNotificationItem = ({ item }) => {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => handleToggleRead(item.id)}
        style={[styles.notificationCard, !item.read && styles.unreadCard]}
      >
        <View style={[styles.iconContainer, !item.read ? styles.unreadIconBg : styles.readIconBg]}>
          <VectorIcon
            name="alert-circle"
            size={18}
            color={!item.read ? '#EF4444' : '#64748B'}
          />
        </View>

        <View style={styles.cardContent}>
          <View style={styles.titleRow}>
            <Text style={styles.studentNameText}>{item.studentName}</Text>
            <Text style={styles.rollNoText}>({item.rollNo})</Text>
          </View>
          <Text style={styles.actionText}>{item.action}</Text>
          <Text style={styles.timeText}>{item.time}</Text>
        </View>

        {!item.read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.titleText}>Notifications</Text>
          <Text style={styles.subtitleText}>
            Compliance alerts for your class
          </Text>
        </View>

        {notifications.some(n => !n.read) && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleMarkAllRead}
            style={styles.markReadBtn}
          >
            <Text style={styles.markReadText}>Mark Read</Text>
          </TouchableOpacity>
        )}
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <VectorIcon name="bell" size={48} color="#94A3B8" />
          <Text style={styles.emptyTitleText}>No Log Alerts</Text>
          <Text style={styles.emptySubtitleText}>
            All classrooms are operating within normal mobile usage limits. No violations reported.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: STATUSBAR_OFFSET,
    paddingHorizontal: 24,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flex: 1,
  },
  titleText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  subtitleText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 2,
  },
  markReadBtn: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  markReadText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  listContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
  },
  notificationCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  unreadCard: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FFF5F5',
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  unreadIconBg: {
    backgroundColor: '#FEE2E2',
  },
  readIconBg: {
    backgroundColor: '#F1F5F9',
  },
  cardContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  studentNameText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
  },
  rollNoText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginTop: 2,
  },
  timeText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#94A3B8',
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    position: 'absolute',
    top: 12,
    right: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitleText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#475569',
    marginTop: 12,
  },
  emptySubtitleText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
});

export default StaffNotificationsScreen;
