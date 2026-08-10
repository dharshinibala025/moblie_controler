import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '../styles/colors';
import typography from '../styles/typography';
import { spacing } from '../styles/globalStyles';

/**
 * Header
 * Reusable top header used by every screen in the Admin Panel.
 *
 * Props:
 * - title: string (e.g. "Dashboard", "Students")
 * - subtitle: string (optional supporting line)
 * - rightElement: React node (optional, e.g. avatar/notification cluster)
 */
const Header = ({ title, subtitle, rightElement }) => {
  return (
    <View style={styles.container}>
      <View style={styles.textWrapper}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {rightElement ? <View style={styles.rightWrapper}>{rightElement}</View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xs,
    backgroundColor: colors.background,
    borderBottomWidth: 0,
    borderTopWidth: 0,
  },
  textWrapper: { flexShrink: 1 },
  title: { ...typography.h1, color: colors.textPrimary },
  subtitle: { ...typography.body, color: colors.textSecondary, marginTop: 2 },
  rightWrapper: { flexDirection: 'row', alignItems: 'center' },
});

export default Header;
