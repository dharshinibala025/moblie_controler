import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import colors from '../styles/colors';
import typography from '../styles/typography';
import { spacing, radius, softShadow } from '../styles/globalStyles';
import StatusBadge from './StatusBadge';

/**
 * DeviceCard
 * Represents a single managed device with its connection status and
 * a Block/Unblock control.
 *
 * Props:
 * - name: string
 * - deviceType: string (e.g. "Android phone")
 * - ipAddress: string
 * - lastActive: string
 * - isBlocked: boolean
 * - onToggleBlock: function
 */
const DeviceCard = ({
  name,
  deviceType = 'Android phone',
  ipAddress,
  lastActive,
  isBlocked = false,
  onToggleBlock,
}) => {
  return (
    <View style={styles.card}>
      <View
        style={[
          styles.iconWrapper,
          { backgroundColor: isBlocked ? colors.dangerSoft : colors.successSoft },
        ]}
      >
        <Icon
          name="smartphone"
          size={20}
          color={isBlocked ? colors.danger : colors.success}
        />
      </View>

      <View style={styles.textWrapper}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        <Text style={styles.meta} numberOfLines={1}>{deviceType} &middot; {ipAddress}</Text>
        <Text style={styles.meta} numberOfLines={1}>Last active: {lastActive}</Text>
      </View>

      <View style={styles.rightWrapper}>
        <StatusBadge
          label={isBlocked ? 'Blocked' : 'Active'}
          variant={isBlocked ? 'danger' : 'success'}
        />
        <TouchableOpacity
          style={[styles.actionButton, isBlocked ? styles.unblockButton : styles.blockButton]}
          onPress={onToggleBlock}
          activeOpacity={0.8}
        >
          <Text style={[styles.actionText, isBlocked ? styles.unblockText : styles.blockText]}>
            {isBlocked ? 'Unblock' : 'Block'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...softShadow,
  },
  iconWrapper: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  textWrapper: { flex: 1, marginRight: spacing.sm },
  name: { ...typography.bodyMedium, color: colors.textPrimary },
  meta: { ...typography.caption, color: colors.textSecondary, marginTop: 1 },
  rightWrapper: { alignItems: 'flex-end' },
  actionButton: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.round,
    borderWidth: 1,
  },
  blockButton: { backgroundColor: colors.dangerSoft, borderColor: colors.danger },
  unblockButton: { backgroundColor: colors.successSoft, borderColor: colors.success },
  actionText: { ...typography.captionMedium, fontSize: 11 },
  blockText: { color: colors.danger },
  unblockText: { color: colors.success },
});

export default DeviceCard;
