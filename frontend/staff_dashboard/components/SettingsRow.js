import React from 'react';
import { View, Text, TouchableOpacity, Switch, StyleSheet } from 'react-native';
import VectorIcon from '../../student_dashboard/components/VectorIcon';
import { colors } from '../../student_dashboard/styles/theme';

export const SettingsRow = ({
  icon,
  iconColor = colors.primary || '#2563EB',
  iconBackground = '#EFF6FF',
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
        <VectorIcon name={icon} size={18} color={danger ? '#EF4444' : iconColor} />
      </View>

      <View style={styles.textWrapper}>
        <Text style={[styles.label, danger && styles.dangerText]}>{label}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      {type === 'switch' ? (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: '#E2E8F0', true: colors.primary }}
          thumbColor="#FFFFFF"
        />
      ) : (
        <VectorIcon name="chevron-right" size={20} color="#94A3B8" />
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
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  divider: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  iconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textWrapper: { flex: 1 },
  label: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  dangerText: { color: '#EF4444' },
  subtitle: { fontSize: 11, fontWeight: '500', color: '#64748B', marginTop: 1 },
});

export default SettingsRow;
