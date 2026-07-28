import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import colors from '../styles/colors';
import typography from '../styles/typography';
import { spacing, radius } from '../styles/globalStyles';

/**
 * SearchBar
 * Reusable search input used on Students and Staff screens.
 *
 * Props:
 * - value: string
 * - onChangeText: function
 * - placeholder: string
 */
const SearchBar = ({ value, onChangeText, placeholder = 'Search' }) => {
  return (
    <View style={styles.container}>
      <Icon name="search" size={18} color={colors.textMuted} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 42,
  },
  input: {
    flex: 1,
    marginLeft: spacing.sm,
    ...typography.body,
    color: colors.textPrimary,
    padding: 0,
  },
});

export default SearchBar;
