import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
  StatusBar,
} from 'react-native';
import { colors, shadows, borderRadius } from '../styles/theme';
import VectorIcon from '../components/VectorIcon';

const STATUSBAR_OFFSET = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 16;

export const SyncStatusScreen = ({ deviceStatus, student, onBack, onRefresh, refreshing }) => {
  const lastSync = deviceStatus?.lastSeenAt;

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'Never synced';
    const date = new Date(dateStr);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const timeSinceSync = (dateStr) => {
    if (!dateStr) return null;
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMs / 3600000);
    const days = Math.floor(diffMs / 86400000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} minutes ago`;
    if (hours < 24) return `${hours} hours ago`;
    return `${days} days ago`;
  };

  const isRecentSync = lastSync && (Date.now() - new Date(lastSync).getTime()) < 15 * 60 * 1000;

  const syncRows = [
    {
      icon: 'clock-outline',
      label: 'Last Sync',
      value: formatDateTime(lastSync),
      sub: timeSinceSync(lastSync),
    },
    {
      icon: 'refresh',
      label: 'Sync Status',
      value: deviceStatus?.status === 'online' ? 'Connected' : 'Disconnected',
      valueColor: deviceStatus?.status === 'online' ? colors.active : colors.textMuted,
    },
    {
      icon: 'shield-check',
      label: 'Policy Version',
      value: 'Auto-managed',
      valueColor: colors.textPrimary,
    },
    {
      icon: 'earth',
      label: 'Class Group',
      value: student?.classId || 'N/A',
      valueColor: colors.textPrimary,
    },
  ];

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
      {/* Back Navigation Header */}
      <View style={styles.screenHeader}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <VectorIcon name="chevron-left" size={22} color={colors.primary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Synchronization Status</Text>
        <Text style={styles.screenSubtitle}>
          Policy sync and device connection details
        </Text>
      </View>

      {/* Sync Status Banner */}
      <View style={[
        styles.syncBanner,
        { backgroundColor: isRecentSync ? colors.activeLight : colors.surface }
      ]}>
        <VectorIcon
          name={isRecentSync ? 'check-circle' : 'clock-outline'}
          size={22}
          color={isRecentSync ? colors.active : colors.textMuted}
        />
        <View style={styles.bannerContent}>
          <Text style={[styles.bannerTitle, { color: isRecentSync ? colors.active : colors.textMuted }]}>
            {isRecentSync ? 'Synced Recently' : 'Sync Required'}
          </Text>
          <Text style={styles.bannerSub}>
            {isRecentSync
              ? `Last synced ${timeSinceSync(lastSync)}`
              : 'Open the app to trigger a sync'}
          </Text>
        </View>
      </View>

      {/* Sync Details Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <VectorIcon name="refresh" size={18} color={colors.primary} />
          <Text style={styles.cardTitle}>Sync Details</Text>
        </View>

        {syncRows.map((row, i) => (
          <React.Fragment key={row.label}>
            {i > 0 && <View style={styles.rowDivider} />}
            <View style={styles.infoRow}>
              <View style={styles.infoIconBox}>
                <VectorIcon name={row.icon} size={16} color={colors.textMuted} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{row.label}</Text>
                <Text style={[styles.infoValue, { color: row.valueColor || colors.textPrimary }]}>
                  {row.value}
                </Text>
                {row.sub && (
                  <Text style={styles.infoSub}>{row.sub}</Text>
                )}
              </View>
            </View>
          </React.Fragment>
        ))}
      </View>

      {/* How Sync Works Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <VectorIcon name="information" size={18} color={colors.primary} />
          <Text style={styles.cardTitle}>How Sync Works</Text>
        </View>
        <Text style={styles.policyText}>
          Your device automatically syncs with the server when restrictions change. Pull down on any screen to force a sync. Policy updates are applied in real-time via Firebase notifications when your device is connected.
        </Text>
      </View>
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
    paddingBottom: 40,
  },
  screenHeader: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    gap: 4,
  },
  backText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
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
  },
  syncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 14,
    padding: 14,
    borderRadius: borderRadius.card,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  bannerSub: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.card,
    padding: 18,
    marginHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  rowDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    gap: 10,
  },
  infoIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  infoSub: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textMuted,
    marginTop: 2,
  },
  policyText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    lineHeight: 20,
  },
});

export default SyncStatusScreen;
