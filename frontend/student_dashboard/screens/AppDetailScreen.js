import React, { useState, useEffect, useRef, useCallback } from 'react';
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

const STATUSBAR_HEIGHT =
  Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;

const formatCountdown = (totalSeconds) => {
  const s = Math.max(0, totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return (
    String(h).padStart(2, '0') +
    ':' +
    String(m).padStart(2, '0') +
    ':' +
    String(sec).padStart(2, '0')
  );
};

const getRemainingSeconds = (scheduleEnd) => {
  if (!scheduleEnd) return null;
  const end = new Date(scheduleEnd).getTime();
  if (isNaN(end)) return null;
  return Math.floor((end - Date.now()) / 1000);
};

const CountdownTimer = ({ scheduleEnd }) => {
  const [remaining, setRemaining] = useState(() =>
    getRemainingSeconds(scheduleEnd),
  );
  const timerRef = useRef(null);

  useEffect(() => {
    setRemaining(getRemainingSeconds(scheduleEnd));

    timerRef.current = setInterval(() => {
      const secs = getRemainingSeconds(scheduleEnd);
      setRemaining(secs);
      if (secs !== null && secs <= 0) {
        clearInterval(timerRef.current);
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [scheduleEnd]);

  if (remaining === null) return null;

  return (
    <View style={styles.countdownRow}>
      <VectorIcon name="timer-outline" size={16} color={colors.blocked} />
      <Text style={styles.countdownLabel}>Unblocks in</Text>
      <View style={styles.countdownBadge}>
        <Text style={styles.countdownTime}>{formatCountdown(remaining)}</Text>
      </View>
    </View>
  );
};

export const AppDetailScreen = ({ app, restrictionStatus, onBack }) => {
  const handleBack = useCallback(() => {
    if (onBack) onBack();
  }, [onBack]);

  if (!app) return null;

  const isBlocked = !!app.blocked;
  const statusColor = isBlocked ? colors.blocked : colors.active;
  const statusBg = isBlocked ? colors.blockedLight : colors.activeLight;
  const statusLabel = isBlocked ? 'Blocked' : 'Allowed';
  const statusIcon = isBlocked ? 'lock' : 'lock-open';

  const scheduleEnd = restrictionStatus?.scheduleEnd || null;

  const infoRows = [
    {
      label: 'Package Name',
      value: app.packageName || 'N/A',
      icon: 'cellphone',
    },
    {
      label: 'Category',
      value: app.category || 'Uncategorized',
      icon: 'grid',
    },
    {
      label: 'Version',
      value: app.versionName || 'Unknown',
      icon: 'information',
    },
    {
      label: 'Scanned At',
      value: app.scannedAt
        ? new Date(app.scannedAt).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : 'N/A',
      icon: 'clock',
    },
  ];

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle={Platform.OS === 'ios' ? 'dark-content' : 'dark-content'}
        backgroundColor="#FFFFFF"
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <VectorIcon name="chevron-left" size={20} color={colors.primary} />
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Application Details</Text>
          <Text style={styles.headerSubtitle}>
            Restriction information for this application
          </Text>
        </View>

        {/* App Hero Card */}
        <View style={styles.heroCard}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: statusBg },
            ]}
          >
            <VectorIcon name="cellphone" size={30} color={statusColor} />
          </View>

          <Text style={styles.appName}>{app.name}</Text>
          <Text style={styles.pkgText}>{app.packageName}</Text>

          <View style={[styles.badge, { backgroundColor: statusBg }]}>
            <VectorIcon
              name={statusIcon}
              size={14}
              color={statusColor}
            />
            <Text style={[styles.badgeText, { color: statusColor }]}>
              {statusLabel}
            </Text>
          </View>
        </View>

        {/* Restriction / Allowed Banner */}
        {isBlocked ? (
          <View style={styles.restrictionCard}>
            <View style={styles.restrictionIconWrap}>
              <VectorIcon name="lock" size={22} color={colors.blocked} />
            </View>
            <View style={styles.restrictionContent}>
              <Text style={styles.restrictionTitle}>Restriction Active</Text>
              <Text style={styles.restrictionDesc}>
                {restrictionStatus?.schedule
                  ? `Blocked during ${restrictionStatus.schedule}`
                  : 'Blocked during class hours'}
              </Text>
              <CountdownTimer scheduleEnd={scheduleEnd} />
            </View>
          </View>
        ) : (
          <View style={[styles.restrictionCard, styles.allowedCard]}>
            <View style={[styles.restrictionIconWrap, styles.allowedIconWrap]}>
              <VectorIcon name="lock-open" size={22} color={colors.active} />
            </View>
            <View style={styles.restrictionContent}>
              <Text style={[styles.restrictionTitle, { color: colors.active }]}>
                No Restriction
              </Text>
              <Text style={styles.restrictionDesc}>
                This application is currently allowed
              </Text>
            </View>
          </View>
        )}

        {/* App Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHead}>
            <VectorIcon name="information" size={18} color={colors.primary} />
            <Text style={styles.cardHeadTitle}>Application Information</Text>
          </View>

          {infoRows.map((row, i) => (
            <React.Fragment key={row.label}>
              {i > 0 && <View style={styles.divider} />}
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <VectorIcon
                    name={row.icon}
                    size={15}
                    color={colors.textMuted}
                  />
                </View>
                <View style={styles.infoTextWrap}>
                  <Text style={styles.infoLabel}>{row.label}</Text>
                  <Text style={styles.infoValue}>{row.value}</Text>
                </View>
              </View>
            </React.Fragment>
          ))}
        </View>

        {/* Policy Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHead}>
            <VectorIcon
              name="shield-check"
              size={18}
              color={colors.primary}
            />
            <Text style={styles.cardHeadTitle}>Policy Information</Text>
          </View>
          <Text style={styles.policyText}>
            {isBlocked
              ? 'This application has been restricted by your Department Admin as part of the classroom usage policy. It will be automatically unblocked when restrictions are lifted.'
              : 'This application is currently allowed under your classroom policy. It may be restricted during active class hours if the Department Admin enables restrictions.'}
          </Text>
        </View>

        {/* Return Button */}
        <TouchableOpacity
          style={styles.returnBtn}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <VectorIcon name="home" size={18} color="#FFFFFF" />
          <Text style={styles.returnBtnText}>Return to Home Screen</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scrollContent: {
    paddingTop: STATUSBAR_HEIGHT + 12,
    paddingBottom: 48,
  },

  /* Header */
  header: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: borderRadius.button,
    backgroundColor: colors.primaryLight,
    gap: 4,
    marginBottom: 14,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 4,
  },

  /* Hero Card */
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.card,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  appName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  pkgText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginTop: 14,
    gap: 6,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
  },

  /* Restriction Banner */
  restrictionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 20,
    marginBottom: 14,
    padding: 16,
    borderRadius: borderRadius.card,
    backgroundColor: colors.blockedLight,
    gap: 14,
  },
  allowedCard: {
    backgroundColor: colors.activeLight,
  },
  restrictionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  allowedIconWrap: {
    backgroundColor: '#FFFFFF',
  },
  restrictionContent: {
    flex: 1,
  },
  restrictionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.blocked,
  },
  restrictionDesc: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 2,
  },

  /* Countdown */
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 6,
  },
  countdownLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.blocked,
  },
  countdownBadge: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.blocked,
  },
  countdownTime: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.blocked,
    fontVariant: ['tabular-nums'],
    letterSpacing: 1,
  },

  /* Generic Card */
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.card,
    padding: 18,
    marginHorizontal: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  cardHeadTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  infoIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoTextWrap: {
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

  /* Return Button */
  returnBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 6,
    marginBottom: 20,
    paddingVertical: 15,
    borderRadius: borderRadius.button,
    backgroundColor: colors.primary,
    gap: 8,
    ...shadows.medium,
  },
  returnBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default AppDetailScreen;
