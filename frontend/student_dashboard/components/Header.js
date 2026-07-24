import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { colors, shadows } from '../styles/theme';

export const Header = ({ student, onOpenProfile }) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <View style={styles.headerContainer}>
      <View style={styles.leftSection}>
        {/* College Logo */}
        <View style={styles.logoBadge}>
          <Image
            source={require('../../welcome/assets/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* Greeting & Student Info */}
        <View style={styles.textContainer}>
          <Text style={styles.greetingText}>
            {getGreeting()} 👋
          </Text>
          <Text style={styles.studentName} numberOfLines={1}>
            {student?.name || 'Rohit Sharma'}
          </Text>
          <Text style={styles.departmentText} numberOfLines={1}>
            {student?.department || 'CSE Department'}
          </Text>
        </View>
      </View>

      {/* Profile Avatar */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onOpenProfile}
        style={styles.avatarButton}
      >
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {student?.initials || 'RS'}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  logoBadge: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  logoImage: {
    width: 28,
    height: 28,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  greetingText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 2,
  },
  studentName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 22,
  },
  departmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 1,
  },
  avatarButton: {
    ...shadows.soft,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default Header;
