import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { colors, shadows, borderRadius } from '../styles/theme';
import VectorIcon from '../components/VectorIcon';

export const ProfileScreen = ({ student, onLogout }) => {
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
          <Text style={styles.avatarInitials}>{student?.initials || 'RS'}</Text>
        </View>

        <Text style={styles.studentName}>{student?.name || 'Rohit Sharma'}</Text>
        <Text style={styles.regNumber}>Reg. No: {student?.registerNumber || '21CS084'}</Text>

        <View style={styles.deptPill}>
          <Text style={styles.deptPillText}>
            {student?.department || 'CSE Department'}
          </Text>
        </View>
      </View>

      {/* Institutional Controller Note */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <VectorIcon name="shield-check" size={18} color={colors.primary} />
          <Text style={styles.cardTitle}>Department Mobile Controller</Text>
        </View>

        <Text style={styles.policyText}>
          This application operates under view-only mode for students. Mobile application restrictions during class hours (09:00 AM – 04:00 PM) are enforced centrally by the Head of Department (HOD) and Department Admin.
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
    padding: 20,
    paddingBottom: 40,
  },

  heroCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.card, // 18px
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
    borderRadius: borderRadius.card, // 18px
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
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  policyText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    lineHeight: 20,
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
  copyrightText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textMuted,
    textAlign: 'center',
  },
});

export default ProfileScreen;
