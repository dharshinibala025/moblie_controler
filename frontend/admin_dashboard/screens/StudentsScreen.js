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
  NativeModules,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import SelectDropdown from '../components/SelectDropdown';
import ImportExcelCard from '../components/ImportExcelCard';
import SectionTitle from '../components/SectionTitle';
import PersonRecordCard from '../components/PersonRecordCard';
import adminService from '../../services/adminService';

import colors from '../styles/colors';
import typography from '../styles/typography';
import { spacing, radius, softShadow } from '../styles/globalStyles';
import { getSectionOptions } from '../config/sectionsConfig';

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
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept] = useState('CSE');
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

  const loadStudents = async () => {
    const data = await adminService.getStudents();
    setStudents(data || []);
  };

  useEffect(() => {
    loadStudents();
    const interval = setInterval(loadStudents, 30000);
    return () => clearInterval(interval);
  }, []);

  const yearDropdownOptions = useMemo(
    () => [
      { label: 'All Years', value: 'All' },
      { label: '1st Year', value: '1st Year' },
      { label: '2nd Year', value: '2nd Year' },
      { label: '3rd Year', value: '3rd Year' },
      { label: '4th Year', value: '4th Year' },
    ],
    [],
  );

  const sectionDropdownOptions = useMemo(() => {
    const sections = getSectionOptions(draftYear);
    return [
      { label: 'All Sections', value: 'All' },
      ...sections.map((s) => ({ label: `Section ${s}`, value: s })),
    ];
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
        (student.email && student.email.toLowerCase().includes(q));
      const matchesDept = selectedDept === 'All' || student.department === selectedDept;
      const matchesYear = selectedYear === 'All' || student.year === selectedYear;
      const matchesSection = selectedSection === 'All' || student.section === selectedSection;
      return matchesSearch && matchesDept && matchesYear && matchesSection;
    });
  }, [students, searchQuery, selectedDept, selectedYear, selectedSection]);

  const handleToggleBlock = async (studentId) => {
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

  const handleViewStudent = (student) => {
    setSelectedStudent(student);
    setViewModalVisible(true);
  };

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

  const handleDeleteStudent = (studentId, studentName) => {
    Alert.alert(
      'Delete Student Confirmation',
      `Are you sure you want to delete ${studentName}?`,
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
      `Student account created for ${newStudent.name}.\n\nTemporary Password: ${tempPassword}\nCredentials sent to ${newStudent.email}.`,
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

  const handleDownloadTemplate = () => {
    Alert.alert('Download Excel Template', 'Student_Import_Template.xlsx downloaded successfully.');
  };

  const handleUploadExcelPress = async (droppedBase64, droppedName) => {
    try {
      let fileBase64 = typeof droppedBase64 === 'string' ? droppedBase64 : null;
      let fileName = typeof droppedName === 'string' ? droppedName : 'student_roster.xlsx';

      if (!fileBase64 && typeof document !== 'undefined' && document.createElement) {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.xlsx, .xls, .csv';

        const fileSelectedPromise = new Promise((resolve) => {
          fileInput.onchange = (e) => {
            const file = e.target?.files?.[0];
            if (!file) {
              resolve(null);
              return;
            }
            fileName = file.name;
            const reader = new FileReader();
            reader.onload = (evt) => {
              const arrayBuffer = evt.target.result;
              const bytes = new Uint8Array(arrayBuffer);
              let binary = '';
              for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i]);
              }
              const base64 = typeof global.btoa === 'function' ? global.btoa(binary) : null;
              resolve(base64);
            };
            reader.readAsArrayBuffer(file);
          };
        });

        fileInput.click();
        fileBase64 = await fileSelectedPromise;
      }

      // Native Mobile File Picker via @react-native-documents/picker
      if (!fileBase64) {
        try {
          const { pick, types } = require('@react-native-documents/picker');
          const [pickResult] = await pick({
            type: [types.allFiles],
          });

          if (pickResult && pickResult.uri) {
            fileName = pickResult.name || 'student_roster.xlsx';
            const blobRes = await fetch(pickResult.uri);
            const blob = await blobRes.blob();

            fileBase64 = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                const base64 = reader.result ? reader.result.split(',')[1] : null;
                resolve(base64);
              };
              reader.onerror = () => resolve(null);
              reader.readAsDataURL(blob);
            });
          }
        } catch (pickerErr) {
          if (
            pickerErr?.message?.toLowerCase().includes('cancel') ||
            pickerErr?.code === 'DOCUMENT_PICKER_CANCELED'
          ) {
            return; // Silent return on user cancellation
          }
          console.warn('Document Picker Error:', pickerErr);
          Alert.alert(
            'Picker Error',
            'Failed to open document picker: ' + (pickerErr.message || 'Unknown native error')
          );
          return;
        }
      }

      if (!fileBase64) {
        Alert.alert(
          'Upload Notice',
          'No file selected. Please select a valid Excel file (.xlsx or .csv) from your device storage.'
        );
        return;
      }

      const res = await adminService.uploadStudentSpreadsheet(fileBase64, fileName);

      Alert.alert(
        '📊 Import Summary Report',
        `• Total Records: ${res?.totalRecords || 0}\n` +
        `• Successfully Imported: ${res?.createdCount || 0}\n` +
        `• Duplicate Records Ignored: ${res?.duplicateCount || 0}\n` +
        `• Failed Records: ${res?.failedCount || 0}\n` +
        `• Emails Queued: ${res?.emailQueuedCount ?? res?.emailSentCount ?? 0}\n` +
        `• Email Failures: ${res?.emailFailedCount || 0}`,
      );
      await loadStudents();
    } catch (err) {
      Alert.alert(
        'Upload Notice',
        err.message || 'Please select a valid Excel file (.xlsx or .csv) from your mobile device storage.',
      );
      await loadStudents();
    }
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
                <Text style={styles.deptBadgeText}>CSE</Text>
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
        <View style={styles.section}>
          <ImportExcelCard
            title="Import Students Excel (.xlsx)"
            subtitle="Bulk import student records. Generates accounts & emails credentials."
            onDownloadTemplate={handleDownloadTemplate}
            onUploadExcel={handleUploadExcelPress}
          />
        </View>

        <View style={styles.section}>
          <SectionTitle
            title={`All Students (${filteredStudents.length})`}
            subtitle="View, Edit, or Delete Student Records"
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
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: spacing.xxxl },
  section: { paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  searchFilterArea: {
    backgroundColor: colors.background,
    paddingBottom: spacing.xs,
    borderTopWidth: 0,
    borderBottomWidth: 0,
  },
  filterSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
    borderTopWidth: 0,
    borderBottomWidth: 0,
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
    minWidth: 100,
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
  },
  filterActions: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
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
});

export default StudentsScreen;