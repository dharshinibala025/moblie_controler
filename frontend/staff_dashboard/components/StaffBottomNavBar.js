import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import VectorIcon from '../../student_dashboard/components/VectorIcon';

const TABS = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'students', label: 'Students', icon: 'account-group' },
  { id: 'monitor', label: 'Monitor', icon: 'cellphone' },
  { id: 'notifications', label: 'Notifications', icon: 'bell' },
  { id: 'profile', label: 'Profile', icon: 'account-circle' },
];

const BOTTOM_OFFSET = Platform.OS === 'android' ? 8 : 20;

export const StaffBottomNavBar = ({ activeTab, onSelectTab }) => {
  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            activeOpacity={0.7}
            onPress={() => onSelectTab(tab.id)}
            style={styles.tabButton}
          >
            <VectorIcon
              name={tab.icon}
              size={22}
              color={isActive ? '#2563EB' : '#9CA3AF'}
            />
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
    paddingHorizontal: 8,
    paddingBottom: BOTTOM_OFFSET,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 3,
  },
  tabLabelActive: {
    color: '#2563EB',
    fontWeight: '700',
  },
});

export default StaffBottomNavBar;
