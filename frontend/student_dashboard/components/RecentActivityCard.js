import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, shadows, borderRadius } from '../styles/theme';
import VectorIcon from './VectorIcon';

export const RecentActivityCard = ({ activities = [], onViewAll }) => {
  // Only display top 5 items
  const displayActivities = activities.slice(0, 5);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Recent Activity</Text>

      <View style={styles.card}>
        {displayActivities.map((item, index) => {
          const isBlocked = item.type === 'blocked';
          const badgeColor = isBlocked ? colors.blocked : colors.active;
          const badgeBg = isBlocked ? colors.blockedLight : colors.activeLight;

          return (
            <React.Fragment key={item.id || index}>
              {index > 0 && <View style={styles.divider} />}
              <View style={styles.activityRow}>
                {/* Status Indicator Icon */}
                <View style={[styles.iconWrapper, { backgroundColor: badgeBg }]}>
                  <VectorIcon
                    name={isBlocked ? 'lock' : 'lock-open'}
                    size={18}
                    color={badgeColor}
                  />
                </View>

                {/* Event Details */}
                <View style={styles.eventContent}>
                  <View style={styles.eventHeader}>
                    <Text style={styles.eventTitle}>{item.title}</Text>
                    <Text style={styles.eventTime}>{item.time}</Text>
                  </View>
                  <Text style={styles.eventDetails} numberOfLines={2}>
                    {item.details}
                  </Text>
                </View>
              </View>
            </React.Fragment>
          );
        })}

        {/* View All link */}
        {onViewAll && activities.length > 0 && (
          <>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.viewAllRow}
              activeOpacity={0.7}
              onPress={onViewAll}
            >
              <Text style={styles.viewAllText}>View Full Activity Timeline</Text>
              <VectorIcon name="chevron-right" size={16} color={colors.primary} />
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.card, // 18px
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
  },
  iconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  eventContent: {
    flex: 1,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  eventTime: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  eventDetails: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    lineHeight: 18,
  },
  viewAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
});

export default RecentActivityCard;
