import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Platform,
  StatusBar,
} from 'react-native';
import { colors, shadows, borderRadius } from '../../student_dashboard/styles/theme';
import VectorIcon from '../../student_dashboard/components/VectorIcon';
import staffMockData from '../data/staffMockData';

const STATUSBAR_OFFSET = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 16;

export const StaffProfileScreen = ({ onLogout }) => {
  const staff = staffMockData.staff;

  const handleLogoutPress = () => {
    Alert.alert(
      'Sign Out Confirmation',
      'Are you sure you want to sign out of the Staff Monitoring Portal?',
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
      <View style={styles.titleSection}>
        <Text style={styles.profileTitleText}>My Staff Profile</Text>
        <Text style={styles.profileSubtext}>
          Your staff account details and system monitoring permissions. This panel is set to read-only under administration rules.
        </Text>
      </View>

      <View style={styles.heroCard}>
        <View style={styles.bannerBackground} />

        <View style={styles.avatarContainer}>
          <Image source={{ uri: staff.avatar }} style={styles.avatarImage} />
          <View style={styles.avatarEditBadge}>
            <VectorIcon name="lock" size={12} color="#FFFFFF" />
          </View>
        </View>

        <Text style={styles.staffName}>{staff.name}</Text>
        <Text style={styles.designation}>{staff.designation}</Text>

        <View style={styles.readOnlyBadge}>
          <VectorIcon name="shield-check" size={14} color="#475569" />
          <Text style={styles.readOnlyBadgeText}>Read-Only Account</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>ACCOUNT INFORMATION</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailsList}>
          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <VectorIcon name="student-id" size={18} color="#2563EB" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>STAFF IDENTIFICATION ID</Text>
              <Text style={styles.detailValue}>{staff.id}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <VectorIcon name="school" size={18} color="#2563EB" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>DEPARTMENT</Text>
              <Text style={styles.detailValue}>{staff.department}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <VectorIcon name="email" size={18} color="#2563EB" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>EMAIL ADDRESS</Text>
              <Text style={styles.detailValue}>{staff.email}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <VectorIcon name="phone" size={18} color="#2563EB" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>MOBILE NUMBER</Text>
              <Text style={styles.detailValue}>{staff.mobile}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <VectorIcon name="shield-account" size={18} color="#2563EB" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>ROLE ASSIGNMENT</Text>
              <Text style={styles.detailValue}>{staff.roleAssignment}</Text>
            </View>
          </View>

          {staff.assignedClass && (
            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <VectorIcon name="school" size={18} color="#2563EB" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>ASSIGNED MENTOR CLASS</Text>
                <Text style={styles.detailValue}>{staff.assignedClass}</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        <TouchableOpacity
          activeOpacity={1}
          style={styles.modifyButtonDisabled}
          disabled={true}
        >
          <VectorIcon name="cog" size={16} color="#94A3B8" />
          <Text style={styles.modifyButtonText}>Modify Details</Text>
        </TouchableOpacity>

        <Text style={styles.warningText}>
          * Profiling adjustments are locked. Contact Administration for modifications.
        </Text>
      </View>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleLogoutPress}
        style={styles.logoutButton}
      >
        <VectorIcon name="logout" size={18} color={colors.danger} />
        <Text style={styles.logoutText}>Sign Out of Portal</Text>
      </TouchableOpacity>

      <Text style={styles.copyrightText}>
        FocusSync Classroom Supervision Portal • Frontend Mockup
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: STATUSBAR_OFFSET,
    paddingBottom: 40,
  },
  titleSection: {
    marginBottom: 16,
  },
  profileTitleText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  profileSubtext: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    lineHeight: 18,
    marginTop: 4,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.card,
    overflow: 'hidden',
    alignItems: 'center',
    paddingBottom: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.card,
  },
  bannerBackground: {
    width: '100%',
    height: 76,
    backgroundColor: '#1E3A8A',
  },
  avatarContainer: {
    marginTop: -40,
    position: 'relative',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    backgroundColor: '#E2E8F0',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#475569',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  staffName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 10,
  },
  designation: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  readOnlyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  readOnlyBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.card,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.card,
  },
  cardHeader: {
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E3A8A',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  detailsList: {
    gap: 14,
    paddingVertical: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginTop: 1,
  },
  modifyButtonDisabled: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 6,
  },
  modifyButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
  },
  warningText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 10,
  },
  logoutButton: {
    backgroundColor: colors.blockedLight,
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    marginTop: 8,
    marginBottom: 16,
    ...shadows.soft,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.danger,
  },
  copyrightText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
    textAlign: 'center',
  },
});

export default StaffProfileScreen;
