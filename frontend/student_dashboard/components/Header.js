import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform, StatusBar } from 'react-native';
import { colors, shadows } from '../styles/theme';
import VectorIcon from './VectorIcon';

const STATUSBAR_OFFSET = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 12 : 16;

export const Header = ({ student, onOpenProfile }) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning,';
    if (hour < 17) return 'Good Afternoon,';
    return 'Good Evening,';
  };

  const getInitials = (name) => {
    if (!name) return 'ST';
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <View style={styles.headerContainer}>
      <View style={styles.leftSection}>
        {/* College Logo Badge */}
        <View style={styles.logoBadge}>
          <Image
            source={require('../../welcome/assets/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* Greeting & Student Info */}
        <View style={styles.textContainer}>
          <Text style={styles.greetingText}>{getGreeting()}</Text>
          <Text style={styles.studentName} numberOfLines={1}>
            {student?.name || 'Student'}
          </Text>
          <View style={styles.subtitleRow}>
            <Text style={styles.departmentText} numberOfLines={1}>
              {student?.department || 'CSE Department'}
            </Text>
            <VectorIcon name="auto-fix" size={14} color="#2563EB" />
          </View>
        </View>
      </View>

      {/* Profile Avatar Button */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onOpenProfile}
        style={styles.avatarButton}
      >
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {getInitials(student?.name)}
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
    paddingHorizontal: 16,
    paddingTop: STATUSBAR_OFFSET,
    paddingBottom: 8,
    backgroundColor: '#F8FAFC',
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
    borderRadius: 23,
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
    marginBottom: 1,
  },
  studentName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    lineHeight: 22,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  departmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
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
