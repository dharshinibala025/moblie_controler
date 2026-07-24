import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, shadows, borderRadius } from '../styles/theme';

export const NotificationsCard = ({ notifications = [], onViewAll }) => {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Notifications</Text>
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
              {/* Unread Dot Indicator */}
              <View style={styles.statusDotWrapper}>
                {!item.read && <View style={styles.unreadDot} />}
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
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
  },
  statusDotWrapper: {
    width: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
    marginRight: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  contentWrapper: {
    flex: 1,
  },
  messageText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    lineHeight: 20,
  },
  unreadMessageText: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: 4,
  },
});

export default NotificationsCard;
