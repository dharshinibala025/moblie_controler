import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../styles/colors';
import typography from '../styles/typography';
import { spacing } from '../styles/globalStyles';

/**
 * BottomTabBar
 * Self-contained bottom tab bar driven entirely by local state in the
 * parent (AdminPanel). This intentionally does NOT depend on React
 * Navigation or any other routing library -- it only uses components
 * already available in this project (react-native, react-native-vector-icons,
 * react-native-safe-area-context).
 *
 * Props:
 * - tabs: Array<{ key: string, label: string, icon: string }>
 * - activeTab: string
 * - onTabPress: function(key: string)
 * - badgeCounts: object<tabKey, number> — optional badge counts per tab key
 */
const BottomTabBar = ({ tabs, activeTab, onTabPress, badgeCounts = {} }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;
        const badgeCount = badgeCounts[tab.key] || 0;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => onTabPress(tab.key)}
            activeOpacity={0.7}
          >
            <View style={styles.iconWrapper}>
              <Icon
                name={tab.icon}
                size={22}
                color={isActive ? colors.primaryBlue : colors.textMuted}
              />
              {badgeCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {badgeCount > 99 ? '99+' : String(badgeCount)}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: colors.background,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 12,
  },
  label: { ...typography.tabLabel, color: colors.textMuted, marginTop: 2 },
  labelActive: { color: colors.primaryBlue },
});

export default BottomTabBar;

