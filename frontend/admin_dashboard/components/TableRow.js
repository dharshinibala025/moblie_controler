import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '../styles/colors';
import typography from '../styles/typography';
import { spacing, radius } from '../styles/globalStyles';
import StatusBadge from './StatusBadge';
import IconButton from './IconButton';

/**
 * TableRow
 * Generic row used to represent a single record (student or staff)
 * inside a list styled like a modern data table.
 *
 * Props:
 * - avatarText: string (initials)
 * - avatarColor: string
 * - avatarBackground: string
 * - title: string
 * - subtitle: string
 * - statusLabel: string
 * - statusVariant: 'success' | 'danger' | 'warning' | 'neutral'
 * - onEdit: function
 * - onDelete: function
 * - isLast: boolean
 */
const TableRow = ({
  avatarText,
  avatarColor = colors.primaryBlue,
  avatarBackground = colors.secondaryBackground,
  title,
  subtitle,
  statusLabel,
  statusVariant = 'neutral',
  onEdit,
  onDelete,
  isLast = false,
}) => {
  return (
    <View style={[styles.row, !isLast && styles.divider]}>
      <View style={[styles.avatar, { backgroundColor: avatarBackground }]}>
        <Text style={[styles.avatarText, { color: avatarColor }]}>{avatarText}</Text>
      </View>

      <View style={styles.textWrapper}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
      </View>

      <View style={styles.rightWrapper}>
        {statusLabel ? (
          <StatusBadge label={statusLabel} variant={statusVariant} />
        ) : null}
        <View style={styles.actions}>
          <IconButton icon="edit" onPress={onEdit} color={colors.primaryBlue} />
          <View style={{ width: spacing.xs }} />
          <IconButton icon="delete-outline" onPress={onDelete} color={colors.danger} />
        </View>
      </View>
    </View>
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
  avatar: {
    width: 38,
    height: 38,
    borderRadius: radius.round,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: { ...typography.captionMedium, fontSize: 12 },
  textWrapper: { flex: 1, marginRight: spacing.sm },
  title: { ...typography.bodyMedium, color: colors.textPrimary },
  subtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  rightWrapper: { alignItems: 'flex-end' },
  actions: { flexDirection: 'row', marginTop: spacing.sm },
});

export default TableRow;
