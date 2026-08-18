import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  StatusBar,
  NativeModules,
  AppState,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../styles/theme';
import AppGridCard from '../components/AppGridCard';
import VectorIcon from '../components/VectorIcon';

const STATUSBAR_OFFSET = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 16;

const APPS_CACHE_KEY = '@focussync:appsCache';

const FILTER_TABS = [
  { key: 'all', label: 'All Apps' },
  { key: 'blocked', label: 'Blocked' },
  { key: 'unblocked', label: 'Unblocked' },
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const toMinutes = (hhmm) => {
  const [h, m] = String(hhmm || '00:00').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

const isWithinWindow = (policy, now) => {
  if (!policy) return false;
  const dayName = DAYS[now.getDay()];
  const activeDays = policy.activeDays && policy.activeDays.length ? policy.activeDays : [];
  if (activeDays.length > 0 && !activeDays.includes(dayName)) return false;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  return (
    currentMinutes >= toMinutes(policy.scheduleStart) &&
    currentMinutes < toMinutes(policy.scheduleEnd)
  );
};

const format12Hour = (timeStr) => {
  if (!timeStr) return '';
  const parts = String(timeStr).split(':').map(Number);
  if (parts.length < 2) return timeStr;
  let hours = parts[0];
  const minutes = parts[1];
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};

export const AppsScreen = ({ data }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [liveApps, setLiveApps] = useState([]);
  const [policy, setPolicy] = useState(null);
  const [tick, setTick] = useState(Date.now());

  // Derived live restriction state recomputed on every tick (30s) + app resume.
  // The server-computed scheduleActive (IST) takes priority so the banner stays
  // consistent with the backend; device-local time is only a fallback for
  // legacy payloads that lack scheduleActive.
  const restriction = useMemo(() => {
    const now = new Date(tick);
    const p = policy || {};
    const status = p.status || 'inactive';
    const within =
      typeof p.scheduleActive === 'boolean' ? p.scheduleActive : isWithinWindow(p, now);
    const active = status === 'active' && within;
    return {
      active,
      scheduleActive: within,
      status,
      reason: p.restrictionReason || '',
      scheduleStart: p.scheduleStart || '09:00',
      scheduleEnd: p.scheduleEnd || '16:00',
      activeDays: p.activeDays || [],
      source: p.source || 'default',
      nextUnlockAt: p.nextUnlockAt || null,
      blockedPackages: active ? p.blockedPackages || [] : [],
      emergency: p.emergency === 'active',
    };
  }, [policy, tick]);

  const loadPolicy = useCallback(async () => {
    try {
      const syncService = require('../../services/syncService').default;
      const cached = await syncService.getCachedPolicy();
      if (cached) {
        setPolicy(cached);
        return;
      }
    } catch (e) {
      // fall through to props
    }
    // Fallback to dashboard props (older backend responses)
    if (data && (data.restrictionStatus || data.scheduleStart)) {
      setPolicy({
        status: data.restrictionStatus === 'ACTIVE' || data.restrictionStatus === 'active' ? 'active' : 'inactive',
        scheduleStart: data.scheduleStart || '09:00',
        scheduleEnd: data.scheduleEnd || '16:00',
        activeDays: data.activeDays || [],
        restrictionReason: data.restrictionReason || '',
        blockedPackages: data.blockedApps || [],
        source: data.source || 'default',
      });
    }
  }, [data]);

  // Pull policy + server apps on mount, on app resume, and every 60s.
  const refresh = useCallback(async () => {
    let serverApps = null;

    try {
      const { apiFetch } = require('../../services/apiConfig');
      const res = await apiFetch('/student/apps');
      if (res && res.apps) {
        serverApps = res.apps;
      }
    } catch (e) {
      // network error - use fallbacks below
    }

    let sourceApps = null;
    if (serverApps && serverApps.length > 0) {
      sourceApps = serverApps;
    } else {
      try {
        const cached = await AsyncStorage.getItem(APPS_CACHE_KEY);
        if (cached) {
          sourceApps = JSON.parse(cached);
        }
      } catch (e) {
        // ignore
      }
    }

    if (!sourceApps || sourceApps.length === 0) {
      const { AppScannerModule } = NativeModules;
      if (AppScannerModule && AppScannerModule.getInstalledApps) {
        try {
          sourceApps = await AppScannerModule.getInstalledApps();
        } catch (e) {
          // ignore
        }
      }
    }

    if (sourceApps && sourceApps.length > 0) {
      setLiveApps(sourceApps);
    }

    await loadPolicy();
  }, [loadPolicy]);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        const syncService = require('../../services/syncService').default;
        await syncService.sync('apps_screen');
      } catch (e) {
        // continue with local fallbacks
      }
      if (isMounted) {
        await refresh();
      }
    };
    init();

    const interval = setInterval(() => {
      refresh();
    }, 60 * 1000);

    const ticker = setInterval(() => {
      setTick(Date.now());
    }, 30 * 1000);

    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        setTick(Date.now());
        refresh();
      }
    });

    return () => {
      isMounted = false;
      clearInterval(interval);
      clearInterval(ticker);
      sub.remove();
    };
  }, [refresh]);

  // Build unified apps list with per-app blocked property computed live.
  const allApps = useMemo(() => {
    const source =
      liveApps && liveApps.length > 0
        ? liveApps
        : data?.apps && data.apps.length > 0
        ? data.apps
        : data?.blockedApps && data.blockedApps.length > 0
        ? data.blockedApps
        : [];

    const blockedSet = new Set(restriction.blockedPackages || []);

    return source.map((app) => {
      const pkg = app.packageName || app.package;
      const blocked = restriction.active ? blockedSet.has(pkg) : false;
      return {
        ...app,
        name: app.name || app.appName || 'Application',
        blocked,
      };
    });
  }, [liveApps, data, restriction]);

  const filteredApps = useMemo(() => {
    let list = allApps;

    if (activeFilter === 'blocked') {
      list = list.filter((a) => a.blocked === true);
    } else if (activeFilter === 'unblocked') {
      list = list.filter((a) => a.blocked === false);
    }

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

  const isRestrictionActive = restriction.active;
  const bannerColor = isRestrictionActive ? colors.blocked : colors.active;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Screen Header */}
      <View style={styles.screenHeader}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.screenTitle}>Applications</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{allApps.length}</Text>
          </View>
        </View>
        <Text style={styles.screenSubtitle}>
          App restriction status during class hours ({format12Hour(restriction.scheduleStart)} –{' '}
          {format12Hour(restriction.scheduleEnd)})
        </Text>
      </View>

      {/* Live Restriction Status Banner */}
      <View
        style={[
          styles.statusBanner,
          {
            borderColor: isRestrictionActive ? '#FCA5A5' : '#86EFAC',
            backgroundColor: isRestrictionActive ? '#FEF2F2' : '#F0FDF4',
          },
        ]}
      >
        <View style={[styles.statusDot, { backgroundColor: bannerColor }]} />
        <View style={styles.statusBannerTextWrap}>
          <Text style={[styles.statusBannerTitle, { color: bannerColor }]}>
            {isRestrictionActive ? 'Restrictions Active' : 'Restrictions Inactive'}
          </Text>
          <Text style={styles.statusBannerSubtitle} numberOfLines={2}>
            {isRestrictionActive
              ? `${restriction.blockedPackages.length} apps blocked · Unlocks at ${format12Hour(
                  restriction.scheduleEnd,
                )}`
              : restriction.emergency
              ? 'Emergency unblock is active — all apps are accessible.'
              : 'All apps are currently accessible.'}
          </Text>
        </View>
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

      {/* App List */}
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
    marginBottom: 12,
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
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusBannerTextWrap: {
    flex: 1,
  },
  statusBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  statusBannerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
    marginTop: 2,
  },
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
