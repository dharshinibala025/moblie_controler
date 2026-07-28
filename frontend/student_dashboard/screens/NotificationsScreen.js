import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  StatusBar,
  RefreshControl,
  TouchableOpacity,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { colors, borderRadius } from '../styles/theme';
import VectorIcon from '../components/VectorIcon';
import { markNotificationRead } from '../../services/studentService';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const STATUSBAR_OFFSET = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 12 : 16;

export const NotificationsScreen = ({ data, refreshing, onRefresh, onNotificationRead }) => {
  const [readLocally, setReadLocally] = useState(new Set());
  const [expandedId, setExpandedId] = useState(null);

  const notifications = data?.notifications || [];

  const handleMarkRead = async (id) => {
    if (!readLocally.has(id)) {
      setReadLocally((prev) => new Set([...prev, id]));
      try {
        await markNotificationRead(id);
        onNotificationRead && onNotificationRead();
      } catch {
        // Silently fail
      }
    }
  };

  const handlePressCard = (id, read) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
    if (!read) {
      handleMarkRead(id);
    }
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter((n) => !n.read && !readLocally.has(n._id));
    if (unread.length === 0) return;

    const newRead = new Set(readLocally);
    unread.forEach((n) => newRead.add(n._id));
    setReadLocally(newRead);

    try {
      await Promise.all(unread.map((n) => markNotificationRead(n._id)));
      onNotificationRead && onNotificationRead();
    } catch {}
  };

  const getCategoryMeta = (type) => {
    switch (type) {
      case 'restriction':
        return {
          icon: 'shield-alert',
          color: '#EF4444',
          bg: '#FEE2E2',
          label: 'Policy Alert',
        };
      case 'schedule':
        return {
          icon: 'clock-outline',
          color: '#2563EB',
          bg: '#DBEAFE',
          label: 'Schedule',
        };
      case 'system':
        return {
          icon: 'cellphone-check',
          color: '#64748B',
          bg: '#F1F5F9',
          label: 'System',
        };
      default:
        return {
          icon: 'bullhorn-outline',
          color: '#8B5CF6',
          bg: '#EDE9FE',
          label: 'Announcement',
        };
    }
  };

  const formatTime = (createdAt) => {
    if (!createdAt) return '';
    const date = new Date(createdAt);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  const unreadCount = notifications.filter((n) => !n.read && !readLocally.has(n._id)).length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
    >
      {/* ─── Header ───────────────────────────────────────────────────────────── */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.screenTitle}>Notifications</Text>
          <Text style={styles.screenSubtitle}>Official policy alerts and HOD broadcasts</Text>
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAllRead} activeOpacity={0.7}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ─── Notification List ────────────────────────────────────────────────── */}
      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <VectorIcon name="bell-off-outline" size={32} color="#94A3B8" />
          </View>
          <Text style={styles.emptyTitle}>No Notifications</Text>
          <Text style={styles.emptyText}>
            You're all caught up! Policy announcements and classroom alerts will show here.
          </Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          {notifications.map((item) => {
            const isRead = item.read || readLocally.has(item._id);
            const isExpanded = expandedId === item._id;
            const meta = getCategoryMeta(item.type);

            return (
              <TouchableOpacity
                key={item._id}
                style={[
                  styles.notificationCard,
                  !isRead && styles.unreadCard,
                  { borderLeftColor: meta.color },
                ]}
                activeOpacity={0.85}
                onPress={() => handlePressCard(item._id, isRead)}
              >
                <View style={styles.cardHeader}>
                  {/* Icon */}
                  <View style={[styles.iconWrapper, { backgroundColor: meta.bg }]}>
                    <VectorIcon name={meta.icon} size={20} color={meta.color} />
                  </View>

                  {/* Body Header */}
                  <View style={styles.headerTextWrapper}>
                    <View style={styles.topMetaRow}>
                      <View style={[styles.categoryBadge, { backgroundColor: meta.bg }]}>
                        <Text style={[styles.categoryText, { color: meta.color }]}>{meta.label}</Text>
                      </View>
                      <Text style={styles.timeText}>{formatTime(item.createdAt)}</Text>
                    </View>
                    <Text style={[styles.titleText, !isRead && styles.unreadTitleText]}>
                      {item.title || 'System Notification'}
                    </Text>
                  </View>

                  {!isRead && <View style={styles.unreadDot} />}
                </View>

                {/* Message Body */}
                <Text
                  style={styles.messageText}
                  numberOfLines={isExpanded ? undefined : 2}
                >
                  {item.message}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingTop: STATUSBAR_OFFSET,
    paddingBottom: 110,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
  },
  markAllBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  listContainer: {
    gap: 12,
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 4.5,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  unreadCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTextWrapper: {
    flex: 1,
  },
  topMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  titleText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
    lineHeight: 20,
  },
  unreadTitleText: {
    fontWeight: '800',
    color: '#0F172A',
  },
  messageText: {
    fontSize: 13.5,
    fontWeight: '400',
    color: '#475569',
    lineHeight: 20,
  },
  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#2563EB',
    marginLeft: 8,
    marginTop: 4,
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 36,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 20,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13.5,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default NotificationsScreen;
