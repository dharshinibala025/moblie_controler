import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import colors from '../styles/colors';
import typography from '../styles/typography';

const ROLES = [
  { id: 'student', title: 'Student', icon: '📘' },
  { id: 'staff', title: 'Staff', icon: '👨‍🏫' },
  { id: 'admin', title: 'Admin', icon: '🛡' },
];

/**
 * RoleItem component with animation
 */
const RoleItem = ({ role, isSelected, onSelect }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.94,
      useNativeDriver: true,
      speed: 20,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.roleWrapper,
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onSelect(role.id)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.roleCard,
          isSelected ? styles.roleCardSelected : styles.roleCardUnselected,
        ]}
      >
        <Text style={styles.roleIcon}>{role.icon}</Text>
        <Text
          style={[
            styles.roleText,
            isSelected
              ? typography.roleTextSelected
              : typography.roleTextUnselected,
          ]}
          numberOfLines={1}
        >
          {role.title}
        </Text>

        {isSelected && <View style={styles.activeDot} />}
      </TouchableOpacity>
    </Animated.View>
  );
};

export const RoleSelector = ({ selectedRole, onSelectRole }) => {
  return (
    <View style={styles.container}>
      <Text style={typography.sectionTitle}>Select Your Role</Text>
      <View style={styles.rolesRow}>
        {ROLES.map((role) => (
          <RoleItem
            key={role.id}
            role={role}
            isSelected={selectedRole === role.id}
            onSelect={onSelectRole}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    width: '100%',
  },
  rolesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  roleWrapper: {
    flex: 1,
  },
  roleCard: {
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 78,
    position: 'relative',
  },
  roleCardSelected: {
    backgroundColor: colors.roleSelectedBg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 0,
  },
  roleCardUnselected: {
    backgroundColor: colors.roleUnselectedBg,
    borderColor: colors.roleUnselectedBorder,
    borderWidth: 1.5,
    elevation: 1,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  roleIcon: {
    fontSize: 22,
    marginBottom: 6,
  },
  roleText: {
    textAlign: 'center',
  },
  activeDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
});

export default RoleSelector;
