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

export const RestrictionInfoScreen = ({ restrictionStatus, onBack }) => {
  const isActive = restrictionStatus?.isActive ?? false;
  const statusColor = isActive ? colors.active : colors.textMuted;
  const statusBg = isActive ? colors.activeLight : colors.surface;

  const schedule = restrictionStatus?.schedule || 'N/A';
  const remaining = restrictionStatus?.remainingTime || null;
  const reason = restrictionStatus?.reason || null;
  const noticeText = restrictionStatus?.noticeText || 'Controlled by Department Admin.';

  const infoRows = [
    {
      icon: 'shield-check',
      label: 'Restriction Status',
      value: isActive ? 'Currently Active' : 'Not Active',
      valueColor: statusColor,
    },
    {
      icon: 'clock-outline',
      label: 'Schedule',
      value: schedule,
      valueColor: colors.textPrimary,
    },
    {
      icon: 'clock-outline',
      label: 'Remaining Time',
      value: remaining || 'No active restriction',
      valueColor: isActive ? colors.textPrimary : colors.textMuted,
    },
  ];

  if (reason) {
    infoRows.push({
      icon: 'information',
      label: 'Reason',
      value: reason,
      valueColor: colors.textSecondary,
    });
  }

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
        <Text style={styles.screenTitle}>Restriction Information</Text>
        <Text style={styles.screenSubtitle}>
          Current policy applied by the Department Admin
        </Text>
      </View>

      {/* Active Status Banner */}
      <View style={[styles.statusBanner, { backgroundColor: statusBg }]}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <View style={styles.bannerContent}>
          <Text style={[styles.bannerTitle, { color: statusColor }]}>
            {isActive ? 'Restrictions Currently Active' : 'No Active Restriction'}
          </Text>
          {isActive && remaining && (
            <Text style={styles.bannerSub}>{remaining}</Text>
          )}
        </View>
      </View>

      {/* Restriction Details Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <VectorIcon name="shield-alert" size={18} color={colors.primary} />
          <Text style={styles.cardTitle}>Restriction Details</Text>
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
                <Text style={[styles.infoValue, { color: row.valueColor || colors.textPrimary }]}>
                  {row.value}
                </Text>
              </View>
            </View>
          </React.Fragment>
        ))}
      </View>

      {/* Notice Card */}
      <View style={[styles.card, styles.noticeCard]}>
        <View style={styles.cardHeader}>
          <VectorIcon name="information" size={18} color={colors.primary} />
          <Text style={styles.cardTitle}>Notice</Text>
        </View>
        <Text style={styles.policyText}>{noticeText}</Text>
      </View>

      {/* Policy Info Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <VectorIcon name="shield-check" size={18} color={colors.primary} />
          <Text style={styles.cardTitle}>About This Policy</Text>
        </View>
        <Text style={styles.policyText}>
          Restrictions are centrally managed by your Department Head of Department (HOD) and Admin. During active class hours, specified applications are automatically blocked to minimize distractions. This is a view-only portal — you cannot modify restrictions.
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
  statusBanner: {
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
  statusDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
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
  noticeCard: {
    backgroundColor: colors.primaryLight,
    borderColor: '#DBEAFE',
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
  policyText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    lineHeight: 20,
  },
});

export default RestrictionInfoScreen;
