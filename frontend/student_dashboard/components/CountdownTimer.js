import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

/**
 * CountdownTimer Component
 * Premium timeline section inspired by Apple Battery / Microsoft Settings UI.
 * Displays:
 * - Green dot badge + Restriction Active
 * - Remaining Time label & value (e.g. 2 Hours 01 Minute Left)
 * - Thin animated progress indicator bar
 * - Subtext: 71% Completed
 * Uses MaterialCommunityIcons only. Zero emojis, zero cards.
 */
export const CountdownTimer = ({
  statusMode = 'ACTIVE',
  remainingSeconds = 0,
  progress = 0.5,
}) => {
  // Format remaining time into "X Hours Y Minutes Left"
  const formatRemainingText = (totalSec) => {
    if (totalSec <= 0) return '0 Minutes Left';
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);

    if (hrs > 0) {
      return `${hrs} ${hrs === 1 ? 'Hour' : 'Hours'} ${mins} ${mins === 1 ? 'Minute' : 'Minutes'} Left`;
    }
    return `${mins} ${mins === 1 ? 'Minute' : 'Minutes'} Left`;
  };

  const formatHHMMSS = (totalSec) => {
    if (totalSec <= 0) return '00:00:00';
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  // Completed State (After 04:00 PM)
  if (statusMode === 'LIFTED') {
    return (
      <View style={styles.container}>
        <View style={styles.badgeRow}>
          <View style={styles.completedBadge}>
            <MaterialCommunityIcons
              name="shield-check-outline"
              size={15}
              color="#15803D"
            />
            <Text style={styles.completedBadgeText}>Restriction Completed</Text>
          </View>
        </View>

        <View style={styles.valueRow}>
          <Text style={styles.label}>Restriction Status</Text>
          <Text style={styles.value}>100% Completed for today</Text>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: '100%', backgroundColor: '#22C55E' }]} />
        </View>
        <View style={styles.divider} />
      </View>
    );
  }

  // Upcoming State (Before 09:00 AM)
  if (statusMode === 'BEFORE') {
    return (
      <View style={styles.container}>
        <View style={styles.badgeRow}>
          <View style={styles.upcomingBadge}>
            <MaterialCommunityIcons
              name="timer-outline"
              size={15}
              color="#C2410C"
            />
            <Text style={styles.upcomingBadgeText}>Upcoming Restriction</Text>
          </View>
        </View>

        <View style={styles.valueRow}>
          <Text style={styles.label}>Starts In</Text>
          <Text style={styles.value}>{formatHHMMSS(remainingSeconds)}</Text>
        </View>
        <View style={styles.divider} />
      </View>
    );
  }

  // Active State (Between 09:00 AM and 04:00 PM)
  const percentCompleted = Math.max(0, Math.min(100, Math.round((1 - progress) * 100)));

  return (
    <View style={styles.container}>
      {/* 1. Green Dot Badge + Restriction Active */}
      <View style={styles.badgeRow}>
        <View style={styles.activeBadge}>
          <View style={styles.greenDot} />
          <Text style={styles.activeBadgeText}>Restriction Active</Text>
        </View>
      </View>

      {/* 2. Remaining Time Label & Value Row */}
      <View style={styles.valueRow}>
        <View style={styles.labelGroup}>
          <MaterialCommunityIcons
            name="clock-time-four-outline"
            size={20}
            color="#2563EB"
          />
          <Text style={styles.label}>Remaining Time</Text>
        </View>
        <Text style={styles.value}>{formatRemainingText(remainingSeconds)}</Text>
      </View>

      {/* 3. Thin Progress Indicator Bar & Percentage Subtext */}
      <View style={styles.timelineContainer}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${percentCompleted}%` }]} />
        </View>
        <Text style={styles.percentText}>{percentCompleted}% Completed</Text>
      </View>

      <View style={styles.divider} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 14,
    width: '100%',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 14,
    gap: 6,
  },
  greenDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#22C55E',
  },
  activeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 14,
    gap: 6,
  },
  completedBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  upcomingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEDD5',
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 14,
    gap: 6,
  },
  upcomingBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#C2410C',
  },

  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  labelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    color: '#4B5563',
  },
  value: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },

  timelineContainer: {
    marginTop: 10,
  },
  progressTrack: {
    height: 7,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    width: '100%',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563EB', // Royal Blue
    borderRadius: 4,
  },
  percentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 6,
    textAlign: 'right',
  },

  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginTop: 16,
  },
});

export default CountdownTimer;
