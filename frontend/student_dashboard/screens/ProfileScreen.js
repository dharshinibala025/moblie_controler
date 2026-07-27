import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { colors, shadows, borderRadius } from '../styles/theme';
import VectorIcon from '../components/VectorIcon';

const STATUSBAR_OFFSET = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 16;

export const ProfileScreen = ({ student, deviceStatus, onOpenDeviceInfo, onOpenSyncStatus, onLogout }) => {
  const initials = student?.name
    ? student.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : 'ST';

  const infoRows = [
    { icon: 'email', label: 'Email', value: student?.email || 'N/A' },
    { icon: 'card-account-details-outline', label: 'Register No.', value: student?.registerNumber || 'N/A' },
    { icon: 'school', label: 'Department', value: student?.department || 'N/A' },
    { icon: 'account-group', label: 'Section', value: student?.section || 'N/A' },
  ];

  const actionRows = [
    {
      icon: 'phone',
      label: 'Device Information',
      sub: deviceStatus?.status ? `Device ${deviceStatus.status}` : 'View details',
      onPress: onOpenDeviceInfo,
    },
    {
      icon: 'refresh',
      label: 'Sync Status',
      sub: deviceStatus?.lastSeenAt
        ? `Last sync: ${new Date(deviceStatus.lastSeenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        : 'Not synced yet',
      onPress: onOpenSyncStatus,
    },
  ];

  const handleLogoutPress = () => {
    Alert.alert(
      'Sign Out Confirmation',
      'Are you sure you want to sign out of Student Portal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: onLogout,
        },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Student Profile Hero Card */}
      <View style={styles.heroCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitials}>{initials}</Text>
        </View>

        <Text style={styles.studentName}>{student?.name || 'Student'}</Text>
        <Text style={styles.regNumber}>Reg. No: {student?.registerNumber || 'N/A'}</Text>

        <View style={styles.deptPill}>
          <Text style={styles.deptPillText}>
            {student?.department || 'Department'}
          </Text>
        </View>
      </View>

      {/* Student Info Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <VectorIcon name="account-circle" size={18} color={colors.primary} />
          <Text style={styles.cardTitle}>Student Information</Text>
        </View>
        {infoRows.map((row, i) => (
          <React.Fragment key={row.label}>
            {i > 0 && <View style={styles.rowDivider} />}
            <View style={styles.infoRow}>
              <VectorIcon name={row.icon} size={16} color={colors.textMuted} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{row.label}</Text>
                <Text style={styles.infoValue}>{row.value}</Text>
              </View>
            </View>
          </React.Fragment>
        ))}
      </View>

      {/* Action Navigation Rows */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <VectorIcon name="cog" size={18} color={colors.primary} />
          <Text style={styles.cardTitle}>Device & Sync</Text>
        </View>
        {actionRows.map((row, i) => (
          <React.Fragment key={row.label}>
            {i > 0 && <View style={styles.rowDivider} />}
            <TouchableOpacity
              style={styles.actionRow}
              activeOpacity={0.7}
              onPress={row.onPress}
            >
              <View style={styles.actionIconCircle}>
                <VectorIcon name={row.icon} size={18} color={colors.primary} />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionLabel}>{row.label}</Text>
                <Text style={styles.actionSub}>{row.sub}</Text>
              </View>
              <VectorIcon name="chevron-right" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </React.Fragment>
        ))}
      </View>

      {/* Institutional Controller Note */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <VectorIcon name="shield-check" size={18} color={colors.primary} />
          <Text style={styles.cardTitle}>Department Mobile Controller</Text>
        </View>
        <Text style={styles.policyText}>
          This application operates under view-only mode for students. Mobile application restrictions during class hours are enforced centrally by the Head of Department (HOD) and Department Admin.
        </Text>
      </View>

      {/* Sign Out Button */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleLogoutPress}
        style={styles.logoutButton}
      >
        <VectorIcon name="logout" size={18} color={colors.danger} />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.copyrightText}>
        Department Controller Student Portal • View Only
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: STATUSBAR_OFFSET,
    paddingBottom: 100,
  },

  heroCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.card,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  avatarCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    ...shadows.soft,
  },
  avatarInitials: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  studentName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  regNumber: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 2,
  },
  deptPill: {
    backgroundColor: colors.primaryLight,
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginTop: 12,
  },
  deptPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
  },

  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.card,
    padding: 18,
    marginBottom: 16,
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
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  actionIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionContent: {
    flex: 1,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  actionSub: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textMuted,
    marginTop: 1,
  },

  policyText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    lineHeight: 20,
  },

  copyrightText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 8,
  },
  logoutButton: {
    backgroundColor: colors.blockedLight,
    height: 50,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    marginTop: 8,
    marginBottom: 16,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.danger,
  },
});

export default ProfileScreen;
