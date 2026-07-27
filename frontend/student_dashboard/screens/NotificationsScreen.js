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
} from 'react-native';
import { colors, shadows, borderRadius } from '../styles/theme';
import VectorIcon from '../components/VectorIcon';
import { markNotificationRead } from '../../services/studentService';

const STATUSBAR_OFFSET = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 16;

export const NotificationsScreen = ({ data, refreshing, onRefresh, onNotificationRead }) => {
  const [readLocally, setReadLocally] = useState(new Set());

  const notifications = data?.notifications || [];

  const handleMarkRead = async (id) => {
    if (readLocally.has(id)) return;
    setReadLocally((prev) => new Set([...prev, id]));
    try {
      await markNotificationRead(id);
      onNotificationRead && onNotificationRead();
    } catch {
      // Silently fail — UI already updated
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'restriction': return 'shield-alert';
      case 'schedule': return 'clock-outline';
      case 'system': return 'cog';
      default: return 'bell';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'restriction': return colors.blocked;
      case 'schedule': return colors.upcoming;
      case 'system': return colors.textSecondary;
      default: return colors.primary;
    }
  };

  const formatTime = (createdAt) => {
    if (!createdAt) return '';
    const date = new Date(createdAt);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };
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
      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>Notifications</Text>
        <Text style={styles.screenSubtitle}>
          Broadcast updates and policy notifications from Department HOD/Admin
        </Text>
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyCard}>
          <VectorIcon name="bell" size={36} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No Notifications</Text>
          <Text style={styles.emptyText}>
            You have no notifications yet. Policy alerts and broadcast messages will appear here.
          </Text>
        </View>
      ) : (
        <View style={styles.card}>
          {notifications.map((item, index) => {
            const isRead = item.read || readLocally.has(item._id);
            const iconName = getTypeIcon(item.type);
            const iconColor = getTypeColor(item.type);
            const iconBg = isRead ? colors.surface : colors.primaryLight;

            return (
              <React.Fragment key={item._id || index}>
                {index > 0 && <View style={styles.divider} />}
                <TouchableOpacity
                  style={styles.notificationRow}
                  activeOpacity={0.7}
                  onPress={() => !isRead && handleMarkRead(item._id)}
                >
                  {/* Icon */}
                  <View style={[styles.iconWrapper, { backgroundColor: iconBg }]}>
                    <VectorIcon name={iconName} size={18} color={iconColor} />
                  </View>

                  {/* Content */}
                  <View style={styles.contentWrapper}>
                    {item.title ? (
                      <Text style={[styles.titleText, !isRead && styles.unreadTitleText]}>
                        {item.title}
                      </Text>
                    ) : null}
                    <Text style={[styles.messageText, !isRead && styles.unreadMessageText]}>
                      {item.message}
                    </Text>
                    <Text style={styles.timeText}>{formatTime(item.createdAt)}</Text>
                  </View>

                  {/* Unread indicator */}
                  {!isRead && <View style={styles.unreadDot} />}
                </TouchableOpacity>
              </React.Fragment>
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
    lineHeight: 18,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.card,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
    overflow: 'hidden',
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginHorizontal: 16,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentWrapper: {
    flex: 1,
  },
  titleText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 2,
  },
  unreadTitleText: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  messageText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    lineHeight: 18,
  },
  unreadMessageText: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: 3,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: 8,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.card,
    padding: 32,
    alignItems: 'center',
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default NotificationsScreen;
