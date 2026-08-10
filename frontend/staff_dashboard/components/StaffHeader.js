import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import VectorIcon from '../../student_dashboard/components/VectorIcon';
import staffMockData from '../data/staffMockData';

const STATUSBAR_OFFSET = 12;

export const StaffHeader = ({ staffInfo: propStaffInfo, onNavigateTab }) => {
  const staffInfo = propStaffInfo || staffMockData.staff;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <View style={styles.headerContainer}>
      <View style={styles.headerLeftGroup}>
        <View style={styles.logoBadge}>
          <Image
            source={require('../../welcome/assets/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
        <View style={styles.textGroup}>
          <Text style={styles.greetingText}>{getGreeting()}</Text>
          <Text style={styles.staffNameText}>{staffInfo.name}</Text>
          <Text style={styles.departmentText}>
            {typeof staffInfo.department === 'string'
              ? staffInfo.department
              : (staffInfo.department?.name || staffInfo.departmentShort || 'Computer Science Engineering')}
          </Text>
        </View>
      </View>

      {onNavigateTab && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onNavigateTab('settings')}
          style={styles.avatarButton}
        >
          <VectorIcon
            name="account-circle-outline"
            size={36}
            color="#2563EB"
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: STATUSBAR_OFFSET,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0,
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    padding: 3,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  textGroup: {
    flex: 1,
  },
  greetingText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  staffNameText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  departmentText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2563EB',
    marginTop: 2,
  },
  avatarButton: {
    padding: 4,
  },
});

export default StaffHeader;
