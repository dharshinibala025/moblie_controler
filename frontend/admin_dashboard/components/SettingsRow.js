import React from 'react';
import { View, Text, TouchableOpacity, Switch, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import colors from '../styles/colors';
import typography from '../styles/typography';
import { spacing, radius } from '../styles/globalStyles';

/**
 * SettingsRow
 * A single row inside a Settings section: icon, label, optional
 * subtitle, and either a chevron (navigational) or a switch (toggle).
 *
 * Props:
 * - icon: string (MaterialIcons icon name)
 * - iconColor, iconBackground: string
 * - label: string
 * - subtitle: string (optional)
 * - type: 'chevron' | 'switch'
 * - value: boolean (for type="switch")
 * - onValueChange: function (for type="switch")
 * - onPress: function (for type="chevron")
 * - danger: boolean (renders label in danger color, e.g. Log out)
 * - isLast: boolean
 */
const SettingsRow = ({
  icon,
  iconColor = colors.primaryBlue,
  iconBackground = colors.secondaryBackground,
  label,
  subtitle,
  type = 'chevron',
  value = false,
  onValueChange,
  onPress,
  danger = false,
  isLast = false,
}) => {
  const content = (
    <View style={[styles.row, !isLast && styles.divider]}>
      <View style={[styles.iconWrapper, { backgroundColor: iconBackground }]}>
        <Icon name={icon} size={18} color={danger ? colors.danger : iconColor} />
      </View>

      <View style={styles.textWrapper}>
        <Text style={[styles.label, danger && styles.dangerText]}>{label}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      {type === 'switch' ? (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: colors.border, true: colors.primaryBlue }}
          thumbColor={colors.white}
        />
      ) : (
        <Icon name="chevron-right" size={20} color={colors.textMuted} />
      )}
    </View>
  );

  if (type === 'switch') {
    return content;
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      {content}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  iconWrapper: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  textWrapper: { flex: 1 },
  label: { ...typography.bodyMedium, color: colors.textPrimary },
  dangerText: { color: colors.danger },
  subtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 1 },
});

export default SettingsRow;
