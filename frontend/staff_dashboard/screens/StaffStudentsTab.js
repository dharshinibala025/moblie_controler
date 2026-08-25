import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  Platform,
  StatusBar,
} from 'react-native';
import { colors, shadows, borderRadius } from '../../student_dashboard/styles/theme';
import VectorIcon from '../../student_dashboard/components/VectorIcon';
import formatClassDisplay from '../../utils/formatClassDisplay';

const STATUSBAR_OFFSET = 12;

export const StaffStudentsTab = ({ staffInfo: propStaffInfo, onNavigateTab }) => {
  const staffInfo = propStaffInfo || { name: '', department: '' };
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [liveStudents, setLiveStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLiveStatus = async (showLoading = true) => {
      const classIdToQuery = staffInfo?.classRoomId || staffInfo?.classId;
      if (!classIdToQuery) return;
      if (showLoading) setLoading(true);
      try {
        const staffService = require('../../services/staffService').default;
        const data = await staffService.fetchClassLiveStatus(classIdToQuery);
        if (data && data.students) {
          const mapped = data.students.map((student) => {
            const rawStatus = String(student.deviceStatus || '').toLowerCase();
            const isBlocked = rawStatus === 'blocked';
            const isLoggedIn = !isBlocked && (rawStatus === 'logged in' || rawStatus === 'active' || student.isOnline === true);
            const isRestricted = student.scheduleRestricted === true;

            return {
              id: student.studentId || student._id,
              name: student.name,
              rollNo: student.rollNo,
              email: student.email,
              status: isBlocked ? 'blocked' : isRestricted ? 'restricted' : isLoggedIn ? 'active' : 'offline',
              device: student.deviceModel || 'Android Device',
              screenTime: student.screenTime || 'Active',
              attempts: student.attempts || 0,
              accessibilityEnabled: student.accessibilityEnabled,
              overlayEnabled: student.overlayEnabled,
            };
          });
          setLiveStudents(mapped);
        }
      } catch (e) {
        console.warn('FocusSync: Failed to fetch student supervision data:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchLiveStatus(true);
    const interval = setInterval(() => fetchLiveStatus(false), 10000);
    return () => clearInterval(interval);
  }, [staffInfo]);

  const mentorClass = staffInfo.assignedClass || staffInfo.classId || '';

  const filteredStudents = liveStudents.filter((student) => {
    const name = String(student.name || '').toLowerCase();
    const rollNo = String(student.rollNo || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = !query || name.includes(query) || rollNo.includes(query);
    const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusStyle = (status) => {
    switch (status) {
      case 'active':
        return { bg: '#DCFCE7', text: '#16A34A', border: '#BBF7D0', icon: 'check-circle-outline', label: 'LOGGED IN' };
      case 'blocked':
        return { bg: '#FEE2E2', text: '#DC2626', border: '#FECACA', icon: 'cellphone-off', label: 'BLOCKED' };
      case 'restricted':
        return { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A', icon: 'clock-outline', label: 'RESTRICTED' };
      case 'offline':
      default:
        return { bg: '#F1F5F9', text: '#64748B', border: '#E2E8F0', icon: 'power-off', label: 'NO LOGIN' };
    }
  };

  const renderStudentItem = ({ item }) => {
    const statusStyle = getStatusStyle(item.status);
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={() => setSelectedStudent(item)} style={styles.studentRow}>
        <View style={styles.studentHeader}>
          <View style={styles.studentInfoCol}>
            <Text style={styles.studentNameText}>{item.name}</Text>
            <Text style={styles.studentRollText}>{item.rollNo}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
            <VectorIcon name={statusStyle.icon} size={14} color={statusStyle.text} />
            <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>{statusStyle.label}</Text>
          </View>
        </View>
        <View style={styles.studentDivider} />
        <View style={styles.studentFooter}>
          <View style={styles.studentMetaItem}>
            <VectorIcon name="cellphone" size={15} color="#94A3B8" />
            <Text style={styles.studentMetaText}>{item.device}</Text>
          </View>
          <View style={styles.studentMetaItem}>
            <VectorIcon name="clock-outline" size={15} color="#94A3B8" />
            <Text style={styles.studentMetaText}>Active: {item.screenTime}</Text>
          </View>
        </View>
        {item.status === 'blocked' && item.attempts > 0 && (
          <View style={styles.attemptsWarningRow}>
            <VectorIcon name="alert-circle" size={14} color="#DC2626" />
            <Text style={styles.attemptsWarningText}>{item.attempts} attempts to open restricted apps today</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.subHeader}>
        <Text style={styles.titleText}>Student Supervision</Text>
        <Text style={styles.subtitleText}>
          Real-time status updates and app access attempts for your class ({formatClassDisplay(mentorClass)}).
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.listContainer}>
          <View style={styles.listHeaderRow}>
            <Text style={styles.listTitleText}>My Class Students</Text>
            {mentorClass && (
              <Text style={styles.listCountText}>({filteredStudents.length} Students)</Text>
            )}
          </View>

          {liveStudents.length === 0 ? (
            <View style={styles.emptyContainer}>
              <VectorIcon name="cellphone-off" size={48} color="#94A3B8" />
              <Text style={styles.emptyTitleText}>No Assigned Students</Text>
              <Text style={styles.emptySubtitleText}>No students are assigned to your class.</Text>
            </View>
          ) : (
            <>
              <View style={styles.searchContainer}>
                <VectorIcon name="magnify" size={20} color="#94A3B8" />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search by student name or roll number..."
                  placeholderTextColor="#94A3B8"
                  style={styles.searchInput}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <VectorIcon name="close-circle" size={16} color="#94A3B8" />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.filterRow}>
                <TouchableOpacity onPress={() => setStatusFilter('all')} style={[styles.filterBadge, statusFilter === 'all' && styles.filterBadgeActive]}>
                  <Text style={[styles.filterBadgeText, statusFilter === 'all' && styles.filterBadgeTextActive]}>All ({liveStudents.length})</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setStatusFilter('active')} style={[styles.filterBadge, statusFilter === 'active' && [styles.filterBadgeActive, { backgroundColor: '#DCFCE7', borderColor: '#BBF7D0' }]]}>
                  <Text style={[styles.filterBadgeText, statusFilter === 'active' && { color: '#16A34A', fontWeight: '700' }]}>Active ({liveStudents.filter((s) => s.status === 'active').length})</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setStatusFilter('blocked')} style={[styles.filterBadge, statusFilter === 'blocked' && [styles.filterBadgeActive, { backgroundColor: '#FEE2E2', borderColor: '#FECACA' }]]}>
                  <Text style={[styles.filterBadgeText, statusFilter === 'blocked' && { color: '#DC2626', fontWeight: '700' }]}>Blocked ({liveStudents.filter((s) => s.status === 'blocked').length})</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setStatusFilter('offline')} style={[styles.filterBadge, statusFilter === 'offline' && [styles.filterBadgeActive, { backgroundColor: '#F1F5F9', borderColor: '#E2E8F0' }]]}>
                  <Text style={[styles.filterBadgeText, statusFilter === 'offline' && { color: '#475569', fontWeight: '700' }]}>Offline ({liveStudents.filter((s) => s.status === 'offline').length})</Text>
                </TouchableOpacity>
              </View>

              {filteredStudents.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <VectorIcon name="cellphone-off" size={42} color="#94A3B8" />
                  <Text style={styles.emptyTitleText}>No Student Devices Found</Text>
                  <Text style={styles.emptySubtitleText}>No students match the selected search or filter.</Text>
                </View>
              ) : (
                <FlatList
                  data={filteredStudents}
                  renderItem={renderStudentItem}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  ItemSeparatorComponent={() => <View style={styles.separatorLine} />}
                />
              )}
            </>
          )}
        </View>
      </ScrollView>

      {selectedStudent && (
        <Modal animationType="fade" transparent={true} visible={!!selectedStudent} onRequestClose={() => setSelectedStudent(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Device Monitoring Details</Text>
                <TouchableOpacity activeOpacity={0.7} onPress={() => setSelectedStudent(null)} style={styles.modalCloseButton}>
                  <VectorIcon name="close" size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <View style={styles.modalIdentityRow}>
                  <View style={styles.modalAvatarPlaceholder}>
                    <Text style={styles.modalAvatarText}>
                      {selectedStudent.name.split(' ').map((n) => n[0]).join('')}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.modalStudentName}>{selectedStudent.name}</Text>
                    <Text style={styles.modalStudentRoll}>{selectedStudent.rollNo}</Text>
                  </View>
                </View>

                <View style={styles.modalDetailCard}>
                  <View style={styles.modalDetailItem}>
                    <Text style={styles.modalDetailLabel}>DEVICE MODEL</Text>
                    <Text style={styles.modalDetailVal}>{selectedStudent.device}</Text>
                  </View>
                  <View style={styles.modalDetailItem}>
                    <Text style={styles.modalDetailLabel}>DEVICE STATUS</Text>
                    <View style={[styles.modalStatusPill, { backgroundColor: getStatusStyle(selectedStudent.status).bg }]}>
                      <Text style={[styles.modalStatusPillText, { color: getStatusStyle(selectedStudent.status).text }]}>{selectedStudent.status.toUpperCase()}</Text>
                    </View>
                  </View>
                  <View style={styles.modalDetailItem}>
                    <Text style={styles.modalDetailLabel}>ACTIVE SCREEN TIME</Text>
                    <Text style={styles.modalDetailVal}>{selectedStudent.screenTime}</Text>
                  </View>
                  <View style={styles.modalDetailItem}>
                    <Text style={styles.modalDetailLabel}>RESTRICTION ATTEMPTS</Text>
                    <Text style={[styles.modalDetailVal, selectedStudent.attempts > 0 && { color: '#DC2626', fontWeight: '700' }]}>{selectedStudent.attempts} blocks today</Text>
                  </View>
                </View>

                <View style={styles.lockNoticeCard}>
                  <VectorIcon name="shield" size={16} color={colors.primary} />
                  <Text style={styles.lockNoticeText}>Read-Only Monitoring Access. Only Administrators and HODs can modify restrictions.</Text>
                </View>

                <Text style={styles.appStatusTitle}>Device Permissions</Text>
                <View style={styles.appBreakdownList}>
                  <View style={styles.appBreakdownItem}>
                    <VectorIcon name="eye" size={16} color={selectedStudent.accessibilityEnabled ? '#16A34A' : '#DC2626'} />
                    <Text style={styles.appName}>Accessibility Service</Text>
                    <Text style={[styles.appStatusLabel, { color: selectedStudent.accessibilityEnabled ? '#16A34A' : '#DC2626' }]}>{selectedStudent.accessibilityEnabled ? 'Enabled' : 'Disabled'}</Text>
                  </View>
                  <View style={styles.appBreakdownItem}>
                    <VectorIcon name="cellphone" size={16} color={selectedStudent.overlayEnabled ? '#16A34A' : '#DC2626'} />
                    <Text style={styles.appName}>Overlay Permission</Text>
                    <Text style={[styles.appStatusLabel, { color: selectedStudent.overlayEnabled ? '#16A34A' : '#DC2626' }]}>{selectedStudent.overlayEnabled ? 'Enabled' : 'Disabled'}</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity activeOpacity={0.8} onPress={() => setSelectedStudent(null)} style={styles.modalPrimaryBtn}>
                <Text style={styles.modalPrimaryBtnText}>Close Report</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { paddingBottom: 40 },
  subHeader: { paddingHorizontal: 20, paddingTop: STATUSBAR_OFFSET, paddingBottom: 14, backgroundColor: '#FFFFFF', borderBottomWidth: 0, marginBottom: 12 },
  titleText: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  subtitleText: { fontSize: 12, fontWeight: '500', color: '#64748B', lineHeight: 18, marginTop: 4 },
  listContainer: { backgroundColor: '#FFFFFF', marginHorizontal: 16, borderRadius: borderRadius.card, padding: 16, borderWidth: 1, borderColor: colors.borderLight },
  listHeaderRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 12 },
  listTitleText: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  listCountText: { fontSize: 12, fontWeight: '600', color: '#94A3B8' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 12, height: 44, paddingHorizontal: 12, marginBottom: 12 },
  searchInput: { flex: 1, fontSize: 13, fontWeight: '600', color: '#0F172A', marginLeft: 8, paddingVertical: 0 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  filterBadge: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 8, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  filterBadgeActive: { backgroundColor: colors.primaryLight, borderColor: '#EFF6FF' },
  filterBadgeText: { fontSize: 11, fontWeight: '600', color: '#64748B' },
  filterBadgeTextActive: { color: colors.primary, fontWeight: '700' },
  studentRow: { backgroundColor: '#FFFFFF', paddingVertical: 12 },
  separatorLine: { height: 1, backgroundColor: '#F1F5F9' },
  studentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  studentInfoCol: { flex: 1, marginRight: 8 },
  studentNameText: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  studentRollText: { fontSize: 11, fontWeight: '600', color: '#94A3B8', marginTop: 1 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, borderWidth: 1 },
  statusBadgeText: { fontSize: 10, fontWeight: '800' },
  studentDivider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 10 },
  studentFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  studentMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  studentMetaText: { fontSize: 11, fontWeight: '600', color: '#64748B' },
  attemptsWarningRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF1F2', borderRadius: 6, paddingVertical: 4, paddingHorizontal: 8, marginTop: 10, gap: 6 },
  attemptsWarningText: { fontSize: 10, fontWeight: '700', color: '#EF4444' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { backgroundColor: '#FFFFFF', width: '100%', maxWidth: 380, borderRadius: 20, padding: 20, ...shadows.medium },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 12 },
  modalTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  modalCloseButton: { padding: 4 },
  modalBody: { paddingVertical: 16 },
  modalIdentityRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  modalAvatarPlaceholder: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  modalAvatarText: { fontSize: 16, fontWeight: '800', color: colors.primaryDark },
  modalStudentName: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  modalStudentRoll: { fontSize: 12, fontWeight: '600', color: '#94A3B8' },
  modalDetailCard: { backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 12, gap: 10, marginBottom: 14 },
  modalDetailItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalDetailLabel: { fontSize: 10, fontWeight: '800', color: '#64748B' },
  modalDetailVal: { fontSize: 12, fontWeight: '700', color: '#0F172A' },
  modalStatusPill: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6 },
  modalStatusPillText: { fontSize: 10, fontWeight: '800' },
  lockNoticeCard: { flexDirection: 'row', backgroundColor: '#EFF6FF', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#DBEAFE', gap: 8, marginBottom: 14 },
  lockNoticeText: { flex: 1, fontSize: 10, fontWeight: '600', color: '#1D4ED8', lineHeight: 14 },
  appStatusTitle: { fontSize: 12, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  appBreakdownList: { gap: 8 },
  appBreakdownItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 8, padding: 8, borderWidth: 1, borderColor: '#F1F5F9' },
  appName: { flex: 1, fontSize: 11, fontWeight: '600', color: '#334155', marginLeft: 8 },
  appStatusLabel: { fontSize: 10, fontWeight: '800' },
  modalPrimaryBtn: { backgroundColor: colors.primary, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center', ...shadows.soft },
  modalPrimaryBtnText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 32, paddingHorizontal: 16 },
  emptyTitleText: { fontSize: 14, fontWeight: '800', color: '#475569', marginTop: 10 },
  emptySubtitleText: { fontSize: 12, color: '#94A3B8', textAlign: 'center', marginTop: 4, lineHeight: 18 },
});

export default StaffStudentsTab;