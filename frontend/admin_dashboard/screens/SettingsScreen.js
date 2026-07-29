import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import Header from '../components/Header';
import SectionTitle from '../components/SectionTitle';
import DashboardCard from '../components/DashboardCard';
import SettingsRow from '../components/SettingsRow';

import colors from '../styles/colors';
import typography from '../styles/typography';
import { spacing, radius, softShadow } from '../styles/globalStyles';

/**
 * SettingsScreen (Admin Profile)
 * Professional Admin Profile page matching exact specifications:
 * - Admin Profile Avatar / Photo
 * - Admin Name, Employee ID, Department, Email, Phone Number
 * - Edit Profile Modal
 * - Change Password Modal
 * - Working Logout returning to Login page
 * - Strictly excludes Dark Mode, About, Privacy, Help & Support as requested.
 */
const SettingsScreen = ({ onLogout }) => {
  // Admin Profile State
  const [adminProfile, setAdminProfile] = useState({
    name: 'Dr. K. Ramanathan',
    employeeId: 'ADM-HOD-2024',
    department: 'Computer Science & Engineering (HOD)',
    email: 'hod.cse@ksrce.ac.in',
    phone: '+91 98765 43210',
  });

  // Edit Profile Modal State
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [profileForm, setProfileForm] = useState({ ...adminProfile });

  // Change Password Modal State
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSaveProfile = () => {
    if (!profileForm.name || !profileForm.email) {
      Alert.alert('Required Fields', 'Please fill in Admin Name and Email.');
      return;
    }
    setAdminProfile({ ...profileForm });
    setEditProfileVisible(false);
    Alert.alert('Profile Updated', 'Admin profile details have been saved.');
  };

  const handleSavePassword = () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      Alert.alert('Required Fields', 'Please fill in current and new password.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      Alert.alert('Password Mismatch', 'New password and confirmation do not match.');
      return;
    }
    setChangePasswordVisible(false);
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    Alert.alert('Password Updated', 'Admin account password updated successfully.');
  };

  const handleLogoutPress = () => {
    Alert.alert(
      'Sign Out Confirmation',
      'Are you sure you want to log out of the Admin Portal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => {
            if (onLogout) {
              onLogout();
            }
          },
        },
      ],
    );
  };

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Header title="Admin Profile" subtitle="Manage account details & security settings" />

      {/* Admin Profile Hero Card */}
      <View style={styles.section}>
        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Icon name="admin-panel-settings" size={32} color={colors.white} />
          </View>
          <Text style={styles.profileName}>{adminProfile.name}</Text>
          <Text style={styles.profileEmpId}>ID: {adminProfile.employeeId}</Text>
          <View style={styles.deptBadge}>
            <Text style={styles.deptBadgeText}>{adminProfile.department}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.contactDetails}>
            <View style={styles.infoRow}>
              <Icon name="email" size={16} color={colors.primaryBlue} />
              <Text style={styles.infoText}>{adminProfile.email}</Text>
            </View>
            <View style={styles.infoRow}>
              <Icon name="phone" size={16} color={colors.primaryBlue} />
              <Text style={styles.infoText}>{adminProfile.phone}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Account Settings Section */}
      <View style={styles.section}>
        <SectionTitle title="Account Management" />
        <DashboardCard noPadding>
          <SettingsRow
            icon="person-outline"
            label="Edit Profile"
            subtitle="Update name, email, phone number, or department"
            onPress={() => {
              setProfileForm({ ...adminProfile });
              setEditProfileVisible(true);
            }}
          />
          <SettingsRow
            icon="lock-outline"
            label="Change Password"
            subtitle="Update your administrator password"
            onPress={() => setChangePasswordVisible(true)}
            isLast
          />
        </DashboardCard>
      </View>

      {/* Session Management */}
      <View style={styles.section}>
        <SectionTitle title="Session" />
        <DashboardCard noPadding>
          <SettingsRow
            icon="logout"
            label="Log Out of Admin Portal"
            danger
            onPress={handleLogoutPress}
            isLast
          />
        </DashboardCard>
      </View>

      {/* EDIT PROFILE MODAL */}
      <Modal visible={editProfileVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Admin Profile</Text>
              <TouchableOpacity onPress={() => setEditProfileVisible(false)}>
                <Icon name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Admin Name</Text>
              <TextInput
                style={styles.textInput}
                value={profileForm.name}
                onChangeText={(t) => setProfileForm({ ...profileForm, name: t })}
              />

              <Text style={styles.inputLabel}>Employee ID</Text>
              <TextInput
                style={styles.textInput}
                value={profileForm.employeeId}
                onChangeText={(t) => setProfileForm({ ...profileForm, employeeId: t })}
              />

              <Text style={styles.inputLabel}>Department</Text>
              <TextInput
                style={styles.textInput}
                value={profileForm.department}
                onChangeText={(t) => setProfileForm({ ...profileForm, department: t })}
              />

              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.textInput}
                value={profileForm.email}
                keyboardType="email-address"
                onChangeText={(t) => setProfileForm({ ...profileForm, email: t })}
              />

              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.textInput}
                value={profileForm.phone}
                keyboardType="phone-pad"
                onChangeText={(t) => setProfileForm({ ...profileForm, phone: t })}
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setEditProfileVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile}>
                <Text style={styles.saveBtnText}>Save Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* CHANGE PASSWORD MODAL */}
      <Modal visible={changePasswordVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity onPress={() => setChangePasswordVisible(false)}>
                <Icon name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Current Password</Text>
              <TextInput
                style={styles.textInput}
                secureTextEntry
                placeholder="Enter current password"
                value={passwordForm.currentPassword}
                onChangeText={(t) => setPasswordForm({ ...passwordForm, currentPassword: t })}
              />

              <Text style={styles.inputLabel}>New Password</Text>
              <TextInput
                style={styles.textInput}
                secureTextEntry
                placeholder="Enter new password"
                value={passwordForm.newPassword}
                onChangeText={(t) => setPasswordForm({ ...passwordForm, newPassword: t })}
              />

              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <TextInput
                style={styles.textInput}
                secureTextEntry
                placeholder="Confirm new password"
                value={passwordForm.confirmPassword}
                onChangeText={(t) => setPasswordForm({ ...passwordForm, confirmPassword: t })}
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setChangePasswordVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSavePassword}>
                <Text style={styles.saveBtnText}>Update Password</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: spacing.xxxl },
  section: { paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  profileCard: {
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    ...softShadow,
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    shadowColor: colors.primaryBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  profileName: { ...typography.h3, color: colors.textPrimary, fontSize: 18 },
  profileEmpId: {
    ...typography.captionMedium,
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  deptBadge: {
    backgroundColor: colors.secondaryBackground,
    borderWidth: 1,
    borderColor: colors.skyBlue,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.round,
    marginTop: spacing.xs,
  },
  deptBadgeText: {
    ...typography.captionMedium,
    color: colors.primaryBlue,
    fontSize: 11,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  contactDetails: {
    width: '100%',
    gap: spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  infoText: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontSize: 13,
  },

  /* Modals */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.lg,
    maxHeight: '90%',
    ...softShadow,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    fontSize: 16,
  },
  formGroup: {
    marginVertical: spacing.xs,
  },
  inputLabel: {
    ...typography.captionMedium,
    color: colors.textSecondary,
    marginBottom: 4,
    marginTop: spacing.sm,
  },
  textInput: {
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    fontSize: 13,
    color: colors.textPrimary,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  cancelBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelBtnText: {
    ...typography.button,
    color: colors.textSecondary,
  },
  saveBtn: {
    backgroundColor: colors.primaryBlue,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  saveBtnText: {
    ...typography.button,
    color: colors.white,
  },
});

export default SettingsScreen;
