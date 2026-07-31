import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, shadows, borderRadius } from '../styles/theme';
import VectorIcon from './VectorIcon';

/**
 * Individual Application Card Component
 * Uses app.blocked boolean to show status per-app.
 */
const resolveAppIcon = (app) => {
  if (app.icon) return app.icon;
  const pkg = (app.packageName || '').toLowerCase();
  const name = (app.name || app.appName || '').toLowerCase();
  const category = (app.category || '').toLowerCase();

  if (pkg.includes('camera') || name.includes('camera')) return 'camera';
  if (pkg.includes('gallery') || name.includes('gallery') || name.includes('photos')) return 'image-multiple';
  if (pkg.includes('calculator') || name.includes('calculator')) return 'calculator';
  if (pkg.includes('chrome') || pkg.includes('browser')) return 'compass-outline';
  if (pkg.includes('youtube') || name.includes('youtube')) return 'youtube';
  if (pkg.includes('whatsapp') || name.includes('whatsapp')) return 'whatsapp';
  if (pkg.includes('instagram') || name.includes('instagram')) return 'instagram';
  if (pkg.includes('facebook') || name.includes('facebook')) return 'facebook';
  if (pkg.includes('spotify') || name.includes('spotify')) return 'spotify';
  if (pkg.includes('telegram') || name.includes('telegram')) return 'paper-plane';
  if (pkg.includes('classroom') || name.includes('classroom')) return 'school';
  if (pkg.includes('zoom') || name.includes('zoom') || name.includes('teams')) return 'video';
  if (category === 'games' || pkg.includes('game')) return 'gamepad-variant';
  if (category === 'social') return 'share-variant';
  if (category === 'educational') return 'school';
  return 'cellphone';
};

export const AppCard = ({ app }) => {
  // Use per-app blocked status; fallback to true if not defined
  const isBlocked = app.blocked !== undefined ? app.blocked : true;
  const iconName = resolveAppIcon(app);

  return (
    <View style={styles.appCard}>
      <View style={[styles.iconContainer, isBlocked ? styles.iconContainerBlocked : styles.iconContainerUnblocked]}>
        <VectorIcon name={iconName} size={24} color={isBlocked ? colors.blocked : colors.active} />
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
          {isBlocked ? 'Blocked' : 'Unblocked'}
        </Text>
      </View>
    </View>
  );
};

/**
 * AppGridCard Component
 *
 * Renders a responsive two-column grid of apps with individual blocked/unblocked status.
 * Accepts `apps` array where each app has a `blocked: boolean` property.
 *
 * Also supports legacy `blockedApps` prop for backward compatibility.
 */
export const AppGridCard = ({ apps = [], blockedApps, statusMode }) => {
  // Support legacy props
  let displayApps = apps;

  // Legacy: if apps empty but blockedApps provided, map them
  if (displayApps.length === 0 && blockedApps && blockedApps.length > 0) {
    const isBlocked = !statusMode || statusMode === 'ACTIVE';
    displayApps = blockedApps.map((app) => ({ ...app, blocked: isBlocked }));
  }

  const blockedCount = displayApps.filter((a) => a.blocked).length;
  const unblockedCount = displayApps.filter((a) => !a.blocked).length;

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>
          {displayApps.length === 0 ? 'Applications' : `Applications (${displayApps.length})`}
        </Text>
        <View style={styles.statsRow}>
          {blockedCount > 0 && (
            <View style={styles.statBadgeRed}>
              <View style={[styles.statDot, { backgroundColor: colors.blocked }]} />
              <Text style={[styles.statBadgeText, { color: colors.blocked }]}>{blockedCount} Blocked</Text>
            </View>
          )}
          {unblockedCount > 0 && (
            <View style={styles.statBadgeGreen}>
              <View style={[styles.statDot, { backgroundColor: colors.active }]} />
              <Text style={[styles.statBadgeText, { color: colors.active }]}>{unblockedCount} Unblocked</Text>
            </View>
          )}
        </View>
      </View>

      {displayApps.length === 0 ? (
        <View style={styles.emptyState}>
          <VectorIcon name="apps" size={40} color={colors.textMuted} />
          <Text style={styles.emptyText}>No applications found</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {displayApps.map((app, idx) => (
            <View key={app.id || idx} style={styles.gridColumn}>
              <AppCard app={app} />
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
    marginBottom: 14,
    flexWrap: 'wrap',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  statBadgeRed: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.blockedLight,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 4,
  },
  statBadgeGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.activeLight,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 4,
  },
  statDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statBadgeText: {
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
    borderRadius: borderRadius.card,
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
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
  },
  iconContainerBlocked: {
    backgroundColor: colors.blockedLight,
    borderColor: '#FECACA',
  },
  iconContainerUnblocked: {
    backgroundColor: colors.activeLight,
    borderColor: '#BBF7D0',
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
});

export default AppGridCard;
