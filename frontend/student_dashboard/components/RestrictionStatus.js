import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

/**
 * RestrictionStatus Component
 * Single inline status row displaying Restriction Status with shield-check-outline icon
 * and a compact dot indicator. No cards, no shadows, no emojis.
 */
export const RestrictionStatus = ({ statusMode = 'ACTIVE' }) => {
  const isActive = statusMode === 'ACTIVE';

  const statusText = isActive ? 'Active' : 'Inactive';
  const textColor = isActive ? '#15803D' : '#4B5563';
  const dotColor = isActive ? '#22C55E' : '#9CA3AF';
  const iconColor = isActive ? '#2563EB' : '#6B7280';

  return (
    <View style={styles.container}>
      <View style={styles.leftGroup}>
        <MaterialCommunityIcons
          name="shield-check-outline"
          size={22}
          color={iconColor}
        />
        <Text style={styles.titleText}>Restriction Status</Text>
      </View>

      <View style={styles.rightGroup}>
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
        <Text style={[styles.statusText, { color: textColor }]}>
          {statusText}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    marginVertical: 4,
    width: '100%',
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  titleText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 15,
    fontWeight: '700',
  },
});

export default RestrictionStatus;
