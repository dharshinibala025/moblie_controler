import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const ROLES = [
  { id: 'student', title: 'Student', icon: 'school' },
  { id: 'staff', title: 'Staff', icon: 'person' },
  { id: 'admin', title: 'Admin', icon: 'admin-panel-settings' },
];

/**
 * Segmented Control (Pill Selector) Component for Role Selection
 * - Single pill container with background #F1F5F9
 * - Animated sliding indicator with Primary Blue #2563EB
 * - Smooth transition between Student | Staff | Admin
 * - Zero shadows, clean enterprise aesthetic
 */
export const RoleSelector = ({ selectedRole = 'student', onSelectRole }) => {
  const selectedIndex = ROLES.findIndex((r) => r.id === selectedRole);
  const activeIndex = selectedIndex >= 0 ? selectedIndex : 0;

  // Animation value for position sliding (0 to 2)
  const slideAnim = useRef(new Animated.Value(activeIndex)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: activeIndex,
      useNativeDriver: false,
      speed: 18,
      bounciness: 2,
    }).start();
  }, [activeIndex, slideAnim]);

  // Interpolate translateX percentage based on role index (0%, 100%, 200%)
  const translateX = slideAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: ['0%', '100%', '200%'],
  });

  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeader}>SELECT ROLE</Text>

      <View style={styles.segmentedContainer}>
        {/* Animated Sliding Highlight Pill */}
        <Animated.View
          style={[
            styles.animatedIndicator,
            {
              transform: [{ translateX }],
            },
          ]}
        />

        {/* Role Tabs */}
        {ROLES.map((role) => {
          const isSelected = selectedRole === role.id;
          return (
            <TouchableOpacity
              key={role.id}
              activeOpacity={0.8}
              onPress={() => onSelectRole(role.id)}
              style={styles.tabButton}
            >
              <MaterialIcons
                name={role.icon}
                size={18}
                color={isSelected ? '#FFFFFF' : '#6B7280'}
              />
              <Text
                style={[
                  styles.tabText,
                  isSelected ? styles.textSelected : styles.textUnselected,
                ]}
              >
                {role.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    width: '100%',
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 1.2,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  segmentedContainer: {
    flexDirection: 'row',
    height: 48,
    backgroundColor: '#F1F5F9', // Light grey pill background
    borderRadius: 12,
    padding: 4,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  animatedIndicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: '33.33%',
    height: 40,
    backgroundColor: '#2563EB', // Primary Blue
    borderRadius: 8,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    zIndex: 1,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  textSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  textUnselected: {
    color: '#6B7280',
  },
});

export default RoleSelector;
