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
import VectorIcon from '../../student_dashboard/components/VectorIcon';

const STATUSBAR_OFFSET = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 16;

export const StaffProfileScreen = ({ onLogout, staffData }) => {
  const staff = staffData || {};

  const handleLogoutPress = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
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

  const handleChangePassword = () => {
    Alert.alert('Change Password', 'Change password functionality will be available here.');
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerSection}>
        <Text style={styles.titleText}>My Profile</Text>
        <Text style={styles.subtitleText}>Account details and security settings</Text>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatarWrapper}>
          {staff.avatar ? (
            <Image source={{ uri: staff.avatar }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>
                {staff.initials || staff.name?.charAt(0) || 'S'}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.staffName}>{staff.name || 'Staff Name'}</Text>
        <Text style={styles.staffDesignation}>{staff.designation || ''}</Text>

        <View style={styles.idBadge}>
          <VectorIcon name="student-id" size={12} color="#6B7280" />
          <Text style={styles.idText}>{staff.id || 'N/A'}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <View style={styles.detailIconBox}>
            <VectorIcon name="email" size={16} color="#2563EB" />
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>EMAIL</Text>
            <Text style={styles.detailValue}>{staff.email || 'N/A'}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailIconBox}>
            <VectorIcon name="phone" size={16} color="#2563EB" />
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>MOBILE</Text>
            <Text style={styles.detailValue}>{staff.mobile || 'N/A'}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailIconBox}>
            <VectorIcon name="school" size={16} color="#2563EB" />
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>ASSIGNED CLASS</Text>
            <Text style={styles.detailValue}>{staff.assignedClass || 'N/A'}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailIconBox}>
            <VectorIcon name="department" size={16} color="#2563EB" />
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>DEPARTMENT</Text>
            <Text style={styles.detailValue}>{staff.department || 'CSE'}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailIconBox}>
            <VectorIcon name="shield-account" size={16} color="#2563EB" />
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>ROLE</Text>
            <Text style={styles.detailValue}>{staff.roleAssignment || 'Staff'}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleChangePassword}
        style={styles.changePasswordBtn}
      >
        <VectorIcon name="lock-reset" size={16} color="#D97706" />
        <Text style={styles.changePasswordText}>Change Password</Text>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleLogoutPress}
        style={styles.logoutButton}
      >
        <VectorIcon name="logout" size={16} color="#EF4444" />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerSection: {
    paddingTop: STATUSBAR_OFFSET,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  titleText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  subtitleText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 2,
  },
  profileCard: {
    marginHorizontal: 24,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 20,
    alignItems: 'center',
  },
  avatarWrapper: {
    marginBottom: 12,
  },
  avatarImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E5E7EB',
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2563EB',
  },
  staffName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  staffDesignation: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 2,
  },
  idBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 999,
    marginTop: 8,
  },
  idText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    marginBottom: 12,
  },
  detailIconBox: {
    width: 32,
    height: 32,
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
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    marginTop: 1,
  },
  changePasswordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFBEB',
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginHorizontal: 24,
    marginTop: 14,
  },
  changePasswordText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D97706',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginHorizontal: 24,
    marginTop: 10,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EF4444',
  },
});

export default StaffProfileScreen;
