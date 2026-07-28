import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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
  onPress,
}) => {
  let badgeText = 'ACTIVE';
  let badgeBg = colors.activeLight; // #DCFCE7
  let badgeColor = colors.active; // #22C55E

  if (statusMode === 'LIFTED') {
    badgeText = 'LIFTED';
    badgeBg = '#DCFCE7';
    badgeColor = '#16A34A';
  } else if (statusMode === 'BEFORE') {
    badgeText = 'UPCOMING';
    badgeBg = colors.primaryLight; // #EFF6FF
    badgeColor = colors.primary; // #2563EB
  }

  const cardContent = (
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
  tapHint: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'right',
    marginTop: 10,
  },
});

export default RestrictionStatusCard;

