import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  StatusBar,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { colors, shadows, borderRadius } from '../styles/theme';
import VectorIcon from '../components/VectorIcon';
import authService from '../../services/authService';

const STATUSBAR_OFFSET = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 16;

export const ProfileScreen = ({ student, onLogout }) => {
  const studentName = student?.name || 'Dharani V V';
  const registerNo = student?.registerNumber || '221CS000';
  const deptName = student?.fullDepartment || student?.department || 'Computer Science and Engineering';
  const email = student?.email || 'vvdharani57cse24_27@ksrce.ac.in';
  const section = student?.section || 'A';
  const initials = student?.initials || 'DV';

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
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Student Profile Hero Card */}
      <View style={styles.heroCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitials}>{initials}</Text>
        </View>

        <Text style={styles.studentName}>{studentName}</Text>
        <Text style={styles.regNumber}>Reg. No: {registerNo}</Text>

        <View style={styles.deptPill}>
          <Text style={styles.deptPillText}>{deptName}</Text>
        </View>
      </View>

      {/* 2. Student Information Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <VectorIcon name="account-outline" size={22} color={colors.primary} />
          <Text style={styles.cardTitle}>Student Information</Text>
        </View>

        <View style={styles.infoList}>
          {/* EMAIL */}
          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <VectorIcon name="email-outline" size={20} color="#94A3B8" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>EMAIL</Text>
              <Text style={styles.infoValue}>{email}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* REGISTER NO. */}
          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <VectorIcon name="card-account-details-outline" size={20} color="#94A3B8" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>REGISTER NO.</Text>
              <Text style={styles.infoValue}>{registerNo}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* DEPARTMENT */}
          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <VectorIcon name="school-outline" size={20} color="#94A3B8" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>DEPARTMENT</Text>
              <Text style={styles.infoValue}>{deptName}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* SECTION */}
          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <VectorIcon name="account-group-outline" size={20} color="#94A3B8" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>SECTION</Text>
              <Text style={styles.infoValue}>{section}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 3. Department Mobile Controller Note */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <VectorIcon name="check-decagram" size={22} color={colors.primary} />
          <Text style={styles.cardTitle}>Department Mobile Controller</Text>
        </View>

        <Text style={styles.policyText}>
          This application operates under view-only mode for students. Mobile application restrictions during class hours are enforced centrally by the Head of Department (HOD) and Department Admin.
        </Text>
      </View>

      {/* 4. Log Out Button */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleLogoutPress}
        style={styles.logoutButton}
      >
        <VectorIcon name="logout" size={18} color={colors.danger} />
        <Text style={styles.logoutText}>Log Out of Portal</Text>
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
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: STATUSBAR_OFFSET,
    paddingBottom: 100,
  },

  /* Hero Card */
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.card || 20,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.card,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary || '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    elevation: 3,
    shadowColor: colors.primary || '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  studentName: {
    fontSize: 21,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  regNumber: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 12,
  },
  deptPill: {
    backgroundColor: colors.primaryLight || '#EFF6FF',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  deptPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark || '#1D4ED8',
  },

  /* Cards */
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.card || 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },

  /* Info List inside Card */
  infoList: {
    marginTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  iconContainer: {
    width: 32,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 2,
  },

  /* Policy text */
  policyText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
    lineHeight: 20,
  },

  /* Log Out Button */
  logoutButton: {
    backgroundColor: colors.blockedLight || '#FEE2E2',
    height: 48,
    borderRadius: borderRadius.button || 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    marginTop: 4,
    marginBottom: 16,
    ...shadows.soft,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.danger || '#EF4444',
  },

  copyrightText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
});

export default ProfileScreen;
