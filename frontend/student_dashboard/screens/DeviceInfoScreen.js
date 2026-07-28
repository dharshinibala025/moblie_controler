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

export const DeviceInfoScreen = ({ student, deviceStatus, onBack }) => {
  const formatLastSeen = (dateStr) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return colors.active;
      case 'offline': return colors.textMuted;
      case 'blocked': return colors.blocked;
      default: return colors.textMuted;
    }
  };

  const statusColor = getStatusColor(deviceStatus?.status);
  const statusBg = deviceStatus?.status === 'online' ? colors.activeLight
    : deviceStatus?.status === 'blocked' ? colors.blockedLight
    : colors.surface;

  const deviceRows = [
    { icon: 'phone', label: 'Device Status', value: deviceStatus?.status ? deviceStatus.status.charAt(0).toUpperCase() + deviceStatus.status.slice(1) : 'Unknown', valueColor: statusColor },
    { icon: 'clock-outline', label: 'Last Seen', value: formatLastSeen(deviceStatus?.lastSeenAt), valueColor: colors.textPrimary },
    { icon: 'shield-check', label: 'MDM Enrollment', value: 'Enrolled', valueColor: colors.active },
    { icon: 'earth', label: 'Institution', value: student?.classId ? `Class: ${student.classId}` : 'KSRCE', valueColor: colors.textPrimary },
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
        <Text style={styles.screenTitle}>Device Information</Text>
        <Text style={styles.screenSubtitle}>
          Device registration and MDM enrollment details
        </Text>
      </View>

      {/* Device Status Banner */}
      <View style={[styles.statusBanner, { backgroundColor: statusBg }]}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <Text style={[styles.statusText, { color: statusColor }]}>
          Device is {deviceStatus?.status || 'Unknown'}
        </Text>
      </View>

      {/* Device Info Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <VectorIcon name="phone" size={18} color={colors.primary} />
          <Text style={styles.cardTitle}>Device Status</Text>
        </View>

        {deviceRows.map((row, i) => (
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

      {/* Policy Note */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <VectorIcon name="shield-account" size={18} color={colors.primary} />
          <Text style={styles.cardTitle}>MDM Enrollment</Text>
        </View>
        <Text style={styles.policyText}>
          Your device is enrolled in the Smart Classroom Mobile Device Management (MDM) system. This allows the Department Admin to enforce app restrictions during class hours. No personal data is accessed.
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
    gap: 10,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
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

export default DeviceInfoScreen;
