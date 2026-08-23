import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import VectorIcon from '../../student_dashboard/components/VectorIcon';
import SettingsRow from '../components/SettingsRow';
import { colors, shadows, borderRadius } from '../../student_dashboard/styles/theme';
import staffService from '../../services/staffService';
import authService from '../../services/authService';
import formatClassDisplay from '../../utils/formatClassDisplay';

const STATUSBAR_OFFSET = 12;

export const StaffSettingsTab = ({ staffInfo, onLogout }) => {
  const [staffProfile, setStaffProfile] = useState({
    name: 'Loading...',
    employeeId: '...',
    department: '',
    email: '...',
    initials: 'ST',
    assignedClass: '...',
  });

  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const getInitials = (name) => {
    if (!name) return 'ST';
    return name
      .split(' ')
      .map((part) => part.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  useEffect(() => {
    if (staffInfo) {
      setStaffProfile({
        name: staffInfo.name || 'Staff Member',
        employeeId: staffInfo.employeeId || '',
        department: staffInfo.department || '',
        email: staffInfo.email || '',
        initials: getInitials(staffInfo.name),
        assignedClass: formatClassDisplay(staffInfo.classId),
      });
    }
  }, [staffInfo]);

  // Edit Profile Modal State
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [profileForm, setProfileForm] = useState({ ...staffProfile });

  // Change Password Modal State
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSaveProfile = async () => {
    if (!profileForm.name) {
      Alert.alert('Required Fields', 'Please fill in Staff Name.');
      return;
    }
    setSaving(true);
    try {
      await staffService.updateProfile({ name: profileForm.name, employeeId: profileForm.employeeId });
      setStaffProfile({ ...staffProfile, name: profileForm.name, employeeId: profileForm.employeeId });
      setEditProfileVisible(false);
      Alert.alert('Profile Updated', 'Staff profile details have been saved.');
    } catch (error) {
      Alert.alert('Update Failed', error.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      Alert.alert('Required Fields', 'Please fill in current and new password.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      Alert.alert('Password Mismatch', 'New password and confirmation do not match.');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      Alert.alert('Weak Password', 'New password must be at least 6 characters.');
      return;
    }
    setChangingPassword(true);
    try {
      await staffService.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setChangePasswordVisible(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      Alert.alert('Password Updated', 'Staff account password updated successfully.');
    } catch (error) {
      Alert.alert('Update Failed', error.message || 'Failed to change password. Please try again.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogoutPress = () => {
    Alert.alert(
      'Sign Out Confirmation',
      'Are you sure you want to log out of the Staff Monitoring Portal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.logout();
            } catch (e) {
              // continue logout even if server revoke fails
            }
            if (onLogout) {
              onLogout();
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.subHeader}>
        <Text style={styles.titleText}>Account Settings</Text>
        <Text style={styles.subtitleText}>Manage your staff profile details and account security.</Text>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <View style={styles.profileCard}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>{staffProfile.initials}</Text>
            </View>

            <Text style={styles.profileName}>{staffProfile.name}</Text>
            <Text style={styles.profileEmpId}>Staff ID: {staffProfile.employeeId}</Text>
            {staffProfile.department ? (
              <View style={styles.deptBadge}>
                <Text style={styles.deptBadgeText}>{staffProfile.department}</Text>
              </View>
            ) : null}

            <View style={styles.divider} />

            <View style={styles.contactDetails}>
              <View style={styles.infoRow}>
                <VectorIcon name="email" size={16} color={colors.primary} />
                <Text style={styles.infoText}>{staffProfile.email}</Text>
              </View>
              <View style={styles.infoRow}>
                <VectorIcon name="school" size={16} color={colors.primary} />
                <Text style={styles.infoText}>Class Mentor: {staffProfile.assignedClass}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Management</Text>
          <View style={styles.settingsGroupCard}>
            <SettingsRow
              icon="account"
              label="Edit Profile"
              subtitle="Update name and employee ID"
              onPress={() => {
                setProfileForm({ name: staffProfile.name, employeeId: staffProfile.employeeId });
                setEditProfileVisible(true);
              }}
            />
            <SettingsRow
              icon="lock"
              label="Change Password"
              subtitle="Update your dashboard login password"
              onPress={() => setChangePasswordVisible(true)}
              isLast
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session</Text>
          <View style={styles.settingsGroupCard}>
            <SettingsRow
              icon="logout"
              label="Log Out of Staff Portal"
              danger
              onPress={handleLogoutPress}
              isLast
            />
          </View>
        </View>
      </ScrollView>

      {/* EDIT PROFILE MODAL */}
      <Modal visible={editProfileVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Staff Profile</Text>
              <TouchableOpacity onPress={() => setEditProfileVisible(false)}>
                <VectorIcon name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.formGroup}>
              <Text style={styles.inputLabel}>Staff Name</Text>
              <TextInput
                style={styles.textInput}
                value={profileForm.name}
                onChangeText={(t) => setProfileForm({ ...profileForm, name: t })}
              />

              <Text style={styles.inputLabel}>Employee Staff ID</Text>
              <TextInput
                style={styles.textInput}
                value={profileForm.employeeId}
                onChangeText={(t) => setProfileForm({ ...profileForm, employeeId: t })}
              />

              <View style={styles.infoNote}>
                <VectorIcon name="information" size={14} color="#64748B" />
                <Text style={styles.infoNoteText}>Only Name and Employee ID can be edited. Contact admin for other changes.</Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setEditProfileVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={handleSaveProfile}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Profile</Text>
                )}
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
                <VectorIcon name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Current Password</Text>
              <TextInput
                style={styles.textInput}
                secureTextEntry
                placeholder="Enter current password"
                placeholderTextColor="#94A3B8"
                value={passwordForm.currentPassword}
                onChangeText={(t) => setPasswordForm({ ...passwordForm, currentPassword: t })}
              />

              <Text style={styles.inputLabel}>New Password</Text>
              <TextInput
                style={styles.textInput}
                secureTextEntry
                placeholder="Enter new password (min 6 chars)"
                placeholderTextColor="#94A3B8"
                value={passwordForm.newPassword}
                onChangeText={(t) => setPasswordForm({ ...passwordForm, newPassword: t })}
              />

              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <TextInput
                style={styles.textInput}
                secureTextEntry
                placeholder="Confirm new password"
                placeholderTextColor="#94A3B8"
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
              <TouchableOpacity
                style={[styles.saveBtn, changingPassword && styles.saveBtnDisabled]}
                onPress={handleSavePassword}
                disabled={changingPassword}
              >
                {changingPassword ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Update Password</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  flex: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  section: { paddingHorizontal: 16, marginTop: 16 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E3A8A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.card,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
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
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  profileEmpId: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  deptBadge: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  deptBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  contactDetails: {
    width: '100%',
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  settingsGroupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.card,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    padding: 20,
    maxHeight: '90%',
    ...shadows.medium,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  formGroup: {
    paddingVertical: 12,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
    marginTop: 8,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    height: 40,
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoNoteText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    lineHeight: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
    marginTop: 12,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  saveBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    minWidth: 90,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subHeader: {
    paddingHorizontal: 20,
    paddingTop: STATUSBAR_OFFSET,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 12,
  },
  titleText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitleText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    lineHeight: 18,
    marginTop: 4,
  },
});

export default StaffSettingsTab;
