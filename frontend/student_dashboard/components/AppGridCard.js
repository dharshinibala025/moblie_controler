import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, shadows, borderRadius } from '../styles/theme';
import VectorIcon from './VectorIcon';

/**
 * Individual Application Card Component
 */
export const AppCard = ({ app, isBlocked = true }) => {
  return (
    <View style={styles.appCard}>
      <View style={styles.iconContainer}>
        <VectorIcon name={app.icon || 'cellphone'} size={24} color={colors.primary} />
      </View>
      <Text style={styles.appName} numberOfLines={1}>
        {app.name}
      </Text>
      <View
        style={[
          styles.badge,
          { backgroundColor: isBlocked ? colors.blockedLight : colors.activeLight },
        ]}
      >
        <View
          style={[
            styles.badgeDot,
            { backgroundColor: isBlocked ? colors.blocked : colors.active },
          ]}
        />
        <Text
          style={[
            styles.badgeText,
            { color: isBlocked ? colors.blocked : colors.active },
          ]}
        >
          {isBlocked ? 'Blocked' : 'Available'}
        </Text>
      </View>
    </View>
  );
};

/**
 * AppGridCard Component
 *
 * Renders a responsive two-column grid of blocked/available applications.
 */
export const AppGridCard = ({ blockedApps = [], statusMode = 'ACTIVE' }) => {
  const isBlocked = statusMode === 'ACTIVE';

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Blocked Applications</Text>
        <View
          style={[
            styles.countBadge,
            { backgroundColor: isBlocked ? colors.blockedLight : colors.activeLight },
          ]}
        >
          <Text
            style={[
              styles.countBadgeText,
              { color: isBlocked ? colors.blocked : colors.active },
            ]}
          >
            {blockedApps.length} {isBlocked ? 'Blocked' : 'Available'}
          </Text>
        </View>
      </View>

      <View style={styles.grid}>
        {blockedApps.map((app) => (
          <View key={app.id} style={styles.gridColumn}>
            <AppCard app={app} isBlocked={isBlocked} />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginVertical: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  countBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  gridColumn: {
    width: '48%',
  },
  appCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.card, // 18px
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  appName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 4,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
});

export default AppGridCard;
