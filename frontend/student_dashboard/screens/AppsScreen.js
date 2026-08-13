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

const STATUSBAR_OFFSET = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 16;

const FILTER_TABS = [
  { key: 'all', label: 'All Apps' },
  { key: 'blocked', label: 'Blocked' },
  { key: 'unblocked', label: 'Unblocked' },
];

export const AppsScreen = ({ data }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [liveApps, setLiveApps] = useState([]);

  React.useEffect(() => {
    let isMounted = true;
    const fetchApps = async () => {
      try {
        // Trigger background sync with native scanner
        const syncService = require('../../services/syncService').default;
        await syncService.sync('apps_screen');

        // Fetch live scanned apps from server
        const { apiFetch } = require('../../services/apiConfig');
        const res = await apiFetch('/student/apps');
        if (isMounted && res && res.apps) {
          setLiveApps(res.apps);
        }
      } catch (e) {
        // Fallback to parent prop data if network error
      }
    };
    fetchApps();
    return () => {
      isMounted = false;
    };
  }, []);

  // Build unified apps list with per-app blocked property
  const allApps = useMemo(() => {
    const source =
      liveApps && liveApps.length > 0
        ? liveApps
        : data?.apps && data.apps.length > 0
        ? data.apps
        : data?.blockedApps && data.blockedApps.length > 0
        ? data.blockedApps
        : [];

    // Ensure every app has a "blocked" boolean field
    return source.map((app) => ({
      ...app,
      name: app.name || app.appName || 'Application',
      blocked: app.blocked !== undefined ? app.blocked : true,
    }));
  }, [liveApps, data]);

  const filteredApps = useMemo(() => {
    let list = allApps;

    // Filter by tab
    if (activeFilter === 'blocked') {
      list = list.filter((a) => a.blocked === true);
    } else if (activeFilter === 'unblocked') {
      list = list.filter((a) => a.blocked === false);
    }

    // Filter by search (App Name, Package Name, or Category)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      list = list.filter(
        (a) =>
          (a.name && a.name.toLowerCase().includes(query)) ||
          (a.packageName && a.packageName.toLowerCase().includes(query)) ||
          (a.category && a.category.toLowerCase().includes(query)),
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
      {/* Sleek Mobile Screen Header */}
      <View style={styles.screenHeader}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.screenTitle}>Applications</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{allApps.length}</Text>
          </View>
        </View>
        <Text style={styles.screenSubtitle}>
          App restriction status during class hours (09:00 AM – 04:00 PM)
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
        <VectorIcon name="search" size={18} color="#94A3B8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search applications..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Modern App List Container */}
      <AppGridCard apps={filteredApps} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingTop: STATUSBAR_OFFSET,
    paddingBottom: 100,
  },
  screenHeader: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  countBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563EB',
  },
  screenSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 4,
    lineHeight: 18,
  },

  // Filter Tabs
  filterTabsRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 14,
    backgroundColor: '#E2E8F0',
    borderRadius: 14,
    padding: 3,
    gap: 3,
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 11,
    gap: 5,
  },
  filterTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterTabTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
  filterTabCount: {
    minWidth: 20,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#CBD5E1',
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
    color: '#475569',
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
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginLeft: 8,
  },
  clearText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
});

export default AppsScreen;

