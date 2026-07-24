import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform, StatusBar } from 'react-native';
import { colors, shadows } from '../styles/theme';

const STATUSBAR_OFFSET = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 12;

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
            {getGreeting()}
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
    paddingTop: STATUSBAR_OFFSET, // Ensures text is positioned comfortably below notch & camera punch-hole
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    padding: 4,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  greetingText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 2,
  },
  studentName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 20,
  },
  departmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 1,
  },
  avatarButton: {
    ...shadows.soft,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default Header;
