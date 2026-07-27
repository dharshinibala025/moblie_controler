import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

/**
 * Highlighted ScheduleInfo Component
 * Displays a highlighted, premium enterprise banner for Restriction Schedule.
 * Features:
 * - Royal Blue icon badge (#2563EB)
 * - Soft light-blue background container (#EFF6FF) with subtle border (#BFDBFE)
 * - High contrast bold schedule time display (09:00 AM – 04:00 PM)
 * - MaterialCommunityIcons (calendar-clock-outline), zero emojis
 */
export const ScheduleInfo = ({ scheduleText = '09:00 AM – 04:00 PM' }) => {
  return (
    <View style={styles.container}>
      <View style={styles.banner}>
        {/* Left Icon Circle Badge */}
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons
            name="calendar-clock-outline"
            size={20}
            color="#FFFFFF"
          />
        </View>

        {/* Schedule Text Details */}
        <View style={styles.textContainer}>
          <Text style={styles.label}>RESTRICTION SCHEDULE</Text>
          <Text style={styles.timeValue}>{scheduleText}</Text>
        </View>

        {/* Right Status Pill */}
        <View style={styles.pillBadge}>
          <View style={styles.dot} />
          <Text style={styles.pillText}>Active Hours</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    width: '100%',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF', // Soft Royal Blue tint
    borderWidth: 1,
    borderColor: '#BFDBFE', // Subtle blue border
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#2563EB', // Royal Blue accent
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB',
    letterSpacing: 0.8,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  timeValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2563EB',
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
});

export default ScheduleInfo;
