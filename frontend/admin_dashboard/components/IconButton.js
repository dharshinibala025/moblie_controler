import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import colors from '../styles/colors';
import { radius } from '../styles/globalStyles';

/**
 * IconButton
 * Small circular icon button used for actions like edit, delete,
 * notifications, and block/unblock triggers.
 *
 * Props:
 * - icon: string (MaterialIcons icon name)
 * - onPress: function
 * - color: string (icon color)
 * - background: string (button background color)
 * - size: number (icon size, default 18)
 */
const IconButton = ({
  icon,
  onPress,
  color = colors.textPrimary,
  background = colors.cardBackground,
  size = 18,
}) => {
  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: background }]}
      onPress={onPress}
      activeOpacity={0.7}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
    >
      <Icon name={icon} size={size} color={color} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
});

export default IconButton;
