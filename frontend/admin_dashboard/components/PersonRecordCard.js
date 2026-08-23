import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import colors from '../styles/colors';
import typography from '../styles/typography';
import { spacing, radius } from '../styles/globalStyles';

/**
 * PersonRecordCard
 * Professional record card for Students and Staff with status badges,
 * department/year/section pills, and Block/Unblock actions.
 */
const PersonRecordCard = ({
  avatarText = 'ST',
  avatarColor = colors.primaryBlue,
  name,
  idLabel = 'ID',
  idValue,
  email,
  department,
  year,
  section,
  accountStatus,
  deviceStatus = 'No Login',
  isBlocked = false,
  onView,
  onEdit,
  onDelete,
  onToggleBlock,
}) => {
  const isBlockedStatus = isBlocked || accountStatus === 'Blocked' || deviceStatus === 'Blocked' || deviceStatus === 'blocked';
  const isActive = accountStatus === 'Active' || accountStatus === 'active';
  const isLoggedIn = !isBlockedStatus && (isActive || deviceStatus === 'Logged In' || deviceStatus === 'Connected' || deviceStatus === 'active');
  const displayStatus = isBlockedStatus ? 'Blocked' : isLoggedIn ? 'Active' : 'No Login';

  return (
    <View style={[styles.card, isBlockedStatus && styles.blockedCard]}>
      {/* Top Header Row: Avatar, Info, Status Badge */}
      <View style={styles.topRow}>
        <View style={[styles.avatar, { backgroundColor: colors.secondaryBackground }]}>
          <Text style={[styles.avatarText, { color: avatarColor }]}>{avatarText}</Text>
        </View>

        <View style={styles.infoWrapper}>
          <Text style={styles.nameText} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.idText}>
            {idLabel}: {idValue}
          </Text>
          {email ? <Text style={styles.emailText} numberOfLines={1}>{email}</Text> : null}
        </View>

        <View
          style={[
            styles.statusBadge,
            isBlockedStatus
              ? styles.statusDisconnected
              : isLoggedIn
              ? styles.statusConnected
              : styles.statusDisconnected,
            isBlockedStatus && { backgroundColor: '#FEE2E2', borderColor: '#FECACA' },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: isBlockedStatus
                  ? colors.danger
                  : isLoggedIn
                  ? colors.success
                  : colors.textMuted,
              },
            ]}
          />
          <Text
            style={[
              styles.statusText,
              {
                color: isBlockedStatus
                  ? colors.danger
                  : isLoggedIn
                  ? colors.success
                  : colors.textSecondary,
              },
            ]}
          >
            {displayStatus}
          </Text>
        </View>
      </View>

      {/* Middle Details Pill Row */}
      <View style={styles.detailsRow}>
        {department ? (
          <View style={styles.detailPill}>
            <Text style={styles.detailPillText}>{department}</Text>
          </View>
        ) : null}

        {year ? (
          <View style={styles.detailPill}>
            <Text style={styles.detailPillText}>{year}</Text>
          </View>
        ) : null}

        {section ? (
          <View style={styles.detailPill}>
            <Text style={styles.detailPillText}>Sec {section}</Text>
          </View>
        ) : null}
      </View>

      {/* Footer Action Row: View, Edit, Block/Unblock, and Delete Options */}
      <View style={styles.actionRow}>
        {onView ? (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={onView}
            activeOpacity={0.7}
          >
            <MaterialIcons name="visibility" size={15} color={colors.primaryBlue} />
            <Text style={[styles.actionBtnText, { color: colors.primaryBlue }]}>View</Text>
          </TouchableOpacity>
        ) : null}

        {onEdit ? (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={onEdit}
            activeOpacity={0.7}
          >
            <MaterialIcons name="edit" size={15} color={colors.skyBlue || '#0284C7'} />
            <Text style={[styles.actionBtnText, { color: colors.skyBlue || '#0284C7' }]}>Edit</Text>
          </TouchableOpacity>
        ) : null}

        {onToggleBlock ? (
          <TouchableOpacity
            style={[styles.actionBtn, isBlockedStatus ? styles.unblockBtn : styles.blockBtn]}
            onPress={onToggleBlock}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name={isBlockedStatus ? 'lock-open' : 'block'}
              size={15}
              color={isBlockedStatus ? '#D97706' : colors.danger}
            />
            <Text style={[styles.actionBtnText, { color: isBlockedStatus ? '#D97706' : colors.danger }]}>
              {isBlockedStatus ? 'Unblock' : 'Block'}
            </Text>
          </TouchableOpacity>
        ) : null}

        {onDelete ? (
          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBtn]}
            onPress={onDelete}
            activeOpacity={0.7}
          >
            <MaterialIcons name="delete-outline" size={15} color={colors.danger} />
            <Text style={[styles.actionBtnText, { color: colors.danger }]}>Delete</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  blockedCard: {
    borderColor: colors.dangerSoft,
    backgroundColor: '#FEF2F2',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.round,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  avatarText: {
    ...typography.bodyMedium,
    fontWeight: '700',
  },
  infoWrapper: {
    flex: 1,
    marginRight: spacing.xs,
  },
  nameText: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  idText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  emailText: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.round,
  },
  statusConnected: {
    backgroundColor: colors.successSoft,
  },
  statusDisconnected: {
    backgroundColor: colors.inputBackground,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: radius.round,
    marginRight: 6,
  },
  statusText: {
    ...typography.captionMedium,
    fontSize: 11,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  detailPill: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  detailPillText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: spacing.md,
    paddingTop: spacing.xs + 2,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.xs,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    gap: 4,
  },
  deleteBtn: {
    borderColor: '#FCA5A5',
    backgroundColor: colors.dangerSoft,
  },
  blockBtn: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  unblockBtn: {
    borderColor: '#FCD34D',
    backgroundColor: '#FFFBEB',
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
});

export default PersonRecordCard;
