import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import colors from '../styles/colors';
import typography from '../styles/typography';
import { spacing, radius } from '../styles/globalStyles';

/**
 * FilterButton
 * Toggleable filter trigger placed next to a SearchBar.
 *
 * Props:
 * - label: string
 * - active: boolean
 * - onPress: function
 */
const FilterButton = ({ label = 'Filter', active = false, onPress }) => {
  return (
    <TouchableOpacity
      style={[styles.button, active && styles.buttonActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Icon name="tune" size={16} color={active ? colors.white : colors.primaryBlue} />
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primaryBlue,
    backgroundColor: colors.secondaryBackground,
  },
  buttonActive: { backgroundColor: colors.primaryBlue },
  label: { ...typography.captionMedium, color: colors.primaryBlue, marginLeft: spacing.xs },
  labelActive: { color: colors.white },
});

export default FilterButton;
