import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import SelectDropdown from '../components/SelectDropdown';
import ImportExcelCard from '../components/ImportExcelCard';
import SectionTitle from '../components/SectionTitle';
import PersonRecordCard from '../components/PersonRecordCard';

import colors from '../styles/colors';
import typography from '../styles/typography';
import { spacing, radius, softShadow } from '../styles/globalStyles';
import { getSectionOptions } from '../config/sectionsConfig';

const INITIAL_STUDENTS = [
  {
    id: 's1',
    name: 'Aarav Sharma',
    registerNumber: '2024CSE024',
    email: 'aarav.sharma@ksrce.ac.in',
    department: 'CSE',
    year: '1st Year',
    section: 'A',
    accountStatus: 'Active',
    isBlocked: false,
    mustChangePassword: true,
  },
  {
    id: 's2',
    name: 'Meera Krishnan',
    registerNumber: '2024CSE007',
    email: 'meera.k@ksrce.ac.in',
    department: 'CSE',
    year: '1st Year',
    section: 'B',
    accountStatus: 'Active',
    isBlocked: false,
    mustChangePassword: true,
  },
  {
    id: 's3',
    name: 'Rohan Verma',
    registerNumber: '2023ECE011',
    email: 'rohan.verma@ksrce.ac.in',
    department: 'ECE',
    year: '2nd Year',
    section: 'A',
    accountStatus: 'Blocked',
    isBlocked: true,
    mustChangePassword: false,
  },
  {
    id: 's4',
    name: 'Sneha Pillai',
    registerNumber: '2023ECE018',
    email: 'sneha.pillai@ksrce.ac.in',
    department: 'ECE',
    year: '2nd Year',
    section: 'C',
    accountStatus: 'Active',
    isBlocked: false,
    mustChangePassword: false,
  },
  {
    id: 's5',
    name: 'Karthik Jayan',
    registerNumber: '2022MECH029',
    email: 'karthik.j@ksrce.ac.in',
    department: 'MECH',
    year: '3rd Year',
    section: 'B',
    accountStatus: 'Active',
    isBlocked: false,
    mustChangePassword: true,
  },
  {
    id: 's6',
    name: 'Divya Menon',
    registerNumber: '2022MECH005',
    email: 'divya.m@ksrce.ac.in',
    department: 'MECH',
    year: '3rd Year',
    section: 'D',
    accountStatus: 'Blocked',
    isBlocked: true,
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

const StudentsScreen = () => {
  const [students, setStudents] = useState(INITIAL_STUDENTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('CSE');
  const [selectedYear, setSelectedYear] = useState('All');
  const [selectedSection, setSelectedSection] = useState('All');
  const [draftYear, setDraftYear] = useState('All');
  const [draftSection, setDraftSection] = useState('All');

  // Modal States
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editFormData, setEditFormData] = useState({
    id: '',
    name: '',
    registerNumber: '',
    email: '',
    department: 'CSE',
    year: '1st Year',
    section: 'A',
  });

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newStudentData, setNewStudentData] = useState({
    name: '',
    registerNumber: '',
    email: '',
    department: 'CSE',
    year: '1st Year',
    section: 'A',
  });

  const [importModalVisible, setImportModalVisible] = useState(false);

  const yearDropdownOptions = useMemo(
    () => [
      { label: 'All Years', value: 'All' },
      { label: 'I Year', value: '1st Year' },
      { label: 'II Year', value: '2nd Year' },
      { label: 'III Year', value: '3rd Year' },
      { label: 'IV Year', value: '4th Year' },
    ],
    [],
  );

  const sectionDropdownOptions = useMemo(() => {
    const sections = getSectionOptions(draftYear);
    return [{ label: 'All Sections', value: 'All' }, ...sections.map((s) => ({ label: s, value: s }))];
  }, [draftYear]);

  useEffect(() => {
    if (draftSection !== 'All' && !sectionDropdownOptions.some((o) => o.value === draftSection)) {
      setDraftSection('All');
    }
  }, [sectionDropdownOptions, draftSection]);

  const handleApplyFilter = useCallback(() => {
    setSelectedYear(draftYear);
    setSelectedSection(draftSection);
  }, [draftYear, draftSection]);

  const handleClearFilter = useCallback(() => {
    setDraftYear('All');
    setDraftSection('All');
    setSelectedYear('All');
    setSelectedSection('All');
  }, []);

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        student.name.toLowerCase().includes(q) ||
        student.registerNumber.toLowerCase().includes(q) ||
        student.email.toLowerCase().includes(q);
      const matchesDept = selectedDept === 'All' || student.department === selectedDept;
      const matchesYear = selectedYear === 'All' || student.year === selectedYear;
      const matchesSection = selectedSection === 'All' || student.section === selectedSection;
      return matchesSearch && matchesDept && matchesYear && matchesSection;
    });
  }, [students, searchQuery, selectedDept, selectedYear, selectedSection]);

  const handleToggleBlock = (studentId) => {
    setStudents((prev) =>
      prev.map((student) =>
        student.id === studentId
          ? {
              ...student,
              isBlocked: !student.isBlocked,
              accountStatus: !student.isBlocked ? 'Blocked' : 'Active',
            }
          : student,
      ),
    );
  };

  // View Student
  const handleViewStudent = (student) => {
    setSelectedStudent(student);
    setViewModalVisible(true);
  };

  // Edit Student
  const handleOpenEditModal = (student) => {
    setEditFormData({ ...student });
    setEditModalVisible(true);
  };

  const handleSaveEdit = () => {
    if (!editFormData.name || !editFormData.registerNumber || !editFormData.email) {
      Alert.alert('Required Fields', 'Please fill in Name, Register Number, and Email.');
      return;
    }
    setStudents((prev) =>
      prev.map((s) => (s.id === editFormData.id ? { ...s, ...editFormData } : s)),
    );
    setEditModalVisible(false);
    Alert.alert('Success', 'Student details updated successfully.');
  };

  // Delete Student
  const handleDeleteStudent = (studentId, studentName) => {
    Alert.alert(
      'Delete Student Confirmation',
      `Are you sure you want to delete ${studentName}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setStudents((prev) => prev.filter((s) => s.id !== studentId));
            Alert.alert('Deleted', `${studentName} has been removed.`);
          },
        },
      ],
    );
  };

  // Add Single Student
  const handleAddStudent = () => {
    if (!newStudentData.name || !newStudentData.registerNumber || !newStudentData.email) {
      Alert.alert('Required Fields', 'Please fill in Name, Register Number, and Email.');
      return;
    }

    const tempPassword = `Temp@${Math.floor(1000 + Math.random() * 9000)}`;
    const newStudent = {
      id: `s_${Date.now()}`,
      ...newStudentData,
      accountStatus: 'Active',
      isBlocked: false,
      mustChangePassword: true,
      tempPassword,
    };

    setStudents((prev) => [newStudent, ...prev]);
    setAddModalVisible(false);

    Alert.alert(
      'Account Created & Email Sent',
      `Student account created for ${newStudent.name}.\n\nTemporary Password: ${tempPassword}\n\nLogin credentials sent to ${newStudent.email}.\nStudent will be forced to change password during first login.`,
    );

    setNewStudentData({
      name: '',
      registerNumber: '',
      email: '',
      department: 'CSE',
      year: '1st Year',
      section: 'A',
    });
  };

  // Excel Download Template
  const handleDownloadTemplate = () => {
    Alert.alert(
      'Download Excel Template',
      'Student_Import_Template.xlsx downloaded successfully.\n\nRequired Columns:\n1. Register Number\n2. Student Name\n3. Email\n4. Department\n5. Academic Year\n6. Section',
    );
  };

  // Excel Upload Action
  const handleUploadExcelPress = () => {
    setImportModalVisible(true);
  };

  const handleConfirmImportExcel = () => {
    const importedSample = [
      {
        id: `imp_${Date.now()}_1`,
        name: 'Vikas Kumar',
        registerNumber: '2024CSE099',
        email: 'vikas.k@ksrce.ac.in',
        department: 'CSE',
        year: '1st Year',
        section: 'A',
        accountStatus: 'Active',
        isBlocked: false,
        mustChangePassword: true,
      },
      {
        id: `imp_${Date.now()}_2`,
        name: 'Pooja Sundaram',
        registerNumber: '2023ECE055',
        email: 'pooja.s@ksrce.ac.in',
        department: 'ECE',
        year: '2nd Year',
        section: 'B',
        accountStatus: 'Active',
        isBlocked: false,
        mustChangePassword: true,
      },
    ];

    setStudents((prev) => [...importedSample, ...prev]);
    setImportModalVisible(false);

    Alert.alert(
      'Import Successful',
      'Imported 2 student records from Excel.\n\nAutomated Student Accounts Created:\n• Generated Temporary Passwords\n• Sent Login Credentials via Email\n• First-time Login Password Change Enforced.',
    );
  };

  return (
    <View style={styles.flex}>
      <Header
        title="Student Management"
        subtitle="Manage student enrollment, credentials & restrictions"
        rightElement={
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setAddModalVisible(true)}
            activeOpacity={0.8}
          >
            <Icon name="person-add" size={16} color={colors.white} />
            <Text style={styles.addBtnText}>Add Student</Text>
          </TouchableOpacity>
        }
      />

      {/* Search + Filter (fixed at top) */}
      <View style={styles.searchFilterArea}>
        <View style={styles.section}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by Register No, Name, or Email"
          />
        </View>

        <View style={styles.filterSection}>
          <View style={styles.filterRow}>
            <View style={styles.deptBlock}>
              <Text style={styles.filterFieldLabel}>Department</Text>
              <View style={styles.deptBadge}>
                <Icon name="school" size={14} color={colors.primaryBlue} />
                <Text style={styles.deptBadgeText}>CSE (Computer Science & Engineering)</Text>
              </View>
            </View>

            <SelectDropdown
              label="Academic Year"
              value={draftYear}
              options={yearDropdownOptions}
              onSelect={setDraftYear}
              placeholder="Select Year"
              icon="calendar-today"
            />

            <SelectDropdown
              label="Section"
              value={draftSection}
              options={sectionDropdownOptions}
              onSelect={setDraftSection}
              placeholder="Select Section"
              icon="group"
            />

            <View style={styles.filterActions}>
              <TouchableOpacity style={styles.applyBtn} onPress={handleApplyFilter} activeOpacity={0.8}>
                <Icon name="check" size={14} color={colors.white} />
                <Text style={styles.applyBtnText}>Apply Filter</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.clearBtn} onPress={handleClearFilter} activeOpacity={0.8}>
                <Icon name="clear" size={14} color={colors.textSecondary} />
                <Text style={styles.clearBtnText}>Clear</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Import Excel Card */}
        <View style={styles.section}>
          <ImportExcelCard
            title="Import Students Excel (.xlsx)"
            subtitle="Bulk import student records. Generates accounts & emails credentials."
            onDownloadTemplate={handleDownloadTemplate}
            onUploadExcel={handleUploadExcelPress}
          />
        </View>

        {/* Student List */}
        <View style={styles.section}>
          <SectionTitle
            title={`All Students (${filteredStudents.length})`}
            subtitle="View, Edit, Delete or Toggle Device Restrictions"
          />

          {filteredStudents.length === 0 ? (
            <Text style={styles.emptyText}>No students match your filters.</Text>
          ) : (
            filteredStudents.map((student) => (
              <PersonRecordCard
                key={student.id}
                avatarText={getInitials(student.name)}
                name={student.name}
                idLabel="Reg. No"
                idValue={student.registerNumber}
                email={student.email}
                department={student.department}
                year={student.year}
                section={student.section}
                accountStatus={student.accountStatus}
                isBlocked={student.isBlocked}
                onView={() => handleViewStudent(student)}
                onEdit={() => handleOpenEditModal(student)}
                onDelete={() => handleDeleteStudent(student.id, student.name)}
                onToggleBlock={() => handleToggleBlock(student.id)}
              />
            ))
          )}
        </View>

      {/* VIEW STUDENT MODAL */}
      <Modal visible={viewModalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Student Profile</Text>
              <TouchableOpacity onPress={() => setViewModalVisible(false)}>
                <Icon name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedStudent ? (
              <View style={styles.modalBody}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>STUDENT NAME</Text>
                  <Text style={styles.detailValue}>{selectedStudent.name}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>REGISTER NUMBER</Text>
                  <Text style={styles.detailValue}>{selectedStudent.registerNumber}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>EMAIL ADDRESS</Text>
                  <Text style={styles.detailValue}>{selectedStudent.email}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>DEPARTMENT</Text>
                  <Text style={styles.detailValue}>{selectedStudent.department}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>ACADEMIC YEAR & SECTION</Text>
                  <Text style={styles.detailValue}>
                    {selectedStudent.year} - Section {selectedStudent.section}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>ACCOUNT STATUS</Text>
                  <Text
                    style={[
                      styles.detailValue,
                      { color: selectedStudent.isBlocked ? colors.danger : colors.success },
                    ]}
                  >
                    {selectedStudent.isBlocked ? 'Blocked' : 'Active'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>FIRST LOGIN STATUS</Text>
                  <Text style={styles.detailValue}>
                    {selectedStudent.mustChangePassword
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

      {/* EDIT STUDENT MODAL */}
      <Modal visible={editModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Student Details</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Icon name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Student Name</Text>
              <TextInput
                style={styles.textInput}
                value={editFormData.name}
                onChangeText={(t) => setEditFormData({ ...editFormData, name: t })}
              />

              <Text style={styles.inputLabel}>Register Number</Text>
              <TextInput
                style={styles.textInput}
                value={editFormData.registerNumber}
                onChangeText={(t) => setEditFormData({ ...editFormData, registerNumber: t })}
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

              <View style={styles.formRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.inputLabel}>Year</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editFormData.year}
                    onChangeText={(t) => setEditFormData({ ...editFormData, year: t })}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Section</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editFormData.section}
                    onChangeText={(t) => setEditFormData({ ...editFormData, section: t })}
                  />
                </View>
              </View>
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

      {/* ADD STUDENT MODAL */}
      <Modal visible={addModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Student</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <Icon name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Student Name *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Vikas Sharma"
                value={newStudentData.name}
                onChangeText={(t) => setNewStudentData({ ...newStudentData, name: t })}
              />

              <Text style={styles.inputLabel}>Register Number *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 2024CSE102"
                value={newStudentData.registerNumber}
                onChangeText={(t) => setNewStudentData({ ...newStudentData, registerNumber: t })}
              />

              <Text style={styles.inputLabel}>Email Address *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. vikas.s@ksrce.ac.in"
                keyboardType="email-address"
                value={newStudentData.email}
                onChangeText={(t) => setNewStudentData({ ...newStudentData, email: t })}
              />

              <Text style={styles.inputLabel}>Department</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. CSE"
                value={newStudentData.department}
                onChangeText={(t) => setNewStudentData({ ...newStudentData, department: t })}
              />

              <View style={styles.formRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.inputLabel}>Year</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="1st Year"
                    value={newStudentData.year}
                    onChangeText={(t) => setNewStudentData({ ...newStudentData, year: t })}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Section</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="A"
                    value={newStudentData.section}
                    onChangeText={(t) => setNewStudentData({ ...newStudentData, section: t })}
                  />
                </View>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setAddModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddStudent}>
                <Text style={styles.saveBtnText}>Create Account</Text>
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
              <Text style={styles.modalTitle}>Upload Student Excel File</Text>
              <TouchableOpacity onPress={() => setImportModalVisible(false)}>
                <Icon name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.importBox}>
              <Icon name="description" size={36} color={colors.primaryBlue} />
              <Text style={styles.importBoxTitle}>Student_Batch_2026.xlsx</Text>
              <Text style={styles.importBoxMeta}>Size: 42 KB • Ready for import</Text>
            </View>

            <Text style={styles.importNotice}>
              Columns detected: Register Number, Student Name, Email, Department, Academic Year, Section.
              Creating accounts, temp passwords, and sending login credentials via email...
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
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: spacing.xxxl },
  section: { paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  /* Dropdown Filter Section (fixed at top) */
  searchFilterArea: {
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  filterFieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  deptBlock: {
    minWidth: 180,
  },
  deptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    gap: 6,
  },
  deptBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryBlue,
    flexShrink: 1,
  },
  filterActions: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
    paddingBottom: 0,
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    backgroundColor: colors.primaryBlue,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    gap: 4,
  },
  applyBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    gap: 4,
  },
  clearBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
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

  /* Modal Overlay Styles */
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

  /* Forms */
  formGroup: {
    marginVertical: spacing.xs,
  },
  formRow: {
    flexDirection: 'row',
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

export default StudentsScreen;