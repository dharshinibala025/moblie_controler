import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, shadows, borderRadius } from '../styles/theme';
import VectorIcon from './VectorIcon';

export const NotificationsCard = ({ notifications = [], onViewAll }) => {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <VectorIcon name="bell" size={22} color={colors.primary} />
          <Text style={styles.sectionTitle}>Notifications</Text>
        </View>
        {onViewAll && (
          <TouchableOpacity activeOpacity={0.7} onPress={onViewAll}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.card}>
        {notifications.map((item, index) => (
          <React.Fragment key={item.id || index}>
            {index > 0 && <View style={styles.divider} />}
            <View style={styles.notificationRow}>
              {/* Notification Bell Icon */}
              <View style={styles.iconWrapper}>
                <VectorIcon name="bell" size={18} color={colors.primary} />
              </View>

              {/* Message Content */}
              <View style={styles.contentWrapper}>
                <Text
                  style={[
                    styles.messageText,
                    !item.read && styles.unreadMessageText,
                  ]}
                >
                  {item.message}
                </Text>
                <Text style={styles.timeText}>{item.time}</Text>
              </View>

              {/* Unread Dot Indicator */}
              {!item.read && <View style={styles.unreadDot} />}
            </View>
          </React.Fragment>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginVertical: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.card, // 18px
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  contentWrapper: {
    flex: 1,
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
    marginTop: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: 8,
  },
});

export default NotificationsCard;
