import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Platform,
  StatusBar,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { colors, borderRadius, shadows } from '../styles/theme';
import AppGridCard from '../components/AppGridCard';
import VectorIcon from '../components/VectorIcon';

const STATUSBAR_OFFSET = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 16;

export const AppsScreen = ({ data, onSelectApp, refreshing, onRefresh }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const allApps = data?.apps || [];
  const blockedApps = allApps.filter((a) => a.blocked);
  const allowedApps = allApps.filter((a) => !a.blocked);

  const filteredBlocked = blockedApps.filter((a) =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.packageName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAllowed = allowedApps.filter((a) =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.packageName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
    >
      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>Installed Applications</Text>
        <Text style={styles.screenSubtitle}>
          Applications detected on your device — restricted ones are enforced during class hours
        </Text>
      </View>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <VectorIcon name="info" size={16} color={colors.primary} />
        <Text style={styles.infoBannerText}>
          Restrictions are automatically enforced during active class hours. Students have view-only access.
        </Text>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderColor: colors.border }]}>
          <Text style={styles.statNumber}>{allApps.length}</Text>
          <Text style={styles.statLabel}>Total Apps</Text>
        </View>
        <View style={[styles.statCard, { borderColor: '#FEE2E2' }]}>
          <Text style={[styles.statNumber, { color: colors.blocked }]}>{blockedApps.length}</Text>
          <Text style={styles.statLabel}>Blocked</Text>
        </View>
        <View style={[styles.statCard, { borderColor: '#DCFCE7' }]}>
          <Text style={[styles.statNumber, { color: colors.active }]}>{allowedApps.length}</Text>
          <Text style={styles.statLabel}>Allowed</Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <VectorIcon name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search applications..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <Text style={styles.clearText} onPress={() => setSearchQuery('')}>
            Clear
          </Text>
        )}
      </View>

      {/* Blocked Apps Grid */}
      {filteredBlocked.length > 0 && (
        <AppGridCard
          blockedApps={filteredBlocked}
          onSelectApp={onSelectApp}
        />
      )}

      {/* Allowed Apps Section */}
      {filteredAllowed.length > 0 && (
        <View style={styles.allowedSection}>
          <View style={styles.headerRow}>
            <Text style={styles.sectionTitle}>Allowed Applications</Text>
            <View style={[styles.countBadge, { backgroundColor: '#DCFCE7' }]}>
              <Text style={[styles.countBadgeText, { color: colors.active }]}>
                {filteredAllowed.length} Allowed
              </Text>
            </View>
          </View>
          <View style={styles.appList}>
            {filteredAllowed.map((app) => (
              <TouchableOpacity
                key={app.id}
                style={styles.allowedAppRow}
                activeOpacity={0.7}
                onPress={() => onSelectApp && onSelectApp(app)}
              >
                <View style={styles.allowedIconCircle}>
                  <VectorIcon name="cellphone" size={18} color={colors.active} />
                </View>
                <View style={styles.allowedAppInfo}>
                  <Text style={styles.allowedAppName}>{app.name}</Text>
                  <Text style={styles.allowedAppCategory}>{app.category || 'App'}</Text>
                </View>
                <View style={styles.allowedBadge}>
                  <Text style={styles.allowedBadgeText}>Allowed</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Empty state when no search results */}
      {searchQuery.length > 0 && filteredBlocked.length === 0 && filteredAllowed.length === 0 && (
        <View style={styles.emptyCard}>
          <VectorIcon name="search" size={32} color={colors.textMuted} />
          <Text style={styles.emptyText}>No apps matching "{searchQuery}"</Text>
        </View>
      )}

      {/* Empty state when no apps scanned yet */}
      {allApps.length === 0 && (
        <View style={styles.emptyCard}>
          <VectorIcon name="cellphone" size={32} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No Apps Scanned Yet</Text>
          <Text style={styles.emptyText}>
            Your device hasn't submitted an app scan. Open the background service to sync.
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingTop: STATUSBAR_OFFSET,
    paddingBottom: 100,
  },
  screenHeader: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  screenSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },

  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 12,
    borderRadius: borderRadius.card,
    gap: 10,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  infoBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryDark,
    lineHeight: 16,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.card,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: 2,
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginLeft: 8,
  },
  clearText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },

  allowedSection: {
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
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  appList: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.card,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
  },
  allowedAppRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  allowedIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  allowedAppInfo: {
    flex: 1,
  },
  allowedAppName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  allowedAppCategory: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textMuted,
    marginTop: 1,
  },
  allowedBadge: {
    backgroundColor: '#DCFCE7',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  allowedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.active,
  },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.card,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default AppsScreen;
