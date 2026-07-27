import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

/**
 * RestrictionDetailsPanel Component
 * Unified, enterprise-grade status and schedule panel displayed beneath the clock centerpiece.
 * Integrates:
 * 1. Status Row (shield-check-outline + Green Active Dot)
 * 2. Schedule Row (calendar-clock-outline + 09:00 AM – 04:00 PM)
 * 3. Remaining Time & Progress Row (clock-time-four-outline + Remaining Time + Progress Bar)
 */
export const RestrictionDetailsPanel = ({
  statusMode = 'ACTIVE',
  remainingSeconds = 0,
  progress = 0.5,
  scheduleText = '09:00 AM – 04:00 PM',
}) => {
  const isActive = statusMode === 'ACTIVE';

  // Format remaining time text (e.g. "1 Hour 39 Minutes Left")
  const formatRemainingText = (totalSec) => {
    if (totalSec <= 0) return '0 Minutes Left';
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);

    if (hrs > 0) {
      return `${hrs} ${hrs === 1 ? 'Hour' : 'Hours'} ${mins} ${mins === 1 ? 'Minute' : 'Minutes'} Left`;
    }
    return `${mins} ${mins === 1 ? 'Minute' : 'Minutes'} Left`;
  };

  const percentCompleted = Math.max(0, Math.min(100, Math.round((1 - progress) * 100)));

  return (
    <View style={styles.container}>
      {/* 1. Restriction Status Row */}
      <View style={styles.row}>
        <View style={styles.leftGroup}>
          <MaterialCommunityIcons
            name="shield-check-outline"
            size={20}
            color={isActive ? '#2563EB' : '#6B7280'}
          />
          <Text style={styles.titleText}>Restriction Status</Text>
        </View>

        <View style={styles.activeBadge}>
          <View style={[styles.dot, { backgroundColor: isActive ? '#22C55E' : '#9CA3AF' }]} />
          <Text style={[styles.badgeText, { color: isActive ? '#15803D' : '#4B5563' }]}>
            {isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* 2. Restriction Schedule Row */}
      <View style={styles.row}>
        <View style={styles.leftGroup}>
          <MaterialCommunityIcons
            name="calendar-clock-outline"
            size={20}
            color="#2563EB"
          />
          <Text style={styles.titleText}>Restriction Schedule</Text>
        </View>

        <Text style={styles.valueTextBold}>{scheduleText}</Text>
      </View>

      <View style={styles.divider} />

      {/* 3. Remaining Time & Progress Row */}
      <View style={styles.remainingSection}>
        <View style={styles.row}>
          <View style={styles.leftGroup}>
            <MaterialCommunityIcons
              name="clock-time-four-outline"
              size={20}
              color="#2563EB"
            />
            <Text style={styles.titleText}>Remaining Time</Text>
          </View>

          <Text style={styles.valueTextPrimary}>
            {statusMode === 'LIFTED'
              ? 'Completed for Today'
              : statusMode === 'BEFORE'
              ? 'Upcoming'
              : formatRemainingText(remainingSeconds)}
          </Text>
        </View>

        {isActive && (
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${percentCompleted}%` }]} />
            </View>
            <Text style={styles.progressPercent}>{percentCompleted}% Completed</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  titleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  valueTextBold: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563EB',
  },
  valueTextPrimary: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  remainingSection: {
    paddingVertical: 2,
  },
  progressContainer: {
    marginTop: 4,
    marginBottom: 8,
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
    width: '100%',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 3,
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 4,
    textAlign: 'right',
  },
});

export default RestrictionDetailsPanel;
