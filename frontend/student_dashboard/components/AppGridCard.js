import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, shadows, borderRadius } from '../styles/theme';
import VectorIcon from './VectorIcon';

export const AppGridCard = ({ blockedApps = [] }) => {
  const filteredApps = blockedApps.filter((app) => app.blocked);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Blocked Applications</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{filteredApps.length} Blocked</Text>
        </View>
      </View>

      {filteredApps.length === 0 ? (
        <View style={styles.emptyCard}>
          <VectorIcon name="shield-check" size={32} color={colors.active} />
          <Text style={styles.emptyText}>
            No applications are currently restricted.
          </Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {filteredApps.map((app) => (
            <View key={app.id} style={styles.appCard}>
              {/* App Icon */}
              <View style={styles.iconContainer}>
                <VectorIcon name={app.icon || 'apps'} size={24} showBg />
              </View>

              {/* App Name */}
              <Text style={styles.appName} numberOfLines={1}>
                {app.name}
              </Text>

              {/* Blocked Badge */}
              <View style={styles.blockedBadge}>
                <Text style={styles.blockedBadgeText}>Blocked</Text>
              </View>
            </View>
          ))}
        </View>
      )}
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
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  countBadge: {
    backgroundColor: colors.blockedLight,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.blocked,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  appCard: {
    width: '31%',
    backgroundColor: colors.card,
    borderRadius: borderRadius.card, // 18px
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  iconContainer: {
    marginBottom: 8,
  },
  appName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  blockedBadge: {
    backgroundColor: colors.blockedLight,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  blockedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.blocked,
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.card,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default AppGridCard;
