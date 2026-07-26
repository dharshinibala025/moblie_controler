import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, shadows, borderRadius } from '../styles/theme';

export const RestrictionStatusCard = ({ statusData, onPress }) => {
  const isActive = statusData?.isActive ?? false;
  const statusColor = isActive ? colors.active : colors.blocked;
  const statusBg = isActive ? colors.activeLight : colors.blockedLight;
  const statusTitle = statusData?.statusTitle || (isActive ? 'Restrictions Active' : 'No Restrictions Active');

  const cardContent = (
    <View style={styles.card}>
      {/* Top Banner Row with Large Indicator */}
      <View style={styles.topRow}>
        <View style={styles.statusBadgeRow}>
          <View style={[styles.largeDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusTitle, { color: statusColor }]}>
            {statusTitle}
          </Text>
        </View>
        <View style={[styles.pillBadge, { backgroundColor: statusBg }]}>
          <Text style={[styles.pillBadgeText, { color: statusColor }]}>
            {isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      {/* Main Info Box */}
      <View style={styles.infoContainer}>
        {/* Remaining Time */}
        <View style={styles.timeBlock}>
          <Text style={styles.label}>REMAINING TIME</Text>
          <Text style={styles.remainingTimeText}>
            {statusData?.remainingTime || 'No active restriction'}
          </Text>
        </View>

        <View style={styles.divider} />

        {/* Schedule */}
        <View style={styles.scheduleBlock}>
          <Text style={styles.label}>TODAY'S SCHEDULE</Text>
          <Text style={styles.scheduleText}>
            {statusData?.schedule || 'N/A'}
          </Text>
        </View>
      </View>

      {/* Tap hint when tappable */}
      {onPress && (
        <Text style={styles.tapHint}>Tap to view restriction details →</Text>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
        {cardContent}
      </TouchableOpacity>
    );
  }

  return cardContent;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.card, // 18px
    padding: 20,
    marginHorizontal: 20,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statusBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  largeDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  pillBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  pillBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  infoContainer: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  timeBlock: {
    marginBottom: 12,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  remainingTimeText: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 10,
  },
  scheduleBlock: {},
  scheduleText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  tapHint: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'right',
    marginTop: 10,
  },
});

export default RestrictionStatusCard;

