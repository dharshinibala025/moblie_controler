import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  StatusBar,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { colors, borderRadius } from '../styles/theme';
import VectorIcon from '../components/VectorIcon';
import authService from '../../services/authService';
import { EnforcementDiagnosticsScreen } from './EnforcementDiagnosticsScreen';

const STATUSBAR_OFFSET =
  Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 12 : 16;

export const ProfileScreen = ({ student, onLogout, onNavigate }) => {
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  const getInitials = name => {
    if (!name) return 'ST';
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const studentName = student?.name || '';
  const registerNo = student?.registerNumber || '';
  const deptName = student?.fullDepartment || student?.department || '';
  const email = student?.email || '';
  const section = student?.section || '';
  const initials = student?.initials || getInitials(studentName);
  const avatarUrl = student?.avatar;

  const handleLogoutPress = () => {
    Alert.alert(
      'Log Out Confirmation',
      'Are you sure you want to log out of the Student Portal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.logout();
            } catch (err) {
              // Silently ignore network failures on logout
            }
            if (onLogout) {
              onLogout();
            }
          },
        },
      ],
    );
  };

  if (showDiagnostics) {
    return (
      <EnforcementDiagnosticsScreen onBack={() => setShowDiagnostics(false)} />
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Integrated Profile Header */}
      <View style={styles.headerSection}>
        <View style={styles.avatarCircle}>
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              style={styles.avatarImage}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.avatarInitials}>{initials}</Text>
          )}
        </View>

        <Text style={styles.studentName}>{studentName}</Text>
        <Text style={styles.regNumber}>Reg. No: {registerNo}</Text>

        <View style={styles.deptBadge}>
          <VectorIcon name="school" size={14} color="#2563EB" />
          <Text style={styles.deptBadgeText}>{deptName}</Text>
        </View>
      </View>

      {/* Grouped Information List Section */}
      <View style={styles.sectionWrapper}>
        <Text style={styles.sectionHeaderTitle}>STUDENT INFORMATION</Text>
        <View style={styles.groupedContainer}>
          {/* EMAIL */}
          <View style={styles.infoRow}>
            <View style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}>
              <VectorIcon name="email-outline" size={18} color="#2563EB" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email Address</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {email}
              </Text>
            </View>
          </View>

          <View style={styles.rowDivider} />

          {/* REGISTER NO */}
          <View style={styles.infoRow}>
            <View style={[styles.iconBox, { backgroundColor: '#F0FDF4' }]}>
              <VectorIcon
                name="card-account-details-outline"
                size={18}
                color="#16A34A"
              />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Register Number</Text>
              <Text style={styles.infoValue}>{registerNo}</Text>
            </View>
          </View>

          <View style={styles.rowDivider} />

          {/* DEPARTMENT */}
          <View style={styles.infoRow}>
            <View style={[styles.iconBox, { backgroundColor: '#FEF3C7' }]}>
              <VectorIcon name="domain" size={18} color="#D97706" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Department</Text>
              <Text style={styles.infoValue}>{deptName}</Text>
            </View>
          </View>

          <View style={styles.rowDivider} />

          {/* SECTION */}
          <View style={styles.infoRow}>
            <View style={[styles.iconBox, { backgroundColor: '#F3E8FF' }]}>
              <VectorIcon
                name="account-group-outline"
                size={18}
                color="#9333EA"
              />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Section</Text>
              <Text style={styles.infoValue}>
                {section.startsWith('Section') ? section : `Section ${section}`}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* System Policy Information */}
      <View style={styles.sectionWrapper}>
        <Text style={styles.sectionHeaderTitle}>SYSTEM & ACCESS STATUS</Text>
        <View style={styles.policyContainer}>
          <View style={styles.policyHeader}>
            <VectorIcon name="shield-check" size={18} color="#2563EB" />
            <Text style={styles.policyTitle}>Department Mobile Controller</Text>
          </View>
          <Text style={styles.policyText}>
            Student access is set to View-Only. Mobile application restrictions
            during class hours (09:00 AM – 04:00 PM) are enforced centrally by
            the HOD and Department Admin.
          </Text>
        </View>
      </View>

      {/* Diagnostics Action */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setShowDiagnostics(true)}
        style={styles.diagnosticsButton}
      >
        <VectorIcon name="tool" size={18} color="#2563EB" />
        <Text style={styles.diagnosticsText}>Enforcement Diagnostics</Text>
      </TouchableOpacity>

      {/* Logout Action */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleLogoutPress}
        style={styles.logoutButton}
      >
        <VectorIcon name="logout" size={18} color="#DC2626" />
        <Text style={styles.logoutText}>Log Out of Portal</Text>
      </TouchableOpacity>

      <Text style={styles.footerNote}>
        Department Controller Student Portal • v1.2.11
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
    paddingHorizontal: 20,
    paddingTop: STATUSBAR_OFFSET,
    paddingBottom: 100,
  },

  /* Header Section */
  headerSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 8,
  },
  avatarCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 38,
  },
  avatarInitials: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  studentName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
    marginBottom: 3,
  },
  regNumber: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 10,
  },
  deptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  deptBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D4ED8',
  },

  /* Section Wrapper & Grouped Container */
  sectionWrapper: {
    marginBottom: 20,
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  groupedContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
    overflow: 'hidden',
  },

  /* Info Row inside Grouped Container */
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 64,
  },

  /* System Policy Section */
  policyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  policyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  policyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  policyText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    lineHeight: 18,
  },

  /* Diagnostics Button */
  diagnosticsButton: {
    backgroundColor: '#EFF6FF',
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginTop: 12,
    marginBottom: 4,
  },
  diagnosticsText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1D4ED8',
  },

  /* Logout Button */
  logoutButton: {
    backgroundColor: '#FEF2F2',
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    marginTop: 4,
    marginBottom: 16,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },

  footerNote: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 10,
  },
});

export default ProfileScreen;
