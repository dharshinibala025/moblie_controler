import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import { colors, shadows, borderRadius } from '../styles/theme';
import VectorIcon from '../components/VectorIcon';

const STATUSBAR_OFFSET = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 16;

export const AppDetailScreen = ({ app, restrictionStatus, onBack }) => {
  if (!app) return null;

  const isBlocked = app.blocked;
  const statusColor = isBlocked ? colors.blocked : colors.active;
  const statusBg = isBlocked ? colors.blockedLight : colors.activeLight;
  const statusLabel = isBlocked ? 'Currently Blocked' : 'Currently Allowed';

  const infoRows = [
    { label: 'Package Name', value: app.packageName || 'N/A', icon: 'cellphone' },
    { label: 'Category', value: app.category || 'Uncategorized', icon: 'apps' },
    { label: 'Version', value: app.versionName || 'Unknown', icon: 'information' },
    {
      label: 'Scanned At',
      value: app.scannedAt
        ? new Date(app.scannedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : 'N/A',
      icon: 'clock-outline',
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Back Navigation Header */}
      <View style={styles.screenHeader}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <VectorIcon name="chevron-left" size={22} color={colors.primary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Application Details</Text>
        <Text style={styles.screenSubtitle}>Restriction information for this application</Text>
      </View>

      {/* App Hero Card */}
      <View style={styles.heroCard}>
        <View style={styles.appIconCircle}>
          <VectorIcon
            name={app.icon || app.packageName?.includes('social') ? 'cellphone' : 'cellphone'}
            size={32}
            color={colors.primary}
          />
        </View>

        <Text style={styles.appName}>{app.name}</Text>
        <Text style={styles.packageName}>{app.packageName}</Text>

        {/* Status Pill */}
        <View style={[styles.statusPill, { backgroundColor: statusBg }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusPillText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>

      {/* Restriction Status Card */}
      {isBlocked && (
        <View style={[styles.restrictionBanner, { backgroundColor: colors.blockedLight }]}>
          <VectorIcon name="lock" size={20} color={colors.blocked} />
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>Restriction Active</Text>
            <Text style={styles.bannerSubtitle}>
              {restrictionStatus?.schedule
                ? `Blocked during ${restrictionStatus.schedule}`
                : 'Blocked during class hours'}
            </Text>
          </View>
        </View>
      )}

      {!isBlocked && (
        <View style={[styles.restrictionBanner, { backgroundColor: colors.activeLight }]}>
          <VectorIcon name="lock-open" size={20} color={colors.active} />
          <View style={styles.bannerContent}>
            <Text style={[styles.bannerTitle, { color: colors.active }]}>No Restriction</Text>
            <Text style={styles.bannerSubtitle}>This app is currently allowed</Text>
          </View>
        </View>
      )}

      {/* App Info Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <VectorIcon name="information" size={18} color={colors.primary} />
          <Text style={styles.cardTitle}>Application Information</Text>
        </View>

        {infoRows.map((row, i) => (
          <React.Fragment key={row.label}>
            {i > 0 && <View style={styles.rowDivider} />}
            <View style={styles.infoRow}>
              <View style={styles.infoIconBox}>
                <VectorIcon name={row.icon} size={16} color={colors.textMuted} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{row.label}</Text>
                <Text style={styles.infoValue}>{row.value}</Text>
              </View>
            </View>
          </React.Fragment>
        ))}
      </View>

      {/* Policy Info Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <VectorIcon name="shield-check" size={18} color={colors.primary} />
          <Text style={styles.cardTitle}>Policy Information</Text>
        </View>
        <Text style={styles.policyText}>
          {isBlocked
            ? `This application has been restricted by your Department Admin as part of the classroom usage policy. It will be automatically unblocked when restrictions are lifted.`
            : `This application is currently allowed under your classroom policy. It may be restricted during active class hours if the Department Admin enables restrictions.`}
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

  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.card,
    padding: 24,
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  appIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    ...shadows.soft,
  },
  appName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  packageName: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginTop: 12,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusPillText: {
    fontSize: 13,
    fontWeight: '700',
  },

  restrictionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 14,
    borderRadius: borderRadius.card,
    gap: 12,
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.blocked,
  },
  bannerSubtitle: {
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
    alignItems: 'center',
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
  policyText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    lineHeight: 20,
  },
});

export default AppDetailScreen;
