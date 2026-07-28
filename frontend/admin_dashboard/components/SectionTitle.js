import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '../styles/colors';
import typography from '../styles/typography';
import { spacing } from '../styles/globalStyles';

/**
 * SectionTitle
 * Section heading with optional subtitle and trailing element.
 */
const SectionTitle = ({ title, subtitle, rightElement }) => {
  return (
    <View style={styles.container}>
      <View style={styles.textWrapper}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {rightElement ? <View>{rightElement}</View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  textWrapper: { flexShrink: 1 },
  title: { ...typography.h3, color: colors.textPrimary },
  subtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
});

export default SectionTitle;
