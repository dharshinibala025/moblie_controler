import React from 'react';
import { Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import colors from '../styles/colors';
import typography from '../styles/typography';
import { spacing, radius } from '../styles/globalStyles';

/**
 * FilterChipGroup
 * Reusable horizontal row of selectable chips. Used for both the Year
 * filter and the Section filter on Students/Staff screens, and can be
 * reused for any future single-select chip filter.
 *
 * Props:
 * - options: Array<string>  (e.g. ['All', '1st Year', '2nd Year', ...])
 * - selectedValue: string
 * - onSelect: function(value: string)
 */
const FilterChipGroup = ({ options = [], selectedValue, onSelect }) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {options.map((option) => {
        const isActive = option === selectedValue;
        return (
          <TouchableOpacity
            key={option}
            style={[styles.chip, isActive && styles.chipActive]}
            onPress={() => onSelect(option)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
              {option}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { paddingRight: spacing.lg },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.round,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBackground,
    marginRight: spacing.sm,
  },
  chipActive: {
    backgroundColor: colors.primaryBlue,
    borderColor: colors.primaryBlue,
  },
  chipText: { ...typography.captionMedium, color: colors.textSecondary },
  chipTextActive: { color: colors.white },
});

export default FilterChipGroup;