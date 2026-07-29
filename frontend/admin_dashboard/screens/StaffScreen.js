import React, { useMemo, useState } from 'react';
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
import SearchBar from '../components/SearchBar';

import ImportExcelCard from '../components/ImportExcelCard';
import SectionTitle from '../components/SectionTitle';
import PersonRecordCard from '../components/PersonRecordCard';

import colors from '../styles/colors';
import typography from '../styles/typography';
import { spacing, radius, softShadow } from '../styles/globalStyles';

const DEPARTMENTS = ['CSE'];
const ADVISORS = ['All', 'CA1', 'CA2', 'CA3'];

const INITIAL_STAFF = [
  {
    id: 't1',
    name: 'Priya Nair',
    staffId: 'STF214',
    email: 'priya.nair@ksrce.ac.in',
    department: 'Mathematics',
    assignedAdvisor: 'CA1 (I-A)',
    accountStatus: 'Active',
    isBlocked: false,
    mustChangePassword: true,
  },
  {
    id: 't2',
    name: 'Anil Kumar',
    staffId: 'STF118',
    email: 'anil.kumar@ksrce.ac.in',
    department: 'Physics',
    assignedAdvisor: 'CA2 (I-B)',
    accountStatus: 'Active',
    isBlocked: false,
    mustChangePassword: true,
  },
  {
    id: 't3',
    name: 'Divya Francis',
    staffId: 'STF076',
    email: 'divya.f@ksrce.ac.in',
    department: 'Computer Science',
    assignedAdvisor: 'III-A',
    accountStatus: 'Active',
    isBlocked: false,
    mustChangePassword: false,
  },
  {
    id: 't4',
    name: 'Ramesh Subin',
    staffId: 'STF152',
    email: 'ramesh.s@ksrce.ac.in',
    department: 'Sports',
    assignedAdvisor: 'CA3 (II-C)',
    accountStatus: 'Blocked',
    isBlocked: true,
    mustChangePassword: false,
  },
  {
    id: 't5',
    name: 'Lakshmi Iyer',
    staffId: 'STF093',
    email: 'lakshmi.i@ksrce.ac.in',
    department: 'Chemistry',
    assignedAdvisor: 'III-B',
    accountStatus: 'Active',
    isBlocked: false,
    mustChangePassword: true,
  },
  {
    id: 't6',
    name: 'Suresh Nambiar',
    staffId: 'STF061',
    email: 'suresh.n@ksrce.ac.in',
    department: 'Computer Science',
    assignedAdvisor: 'IV-C',
    accountStatus: 'Active',
    isBlocked: false,
    mustChangePassword: false,
  },
];

const getInitials = (name) =>
  name
    ? name
        .split(' ')
        .map((part) => part.charAt(0))
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'ST';

const StaffScreen = () => {
  const [staff, setStaff] = useState(INITIAL_STAFF);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedAdvisor, setSelectedAdvisor] = useState('All');

  // Modals
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editFormData, setEditFormData] = useState({
    id: '',
    name: '',
    email: '',
    department: 'Computer Science',
    assignedAdvisor: 'CA1',
  });

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newStaffData, setNewStaffData] = useState({
    name: '',
    email: '',
    department: 'Computer Science',
    assignedAdvisor: 'CA1',
  });

  const [importModalVisible, setImportModalVisible] = useState(false);

  const filteredStaff = useMemo(() => {
    return staff.filter((member) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        member.name.toLowerCase().includes(q) ||
        member.email.toLowerCase().includes(q) ||
        member.assignedAdvisor.toLowerCase().includes(q);
      const matchesDept = selectedDept === 'All' || member.department === selectedDept;
      const matchesAdvisor =
        selectedAdvisor === 'All' || member.assignedAdvisor.includes(selectedAdvisor);
      return matchesSearch && matchesDept && matchesAdvisor;
    });
  }, [staff, searchQuery, selectedDept, selectedAdvisor]);

  const handleToggleBlock = (staffId) => {
    setStaff((prev) =>
      prev.map((member) =>
        member.id === staffId
          ? {
              ...member,
              isBlocked: !member.isBlocked,
              accountStatus: !member.isBlocked ? 'Blocked' : 'Active',
            }
          : member,
      ),
    );
  };

  // View Staff Member
  const handleViewMember = (member) => {
    setSelectedMember(member);
    setViewModalVisible(true);
  };

  // Edit Staff Member
  const handleOpenEditModal = (member) => {
    setEditFormData({ ...member });
    setEditModalVisible(true);
  };

  const handleSaveEdit = () => {
    if (!editFormData.name || !editFormData.email) {
      Alert.alert('Required Fields', 'Please fill in Staff Name and Email.');
      return;
    }
    setStaff((prev) =>
      prev.map((m) => (m.id === editFormData.id ? { ...m, ...editFormData } : m)),
    );
    setEditModalVisible(false);
    Alert.alert('Success', 'Staff details updated successfully.');
  };

  // Delete Staff Member
  const handleDeleteStaff = (staffId, staffName) => {
    Alert.alert(
      'Delete Staff Confirmation',
      `Are you sure you want to remove ${staffName}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setStaff((prev) => prev.filter((m) => m.id !== staffId));
            Alert.alert('Deleted', `${staffName} has been removed.`);
          },
        },
      ],
    );
  };

  // Add Staff Member
  const handleAddStaff = () => {
    if (!newStaffData.name || !newStaffData.email) {
      Alert.alert('Required Fields', 'Please fill in Staff Name and Email.');
      return;
    }

    const tempPassword = `Staff@${Math.floor(1000 + Math.random() * 9000)}`;
    const newMember = {
      id: `t_${Date.now()}`,
      staffId: `STF${Math.floor(100 + Math.random() * 900)}`,
      ...newStaffData,
      accountStatus: 'Active',
      isBlocked: false,
      mustChangePassword: true,
      tempPassword,
    };

    setStaff((prev) => [newMember, ...prev]);
    setAddModalVisible(false);

    Alert.alert(
      'Staff Account Created & Credentials Emailed',
      `Staff Account Created for ${newMember.name}.\n\nTemporary Password: ${tempPassword}\n\nCredentials sent to ${newMember.email}.\nStaff member must change password on first login.`,
    );

    setNewStaffData({
      name: '',
      email: '',
      department: 'Computer Science',
      assignedAdvisor: 'CA1',
    });
  };

  // Excel Download Template
  const handleDownloadTemplate = () => {
    Alert.alert(
      'Download Excel Template',
      'Staff_Import_Template.xlsx downloaded successfully.\n\nRequired Columns:\n1. Staff Name\n2. Email\n3. Department\n4. Assigned Class Advisor (e.g. CA1, III-A, IV-C)',
    );
  };

  // Excel Upload
  const handleUploadExcelPress = () => {
    setImportModalVisible(true);
  };

  const handleConfirmImportExcel = () => {
    const importedSample = [
      {
        id: `imp_stf_${Date.now()}_1`,
        name: 'Dr. Subramaniam V',
        staffId: 'STF301',
        email: 'subramaniam.v@ksrce.ac.in',
        department: 'Computer Science',
        assignedAdvisor: 'CA4 (IV-A)',
        accountStatus: 'Active',
        isBlocked: false,
        mustChangePassword: true,
      },
      {
        id: `imp_stf_${Date.now()}_2`,
        name: 'Revathi K',
        staffId: 'STF302',
        email: 'revathi.k@ksrce.ac.in',
        department: 'Mathematics',
        assignedAdvisor: 'III-C',
        accountStatus: 'Active',
        isBlocked: false,
        mustChangePassword: true,
      },
    ];

    setStaff((prev) => [...importedSample, ...prev]);
    setImportModalVisible(false);

    Alert.alert(
      'Import Successful',
      'Imported 2 staff records from Excel.\n\nAutomated Staff Accounts Created:\n• Generated Temporary Passwords\n• Sent Login Credentials via Email\n• First-time Login Password Change Enforced.',
    );
  };

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Header
        title="Staff Management"
        subtitle="Manage faculty accounts & class advisor assignments"
        rightElement={
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setAddModalVisible(true)}
            activeOpacity={0.8}
          >
            <Icon name="person-add" size={16} color={colors.white} />
            <Text style={styles.addBtnText}>Add Staff</Text>
          </TouchableOpacity>
        }
      />

      {/* Search Input */}
      <View style={styles.section}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by Staff Name, Email, or Advisor"
        />
      </View>

      {/* Compact Filter Bar */}
      <View style={styles.filterBar}>
        {/* Row 1: Dept fixed badge + Advisor chips */}
        <View style={styles.filterBarRow}>
          <View style={styles.filterBarGroup}>
            <Text style={styles.filterBarLabel}>DEPT</Text>
            <View style={styles.deptBadge}>
              <Icon name="school" size={12} color={colors.primaryBlue} />
              <Text style={styles.deptBadgeText}>CSE</Text>
            </View>
          </View>

          <View style={styles.filterBarSep} />

          <View style={[styles.filterBarGroup, { flex: 1 }]}>
            <Text style={styles.filterBarLabel}>ADVISOR</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                {ADVISORS.map((adv) => (
                  <TouchableOpacity
                    key={adv}
                    style={[styles.filterChip, selectedAdvisor === adv && styles.filterChipActive]}
                    onPress={() => setSelectedAdvisor(adv)}
                  >
                    <Text style={[styles.filterChipText, selectedAdvisor === adv && styles.filterChipTextActive]}>{adv}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </View>

      {/* Import Excel Card */}
      <View style={styles.section}>
        <ImportExcelCard
          title="Import Staff Excel (.xlsx)"
          subtitle="Bulk add staff members. Generates accounts & emails credentials."
          onDownloadTemplate={handleDownloadTemplate}
          onUploadExcel={handleUploadExcelPress}
        />
      </View>

      {/* Staff List */}
      <View style={styles.section}>
        <SectionTitle
          title={`All Staff (${filteredStaff.length})`}
          subtitle="View, Edit, Delete or Toggle Account Status"
        />

        {filteredStaff.length === 0 ? (
          <Text style={styles.emptyText}>No staff members match your filters.</Text>
        ) : (
          filteredStaff.map((member) => (
            <PersonRecordCard
              key={member.id}
              avatarText={getInitials(member.name)}
              avatarColor={colors.skyBlue}
              name={member.name}
              idLabel="Staff ID"
              idValue={member.staffId}
              email={member.email}
              department={member.department}
              assignedAdvisor={member.assignedAdvisor}
              accountStatus={member.accountStatus}
              isBlocked={member.isBlocked}
              onView={() => handleViewMember(member)}
              onEdit={() => handleOpenEditModal(member)}
              onDelete={() => handleDeleteStaff(member.id, member.name)}
            />
          ))
        )}
      </View>

      {/* VIEW STAFF MODAL */}
      <Modal visible={viewModalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Staff Profile Details</Text>
              <TouchableOpacity onPress={() => setViewModalVisible(false)}>
                <Icon name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedMember ? (
              <View style={styles.modalBody}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>STAFF NAME</Text>
                  <Text style={styles.detailValue}>{selectedMember.name}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>STAFF ID</Text>
                  <Text style={styles.detailValue}>{selectedMember.staffId}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>EMAIL ADDRESS</Text>
                  <Text style={styles.detailValue}>{selectedMember.email}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>DEPARTMENT</Text>
                  <Text style={styles.detailValue}>{selectedMember.department}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>ASSIGNED CLASS ADVISOR</Text>
                  <Text style={styles.detailValue}>{selectedMember.assignedAdvisor}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>STATUS</Text>
                  <Text
                    style={[
                      styles.detailValue,
                      { color: selectedMember.isBlocked ? colors.danger : colors.success },
                    ]}
                  >
                    {selectedMember.isBlocked ? 'Blocked' : 'Active'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>FIRST LOGIN STATUS</Text>
                  <Text style={styles.detailValue}>
                    {selectedMember.mustChangePassword
                      ? 'Pending Password Change'
                      : 'Password Updated'}
                  </Text>
                </View>
              </View>
            ) : null}

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setViewModalVisible(false)}
            >
              <Text style={styles.closeBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* EDIT STAFF MODAL */}
      <Modal visible={editModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Staff Details</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Icon name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Staff Name</Text>
              <TextInput
                style={styles.textInput}
                value={editFormData.name}
                onChangeText={(t) => setEditFormData({ ...editFormData, name: t })}
              />

              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.textInput}
                value={editFormData.email}
                keyboardType="email-address"
                onChangeText={(t) => setEditFormData({ ...editFormData, email: t })}
              />

              <Text style={styles.inputLabel}>Department</Text>
              <TextInput
                style={styles.textInput}
                value={editFormData.department}
                onChangeText={(t) => setEditFormData({ ...editFormData, department: t })}
              />

              <Text style={styles.inputLabel}>Assigned Class Advisor</Text>
              <TextInput
                style={styles.textInput}
                value={editFormData.assignedAdvisor}
                onChangeText={(t) => setEditFormData({ ...editFormData, assignedAdvisor: t })}
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveEdit}>
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ADD STAFF MODAL */}
      <Modal visible={addModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Staff Member</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <Icon name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Staff Name *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Dr. Ramesh Kumar"
                value={newStaffData.name}
                onChangeText={(t) => setNewStaffData({ ...newStaffData, name: t })}
              />

              <Text style={styles.inputLabel}>Email Address *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. ramesh.k@ksrce.ac.in"
                keyboardType="email-address"
                value={newStaffData.email}
                onChangeText={(t) => setNewStaffData({ ...newStaffData, email: t })}
              />

              <Text style={styles.inputLabel}>Department</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Computer Science"
                value={newStaffData.department}
                onChangeText={(t) => setNewStaffData({ ...newStaffData, department: t })}
              />

              <Text style={styles.inputLabel}>Assigned Class Advisor</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. CA1 (I-A) or III-A"
                value={newStaffData.assignedAdvisor}
                onChangeText={(t) => setNewStaffData({ ...newStaffData, assignedAdvisor: t })}
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setAddModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddStaff}>
                <Text style={styles.saveBtnText}>Create Staff Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* IMPORT EXCEL MODAL */}
      <Modal visible={importModalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Upload Staff Excel File</Text>
              <TouchableOpacity onPress={() => setImportModalVisible(false)}>
                <Icon name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.importBox}>
              <Icon name="description" size={36} color={colors.primaryBlue} />
              <Text style={styles.importBoxTitle}>Staff_Faculty_List_2026.xlsx</Text>
              <Text style={styles.importBoxMeta}>Size: 38 KB • Ready for import</Text>
            </View>

            <Text style={styles.importNotice}>
              Columns detected: Staff Name, Email, Department, Assigned Class Advisor.
              Creating staff accounts, temp passwords, and sending login credentials via email...
            </Text>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setImportModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleConfirmImportExcel}>
                <Text style={styles.saveBtnText}>Import & Send Emails</Text>
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
  filterLabel: {
    ...typography.captionMedium,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },

  /* Filter Bar Card */
  filterBar: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.cardBackground,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...softShadow,
  },
  filterBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  filterBarDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  filterBarGroup: {
    gap: 4,
  },
  filterBarLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  filterBarSep: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
    marginHorizontal: 2,
  },
  deptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 10,
    gap: 4,
  },
  deptBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primaryBlue,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 6,
    paddingRight: spacing.lg,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primaryBlue,
    borderColor: colors.primaryBlue,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.white,
    fontWeight: '700',
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryBlue,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.md,
    gap: 4,
  },
  addBtnText: {
    ...typography.button,
    color: colors.white,
    fontSize: 12,
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
  modalBody: {
    marginVertical: spacing.sm,
  },
  detailRow: {
    marginBottom: spacing.md,
  },
  detailLabel: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  detailValue: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    fontSize: 14,
    marginTop: 2,
  },
  closeBtn: {
    backgroundColor: colors.primaryBlue,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  closeBtnText: {
    ...typography.button,
    color: colors.white,
  },

  /* Form */
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

  /* Import box */
  importBox: {
    alignItems: 'center',
    backgroundColor: colors.secondaryBackground,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.skyBlue,
    marginVertical: spacing.md,
  },
  importBoxTitle: {
    ...typography.bodyMedium,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  importBoxMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  importNotice: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
});

export default StaffScreen;