import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, borderRadius } from '../styles/theme';
import VectorIcon from './VectorIcon';

/**
 * Individual Application List Row Component
 * Sleek, high-density row layout designed specifically for mobile screens.
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

export const AppCard = ({ app, isLast }) => {
  // Use per-app blocked status; default to Allowed when not defined
  const isBlocked = app.blocked !== undefined ? app.blocked : false;
  const iconName = resolveAppIcon(app);
  const name = app.name || app.appName || 'Application';
  const category = app.category || app.packageName || 'System Application';

  return (
    <View style={[styles.listRow, !isLast && styles.listRowBorder]}>
      <View style={[styles.iconBox, isBlocked ? styles.iconBoxBlocked : styles.iconBoxUnblocked]}>
        <VectorIcon name={iconName} size={22} color={isBlocked ? colors.blocked : colors.active} />
      </View>

      <View style={styles.appInfo}>
        <Text style={styles.appName} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.appCategory} numberOfLines={1}>
          {category}
        </Text>
      </View>

      {/* Status Badge */}
      <View
        style={[
          styles.statusBadge,
          isBlocked ? styles.statusBadgeBlocked : styles.statusBadgeUnblocked,
        ]}
      >
        <View
          style={[
            styles.statusDot,
            { backgroundColor: isBlocked ? colors.blocked : colors.active },
          ]}
        />
        <Text
          style={[
            styles.statusText,
            { color: isBlocked ? colors.blocked : colors.active },
          ]}
        >
          {isBlocked ? 'Blocked' : 'Allowed'}
        </Text>
      </View>
    </View>
  );
};

/**
 * AppGridCard Component
 * Renders a unified, professional list container for applications on mobile.
 */
export const AppGridCard = ({ apps = [], blockedApps, statusMode }) => {
  let displayApps = apps;

  // Legacy fallback support
  if (displayApps.length === 0 && blockedApps && blockedApps.length > 0) {
    const isBlocked = !statusMode || statusMode === 'ACTIVE';
    displayApps = blockedApps.map((app) => ({ ...app, blocked: isBlocked }));
  }

  if (displayApps.length === 0) {
    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIconCircle}>
          <VectorIcon name="apps" size={32} color={colors.textMuted} />
        </View>
        <Text style={styles.emptyTitle}>No Applications Found</Text>
        <Text style={styles.emptySubtitle}>Try adjusting your filter or search query.</Text>
      </View>
    );
  }

  return (
    <View style={styles.cardContainer}>
      {displayApps.map((app, idx) => (
        <AppCard
          key={app.id || idx}
          app={app}
          isLast={idx === displayApps.length - 1}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  listRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  iconBoxBlocked: {
    backgroundColor: '#FEE2E2',
  },
  iconBoxUnblocked: {
    backgroundColor: '#DCFCE7',
  },
  appInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  appName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  appCategory: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    gap: 6,
  },
  statusBadgeBlocked: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  statusBadgeUnblocked: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 20,
    paddingVertical: 36,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
  },
});

export default AppGridCard;

