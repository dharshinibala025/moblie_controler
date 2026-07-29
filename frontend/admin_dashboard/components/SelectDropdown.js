import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import colors from '../styles/colors';
import { spacing, radius } from '../styles/globalStyles';

const SelectDropdown = ({ label, value, options = [], onSelect, placeholder, icon, disabled }) => {
  const [visible, setVisible] = useState(false);

  const getLabel = (opt) => (typeof opt === 'string' ? opt : opt.label);
  const getValue = (opt) => (typeof opt === 'string' ? opt : opt.value);

  const selectedOption = options.find((opt) => getValue(opt) === value);
  const displayLabel = selectedOption ? getLabel(selectedOption) : placeholder || 'Select';

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TouchableOpacity
        style={[styles.selector, disabled && styles.selectorDisabled]}
        onPress={() => { if (!disabled) setVisible(true); }}
        activeOpacity={0.7}
        disabled={disabled}
      >
        {icon ? <Icon name={icon} size={16} color={colors.textMuted} /> : null}
        <Text style={[styles.selectedText, !selectedOption && styles.placeholderText]} numberOfLines={1}>
          {displayLabel}
        </Text>
        {!disabled ? <Icon name="keyboard-arrow-down" size={18} color={colors.textMuted} /> : null}
      </TouchableOpacity>

      {visible ? (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
          <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setVisible(false)}>
            <View style={styles.dropdown}>
              <FlatList
                data={options}
                keyExtractor={(item) => getValue(item)}
                renderItem={({ item }) => {
                  const itemValue = getValue(item);
                  const itemLabel = getLabel(item);
                  const isSelected = itemValue === value;
                  return (
                    <TouchableOpacity
                      style={[styles.option, isSelected && styles.optionSelected]}
                      onPress={() => { onSelect(itemValue); setVisible(false); }}
                    >
                      <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                        {itemLabel}
                      </Text>
                      {isSelected ? <Icon name="check" size={16} color={colors.primaryBlue} /> : null}
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: 100,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    gap: 4,
  },
  selectorDisabled: {
    backgroundColor: colors.cardBackground,
    opacity: 0.8,
  },
  selectedText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  placeholderText: {
    color: colors.textMuted,
    fontWeight: '400',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
  },
  dropdown: {
    width: '100%',
    maxWidth: 360,
    maxHeight: 280,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 16 }, android: { elevation: 8 }, default: { elevation: 8 } }),
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  optionSelected: {
    backgroundColor: colors.secondaryBackground,
  },
  optionText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  optionTextSelected: {
    fontWeight: '700',
    color: colors.primaryBlue,
  },
});

export default SelectDropdown;
