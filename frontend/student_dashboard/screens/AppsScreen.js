import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import { colors, borderRadius, shadows } from '../styles/theme';
import AppGridCard from '../components/AppGridCard';
import VectorIcon from '../components/VectorIcon';

import mockData from '../data/mockData';

const STATUSBAR_OFFSET = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 16;

const FILTER_TABS = [
  { key: 'all', label: 'All Apps' },
  { key: 'blocked', label: 'Blocked' },
  { key: 'unblocked', label: 'Unblocked' },
];

export const AppsScreen = ({ data }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  // Build unified apps list with per-app blocked property
  const allApps = useMemo(() => {
    const source =
      data?.apps && data.apps.length > 0
        ? data.apps
        : data?.blockedApps && data.blockedApps.length > 0
        ? data.blockedApps
        : mockData.blockedApps;

    // Ensure every app has a "blocked" boolean field
    return source.map((app) => ({
      ...app,
      // if blocked property missing, treat as blocked (legacy data)
      blocked: app.blocked !== undefined ? app.blocked : true,
    }));
  }, [data]);

  const filteredApps = useMemo(() => {
    let list = allApps;

    // Filter by tab
    if (activeFilter === 'blocked') {
      list = list.filter((a) => a.blocked === true);
    } else if (activeFilter === 'unblocked') {
      list = list.filter((a) => a.blocked === false);
    }

    // Filter by search
    if (searchQuery.trim()) {
      list = list.filter((a) =>
        a.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    return list;
  }, [allApps, activeFilter, searchQuery]);

  const blockedCount = allApps.filter((a) => a.blocked).length;
  const unblockedCount = allApps.filter((a) => !a.blocked).length;

  const getTabCount = (key) => {
    if (key === 'all') return allApps.length;
    if (key === 'blocked') return blockedCount;
    return unblockedCount;
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>Applications</Text>
        <Text style={styles.screenSubtitle}>
          View all applications and their restriction status during class hours
        </Text>
      </View>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <VectorIcon name="info" size={16} color={colors.primary} />
        <Text style={styles.infoBannerText}>
          Restrictions are automatically enforced from 09:00 AM to 04:00 PM. Students have view-only access.
        </Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabsRow}>
        {FILTER_TABS.map((tab) => {
          const isActive = activeFilter === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.filterTab, isActive && styles.filterTabActive]}
              onPress={() => setActiveFilter(tab.key)}
              activeOpacity={0.75}
            >
              <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
                {tab.label}
              </Text>
              <View
                style={[
                  styles.filterTabCount,
                  isActive && styles.filterTabCountActive,
                  tab.key === 'blocked' && isActive && styles.filterTabCountBlocked,
                  tab.key === 'unblocked' && isActive && styles.filterTabCountUnblocked,
                ]}
              >
                <Text
                  style={[
                    styles.filterTabCountText,
                    isActive && styles.filterTabCountTextActive,
                    tab.key === 'blocked' && isActive && { color: colors.blocked },
                    tab.key === 'unblocked' && isActive && { color: colors.active },
                  ]}
                >
                  {getTabCount(tab.key)}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
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

      {/* Apps Grid */}
      <AppGridCard apps={filteredApps} />
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

  // Filter Tabs
  filterTabsRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 14,
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 10,
    gap: 5,
  },
  filterTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  filterTabTextActive: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  filterTabCount: {
    minWidth: 20,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  filterTabCountActive: {
    backgroundColor: '#DBEAFE',
  },
  filterTabCountBlocked: {
    backgroundColor: '#FEE2E2',
  },
  filterTabCountUnblocked: {
    backgroundColor: '#DCFCE7',
  },
  filterTabCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
  },
  filterTabCountTextActive: {
    color: colors.primary,
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
    ...shadows.soft,
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
});

export default AppsScreen;
