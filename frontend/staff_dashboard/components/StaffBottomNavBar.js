import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { colors, shadows } from '../../student_dashboard/styles/theme';
import VectorIcon from '../../student_dashboard/components/VectorIcon';

export const StaffBottomNavBar = ({ activeTab = 'dashboard', onSelectTab }) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: 'view-dashboard' },
    { id: 'devices', label: 'Devices', icon: 'cellphone-cog' },
    { id: 'students', label: 'Students', icon: 'account-group' },
    { id: 'settings', label: 'Settings', icon: 'cog' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              activeOpacity={0.8}
              onPress={() => onSelectTab(tab.id)}
              style={styles.tabButton}
            >
              <View style={styles.iconWrapper}>
                <VectorIcon
                  name={tab.icon}
                  size={24}
                  color={isActive ? colors.primary : '#64748B'}
                />
              </View>

              <Text
                style={[
                  styles.tabLabel,
                  isActive && styles.tabLabelActive,
                ]}
              >
                {tab.label}
              </Text>

              {isActive && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#FFFFFF',
  },
  container: {
    flexDirection: 'row',
    height: 64,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingHorizontal: 8,
    ...shadows.medium,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconWrapper: {
    position: 'relative',
    marginBottom: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  tabLabelActive: {
    fontWeight: '700',
    color: colors.primary,
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    width: 28,
    height: 3,
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
});

export default StaffBottomNavBar;
