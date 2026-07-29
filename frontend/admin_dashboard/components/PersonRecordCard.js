import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import colors from '../styles/colors';
import typography from '../styles/typography';
import { spacing, radius, softShadow } from '../styles/globalStyles';
import StatusBadge from './StatusBadge';

/**
 * PersonRecordCard
 * Professional record card for Students and Staff.
 * Displays Avatar, Name, Email, Department, Year, Section / Class Advisor,
 * Account Status, and Action buttons (View, Edit, Delete, Block/Unblock).
 */
const PersonRecordCard = ({
  avatarText,
  avatarColor = colors.primaryBlue,
  name,
  idLabel = 'Register No.',
  idValue,
  email,
  department,
  year,
  section,
  assignedAdvisor,
  accountStatus = 'Active',
  isBlocked = false,
  onView,
  onEdit,
  onDelete,
  onToggleBlock,
}) => {
  return (
    <View style={styles.card}>
      {/* Top Header Section */}
      <View style={styles.topRow}>
        <View style={[styles.avatar, { backgroundColor: colors.secondaryBackground }]}>
          <Text style={[styles.avatarText, { color: avatarColor }]}>{avatarText}</Text>
        </View>
        <View style={styles.infoCol}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          <Text style={styles.meta} numberOfLines={1}>{idLabel}: {idValue}</Text>
          {email ? <Text style={styles.emailText} numberOfLines={1}>{email}</Text> : null}
        </View>
        <StatusBadge
          label={isBlocked ? 'Blocked' : accountStatus}
          variant={isBlocked ? 'danger' : accountStatus === 'Active' ? 'success' : 'warning'}
        />
      </View>

      <View style={styles.divider} />

      {/* Details Chips */}
      <View style={styles.tagsRow}>
        <View style={styles.chip}>
          <Text style={styles.chipText}>{department}</Text>
        </View>
        {year ? (
          <View style={styles.chip}>
            <Text style={styles.chipText}>{year}</Text>
          </View>
        ) : null}
        {section ? (
          <View style={styles.chip}>
            <Text style={styles.chipText}>Sec {section}</Text>
          </View>
        ) : null}
        {assignedAdvisor ? (
          <View style={[styles.chip, { backgroundColor: colors.secondaryBackground }]}>
            <Text style={[styles.chipText, { color: colors.primaryBlue }]}>Advisor: {assignedAdvisor}</Text>
          </View>
        ) : null}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        <View style={styles.leftActions}>
          {onView ? (
            <TouchableOpacity style={styles.actionBtn} onPress={onView} activeOpacity={0.7}>
              <Icon name="visibility" size={16} color={colors.primaryBlue} />
              <Text style={[styles.btnLabel, { color: colors.primaryBlue }]}>View</Text>
            </TouchableOpacity>
          ) : null}

          {onEdit ? (
            <TouchableOpacity style={styles.actionBtn} onPress={onEdit} activeOpacity={0.7}>
              <Icon name="edit" size={16} color={colors.textSecondary} />
              <Text style={[styles.btnLabel, { color: colors.textSecondary }]}>Edit</Text>
            </TouchableOpacity>
          ) : null}

          {onDelete ? (
            <TouchableOpacity style={styles.actionBtn} onPress={onDelete} activeOpacity={0.7}>
              <Icon name="delete-outline" size={16} color={colors.danger} />
              <Text style={[styles.btnLabel, { color: colors.danger }]}>Delete</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {onToggleBlock ? (
          <TouchableOpacity
            style={[styles.blockBtn, isBlocked ? styles.unblockBtnStyle : styles.blockBtnStyle]}
            onPress={onToggleBlock}
            activeOpacity={0.8}
          >
            <Text style={[styles.blockBtnText, isBlocked ? styles.unblockText : styles.blockText]}>
              {isBlocked ? 'Unblock' : 'Block'}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...softShadow,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: radius.round,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    ...typography.bodyMedium,
    fontWeight: '700',
    fontSize: 13,
  },
  infoCol: {
    flex: 1,
    marginRight: spacing.sm,
  },
  name: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 1,
  },
  emailText: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  chip: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radius.sm,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnLabel: {
    ...typography.captionMedium,
    fontSize: 11,
  },
  blockBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.round,
    borderWidth: 1,
  },
  blockBtnStyle: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
  },
  unblockBtnStyle: {
    backgroundColor: colors.successSoft,
    borderColor: colors.success,
  },
  blockBtnText: {
    ...typography.captionMedium,
    fontSize: 11,
    fontWeight: '700',
  },
  blockText: {
    color: colors.danger,
  },
  unblockText: {
    color: colors.success,
  },
});

export default PersonRecordCard;
