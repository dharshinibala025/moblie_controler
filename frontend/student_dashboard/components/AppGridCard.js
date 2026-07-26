import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, shadows, borderRadius } from '../styles/theme';
import VectorIcon from './VectorIcon';

export const AppGridCard = ({ blockedApps = [], onSelectApp }) => {
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
            <TouchableOpacity
              key={app.id}
              style={styles.appCard}
              activeOpacity={onSelectApp ? 0.7 : 1}
              onPress={() => onSelectApp && onSelectApp(app)}
            >
              {/* App Icon */}
              <View style={styles.iconContainer}>
                <VectorIcon name={app.icon || 'cellphone'} size={22} color={colors.primary} />
              </View>

              {/* App Name */}
              <Text style={styles.appName} numberOfLines={1}>
                {app.name}
              </Text>

              {/* Blocked Badge */}
              <View style={styles.blockedBadge}>
                <Text style={styles.blockedBadgeText}>Blocked</Text>
              </View>
            </TouchableOpacity>
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
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
