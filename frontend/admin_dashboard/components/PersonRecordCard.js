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
  deviceStatus = 'Connected',
  isBlocked = false,
  onView,
  onEdit,
  onDelete,
  onToggleBlock,
}) => {
  const isConnected = deviceStatus === 'Connected';

  return (
    <View style={[styles.card, isBlocked && styles.blockedCard]}>
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
            isConnected ? styles.statusConnected : styles.statusDisconnected,
          ]}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isConnected ? colors.success : colors.textMuted },
            ]}
          />
          <Text
            style={[
              styles.statusText,
              { color: isConnected ? colors.success : colors.textSecondary },
            ]}
          >
            {deviceStatus}
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

      {/* Footer Action Row: Block / Unblock Toggle Button */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.blockButton, isBlocked ? styles.unblockButton : styles.blockDangerButton]}
          onPress={onToggleBlock}
          activeOpacity={0.8}
        >
          <MaterialIcons
            name={isBlocked ? 'lock-open' : 'block'}
            size={16}
            color={isBlocked ? colors.success : colors.danger}
          />
          <Text style={[styles.blockButtonText, { color: isBlocked ? colors.success : colors.danger }]}>
            {isBlocked ? 'Unblock Device' : 'Block Device'}
          </Text>
        </TouchableOpacity>
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
    marginTop: spacing.md,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'flex-end',
  },
  blockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 6,
  },
  blockDangerButton: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerSoft,
  },
  unblockButton: {
    borderColor: colors.success,
    backgroundColor: colors.successSoft,
  },
  blockButtonText: {
    ...typography.captionMedium,
    fontWeight: '700',
  },
});

export default PersonRecordCard;
