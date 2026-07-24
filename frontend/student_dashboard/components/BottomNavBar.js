import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { colors, shadows } from '../styles/theme';
import VectorIcon from './VectorIcon';

export const BottomNavBar = ({ activeTab = 'home', onSelectTab }) => {
  const tabs = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'apps', label: 'Blocked Apps', icon: 'apps' },
    { id: 'notifications', label: 'Notifications', icon: 'bell', badge: 2 },
    { id: 'profile', label: 'Profile', icon: 'user' },
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
                  size={20}
                  color={isActive ? colors.primary : colors.textMuted}
                />
                {tab.badge && tab.badge > 0 && !isActive && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{tab.badge}</Text>
                  </View>
                )}
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
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -6,
    backgroundColor: colors.primary,
    borderRadius: 8,
    minWidth: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
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

export default BottomNavBar;
