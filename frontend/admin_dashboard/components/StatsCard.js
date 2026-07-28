import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import colors from '../styles/colors';
import typography from '../styles/typography';
import { spacing, radius, softShadow } from '../styles/globalStyles';

/**
 * StatsCard
 * Statistic tile used on the Dashboard screen.
 *
 * Props:
 * - icon: string (MaterialIcons icon name)
 * - label: string
 * - value: string | number
 * - iconColor, iconBackground: string
 * - trend: string (optional, e.g. "+12%")
 * - trendPositive: boolean
 */
const StatsCard = ({
  icon,
  label,
  value,
  iconColor = colors.primaryBlue,
  iconBackground = colors.secondaryBackground,
  trend,
  trendPositive = true,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={[styles.iconWrapper, { backgroundColor: iconBackground }]}>
          <Icon name={icon} size={20} color={iconColor} />
        </View>
        {trend ? (
          <View
            style={[
              styles.trendBadge,
              { backgroundColor: trendPositive ? colors.successSoft : colors.dangerSoft },
            ]}
          >
            <Icon
              name={trendPositive ? 'trending-up' : 'trending-down'}
              size={12}
              color={trendPositive ? colors.success : colors.danger}
            />
            <Text
              style={[
                styles.trendText,
                { color: trendPositive ? colors.success : colors.danger },
              ]}
            >
              {trend}
            </Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...softShadow,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.round,
  },
  trendText: { ...typography.captionMedium, marginLeft: 2 },
  value: { ...typography.statValue, color: colors.textPrimary, marginBottom: 2 },
  label: { ...typography.body, color: colors.textSecondary },
});

export default StatsCard;
