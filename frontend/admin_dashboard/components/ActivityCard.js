import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import colors from '../styles/colors';
import typography from '../styles/typography';
import { spacing, radius } from '../styles/globalStyles';

/**
 * ActivityCard
 * A single row item used inside the Dashboard's "Recent Activity" list.
 */
const ActivityCard = ({
  icon,
  title,
  description,
  time,
  iconColor = colors.primaryBlue,
  iconBackground = colors.secondaryBackground,
  isLast = false,
  onDelete,
}) => {
  return (
    <View style={[styles.container, !isLast && styles.divider]}>
      <View style={[styles.iconWrapper, { backgroundColor: iconBackground }]}>
        <Icon name={icon} size={18} color={iconColor} />
      </View>
      <View style={styles.textWrapper}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <Text style={styles.description} numberOfLines={1}>{description}</Text>
      </View>
      <View style={styles.rightSection}>
        <Text style={styles.time}>{time}</Text>
        {onDelete ? (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={onDelete}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon name="delete-outline" size={18} color={colors.danger} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  textWrapper: { flex: 1, marginRight: spacing.sm },
  title: { ...typography.bodyMedium, color: colors.textPrimary },
  description: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  rightSection: { flexDirection: 'row', alignItems: 'center' },
  time: { ...typography.caption, color: colors.textSecondary },
  deleteButton: { marginLeft: spacing.sm, padding: 4 },
});

export default ActivityCard;
