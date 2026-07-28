import React from 'react';
import { View, StyleSheet } from 'react-native';
import colors from '../styles/colors';
import { spacing, radius, softShadow } from '../styles/globalStyles';

/**
 * DashboardCard
 * Generic rounded card container reused across every screen.
 */
const DashboardCard = ({ children, style, noPadding }) => {
  return (
    <View style={[styles.card, noPadding ? null : styles.padding, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...softShadow,
  },
  padding: { padding: spacing.lg },
});

export default DashboardCard;
