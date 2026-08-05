import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '../styles/colors';
import typography from '../styles/typography';
import { spacing, radius } from '../styles/globalStyles';

const VARIANT_COLORS = {
  success: { text: colors.success, background: colors.successSoft },
  danger: { text: colors.danger, background: colors.dangerSoft },
  warning: { text: colors.warning, background: colors.warningSoft },
  neutral: { text: colors.neutral, background: colors.neutralSoft },
};

/**
 * StatusBadge
 * Small colored pill used to represent a status (Active, Blocked,
 * On leave, Connected, etc.).
 *
 * Props:
 * - label: string
 * - variant: 'success' | 'danger' | 'warning' | 'neutral'
 */
const StatusBadge = ({ label, variant = 'neutral' }) => {
  const palette = VARIANT_COLORS[variant] || VARIANT_COLORS.neutral;
  return (
    <View style={[styles.badge, { backgroundColor: palette.background }]}>
      <Text style={[styles.text, { color: palette.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.round,
    alignSelf: 'flex-start',
  },
  text: { ...typography.captionMedium, fontSize: 10 },
});

export default StatusBadge;
