import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, shadows, borderRadius } from '../styles/theme';
import VectorIcon from './VectorIcon';

/**
 * RestrictionStatusCard Component
 *
 * Professional read-only card displaying:
 * - Restriction Status (ACTIVE green badge, LIFTED green badge, or UPCOMING blue badge)
 * - Controlled By (Department Admin HOD)
 * - Restriction Time (09:00 AM – 04:00 PM)
 */
export const RestrictionStatusCard = ({
  statusMode = 'ACTIVE',
  scheduleText = '09:00 AM – 04:00 PM',
  controlledBy = 'Department Admin (HOD)',
}) => {
  let badgeText = 'ACTIVE';
  let badgeBg = '#FEF2F2'; // Light Red
  let badgeColor = '#DC2626'; // Deep Red

  if (statusMode === 'LIFTED' || statusMode === 'INACTIVE') {
    badgeText = 'LIFTED';
    badgeBg = '#F0FDF4'; // Light Green
    badgeColor = '#16A34A'; // Green
  } else if (statusMode === 'PAUSED') {
    badgeText = 'PAUSED';
    badgeBg = '#FEF3C7'; // Light Yellow/Amber
    badgeColor = '#D97706'; // Amber
  } else if (statusMode === 'BEFORE') {
    badgeText = 'UPCOMING';
    badgeBg = colors.primaryLight; // #EFF6FF
    badgeColor = colors.primary; // #2563EB
  }

  return (
    <View style={styles.card}>
      {/* Top Title & Badge Row */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <VectorIcon name="shield-account" size={20} color={colors.primary} />
          <Text style={styles.cardTitle}>Restriction Status</Text>
        </View>

        <View style={[styles.badge, { backgroundColor: badgeBg }]}>
          <View style={[styles.badgeDot, { backgroundColor: badgeColor }]} />
          <Text style={[styles.badgeText, { color: badgeColor }]}>{badgeText}</Text>
        </View>
      </View>

      {/* Main Details Box */}
      <View style={styles.detailsContainer}>
        {/* Controlled By */}
        <View style={styles.infoRow}>
          <View style={styles.iconCircle}>
            <VectorIcon name="office-building" size={16} color={colors.primary} />
          </View>
          <View style={styles.textGroup}>
            <Text style={styles.label}>Controlled By</Text>
            <Text style={styles.valueText}>{controlledBy}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Restriction Time */}
        <View style={styles.infoRow}>
          <View style={styles.iconCircle}>
            <VectorIcon name="clock-outline" size={16} color={colors.primary} />
          </View>
          <View style={styles.textGroup}>
            <Text style={styles.label}>Restriction Time</Text>
            <Text style={styles.valueText}>{scheduleText}</Text>
          </View>
        </View>
      </View>
    </View>
  );
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 6,
  },
  badgeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  detailsContainer: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  textGroup: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  valueText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 10,
  },
});

export default RestrictionStatusCard;
