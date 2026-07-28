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
 */
const BottomTabBar = ({ tabs, activeTab, onTabPress }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => onTabPress(tab.key)}
            activeOpacity={0.7}
          >
            <Icon
              name={tab.icon}
              size={22}
              color={isActive ? colors.primaryBlue : colors.textMuted}
            />
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
  label: { ...typography.tabLabel, color: colors.textMuted, marginTop: 2 },
  labelActive: { color: colors.primaryBlue },
});

export default BottomTabBar;
