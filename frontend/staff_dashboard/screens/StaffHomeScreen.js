import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  FlatList,
  Modal,
  Platform,
  StatusBar,
} from 'react-native';
import { colors, shadows, borderRadius } from '../../student_dashboard/styles/theme';
import VectorIcon from '../../student_dashboard/components/VectorIcon';
import staffMockData from '../data/staffMockData';

const STATUSBAR_OFFSET = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 16;

export const StaffHomeScreen = ({ onNavigateTab }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'blocked' | 'offline'
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [currentTime, setCurrentTime] = useState('');

  // Clock Update
  useEffect(() => {
    const updateTime = () => {
      const date = new Date();
      const options = {
        weekday: 'short',
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      };
      const formatted = date.toLocaleDateString('en-US', options);
      const parts = formatted.split(', ');
      if (parts.length >= 3) {
        const weekday = parts[0];
        const monthDay = parts[1];
        const yearTime = parts[2].split(' ');
        const year = yearTime[0];
        const timeStr = yearTime.slice(1).join(' ');
        setCurrentTime(`${weekday}, ${monthDay}, ${year} | ${timeStr}`);
      } else {
        setCurrentTime(date.toLocaleTimeString());
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const staffInfo = staffMockData.staff;

  // Map mentor class (e.g., 'III CSE - A') to internal mock section key (e.g., '3rd Year - A')
  const classMapping = {
    'III CSE - A': '3rd Year - A',
    'III CSE - B': '3rd Year - B',
    'III CSE - C': '3rd Year - C',
    'II CSE - A': '2nd Year - A',
    'II CSE - B': '2nd Year - B',
    'II CSE - C': '2nd Year - C',
    'IV CSE - A': 'Final Year - A',
    'IV CSE - B': 'Final Year - B',
    'IV CSE - C': 'Final Year - C',
  };

  const mentorClass = staffInfo.assignedClass; // Obtained dynamically from logged-in staff info
  const targetSectionKey = mentorClass ? (classMapping[mentorClass] || mentorClass) : null;
  const sectionStudents = targetSectionKey ? (staffMockData.sections[targetSectionKey] || []) : [];

  // Dynamically calculate stats for the mentor's class
  const totalStudents = sectionStudents.length;
  const activeStudents = sectionStudents.filter((s) => s.status === 'active').length;
  const blockedStudents = sectionStudents.filter((s) => s.status === 'blocked').length;
  const warningCount = sectionStudents.reduce((sum, s) => sum + (s.attempts || 0), 0);

  // Filter students based on search and status filter
  const filteredStudents = sectionStudents.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.rollNo.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || student.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusStyle = (status) => {
    switch (status) {
      case 'active':
        return {
          bg: colors.activeLight || '#DCFCE7',
          text: colors.active || '#16A34A',
          border: '#BBF7D0',
          icon: 'check-circle-outline',
        };
      case 'blocked':
        return {
          bg: colors.blockedLight || '#FEE2E2',
          text: colors.blocked || '#DC2626',
          border: '#FECACA',
          icon: 'cellphone-off',
        };
      case 'offline':
      default:
        return {
          bg: '#F1F5F9',
          text: '#64748B',
          border: '#E2E8F0',
          icon: 'power-off',
        };
    }
  };

  const renderStudentItem = ({ item }) => {
    const statusStyle = getStatusStyle(item.status);

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setSelectedStudent(item)}
        style={styles.studentCard}
      >
        <View style={styles.studentHeader}>
          <View style={styles.studentInfoCol}>
            <Text style={styles.studentNameText}>{item.name}</Text>
            <Text style={styles.studentRollText}>{item.rollNo}</Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusStyle.bg, borderColor: statusStyle.border },
            ]}
          >
            <VectorIcon name={statusStyle.icon} size={14} color={statusStyle.text} />
            <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>
              {item.status.toUpperCase()}
            </Text>
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
            <VectorIcon name="alert-circle" size={14} color={colors.blocked} />
            <Text style={styles.attemptsWarningText}>
              {item.attempts} attempts to open restricted apps today
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Dynamic Top Bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.clockText}>{currentTime || 'Mon, Jul 27, 2026 | 05:30:12 AM'}</Text>
        </View>
        <View style={styles.topBarActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => onNavigateTab('notifications')}
          >
            <VectorIcon name="bell" size={22} color="#475569" />
            <View style={styles.bellDot} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.profileIndicator}
            onPress={() => onNavigateTab('profile')}
          >
            <Image source={{ uri: staffInfo.avatar }} style={styles.profileIndicatorImage} />
            <Text style={styles.profileIndicatorText}>Staff</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Welcome Dashboard Banner Card */}
        <View style={styles.welcomeBanner}>
          <View style={styles.welcomeInfo}>
            <Text style={styles.welcomeLabel}>WELCOME BACK,</Text>
            <Text style={styles.staffNameText}>{staffInfo.name}</Text>
            <View style={styles.mentorClassBadge}>
              <VectorIcon name="school" size={14} color={colors.primaryDark} />
              <Text style={styles.mentorClassBadgeText}>
                Class Mentor - {mentorClass || 'Not Assigned'}
              </Text>
            </View>
            <Text style={styles.staffMetaText}>
              ID: {staffInfo.id}  •  Dept: {staffInfo.department}
            </Text>
          </View>
          <View style={styles.datePill}>
            <VectorIcon name="calendar" size={14} color={colors.primary} />
            <Text style={styles.datePillText}>Monday, July 27, 2026</Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { borderLeftColor: colors.primary }]}>
            <View style={styles.statIconContainer}>
              <VectorIcon name="school" size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.statValue}>{totalStudents}</Text>
              <Text style={styles.statLabel}>Total Students</Text>
            </View>
          </View>

          <View style={[styles.statCard, { borderLeftColor: colors.active }]}>
            <View style={[styles.statIconContainer, { backgroundColor: colors.activeLight }]}>
              <VectorIcon name="cellphone" size={20} color={colors.active} />
            </View>
            <View>
              <Text style={styles.statValue}>{activeStudents}</Text>
              <Text style={styles.statLabel}>Active Students</Text>
            </View>
          </View>

          <View style={[styles.statCard, { borderLeftColor: colors.blocked }]}>
            <View style={[styles.statIconContainer, { backgroundColor: colors.blockedLight }]}>
              <VectorIcon name="cellphone-off" size={20} color={colors.blocked} />
            </View>
            <View>
              <Text style={styles.statValue}>{blockedStudents}</Text>
              <Text style={styles.statLabel}>Blocked Students</Text>
            </View>
          </View>

          <View style={[styles.statCard, { borderLeftColor: '#F59E0B' }]}>
            <View style={[styles.statIconContainer, { backgroundColor: '#FEF3C7' }]}>
              <VectorIcon name="alert-circle" size={20} color="#F59E0B" />
            </View>
            <View>
              <Text style={styles.statValue}>{warningCount}</Text>
              <Text style={styles.statLabel}>Warning Count</Text>
            </View>
          </View>
        </View>

        {/* Student Mobile Status list */}
        <View style={styles.listContainer}>
          <View style={styles.listHeaderRow}>
            <Text style={styles.listTitleText}>My Class Students</Text>
            {mentorClass && (
              <Text style={styles.listCountText}>
                ({filteredStudents.length} Students)
              </Text>
            )}
          </View>

          {sectionStudents.length === 0 ? (
            <View style={styles.emptyContainer}>
              <VectorIcon name="cellphone-off" size={48} color="#94A3B8" />
              <Text style={styles.emptyTitleText}>No Assigned Students</Text>
              <Text style={styles.emptySubtitleText}>
                No students are assigned to your class.
              </Text>
            </View>
          ) : (
            <>
              {/* Search Bar */}
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

              {/* Filter Badges */}
              <View style={styles.filterRow}>
                <TouchableOpacity
                  onPress={() => setStatusFilter('all')}
                  style={[styles.filterBadge, statusFilter === 'all' && styles.filterBadgeActive]}
                >
                  <Text style={[styles.filterBadgeText, statusFilter === 'all' && styles.filterBadgeTextActive]}>
                    My Class Students ({sectionStudents.length})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setStatusFilter('active')}
                  style={[
                    styles.filterBadge,
                    statusFilter === 'active' && [styles.filterBadgeActive, { backgroundColor: colors.activeLight, borderColor: '#BBF7D0' }],
                  ]}
                >
                  <Text
                    style={[
                      styles.filterBadgeText,
                      statusFilter === 'active' && { color: colors.active, fontWeight: '700' },
                    ]}
                  >
                    Active ({sectionStudents.filter(s => s.status === 'active').length})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setStatusFilter('blocked')}
                  style={[
                    styles.filterBadge,
                    statusFilter === 'blocked' && [styles.filterBadgeActive, { backgroundColor: colors.blockedLight, borderColor: '#FECACA' }],
                  ]}
                >
                  <Text
                    style={[
                      styles.filterBadgeText,
                      statusFilter === 'blocked' && { color: colors.blocked, fontWeight: '700' },
                    ]}
                  >
                    Blocked ({sectionStudents.filter(s => s.status === 'blocked').length})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setStatusFilter('offline')}
                  style={[
                    styles.filterBadge,
                    statusFilter === 'offline' && [styles.filterBadgeActive, { backgroundColor: '#F1F5F9', borderColor: '#E2E8F0' }],
                  ]}
                >
                  <Text
                    style={[
                      styles.filterBadgeText,
                      statusFilter === 'offline' && { color: '#475569', fontWeight: '700' },
                    ]}
                  >
                    Offline ({sectionStudents.filter(s => s.status === 'offline').length})
                  </Text>
                </TouchableOpacity>
              </View>

              {/* List display */}
              {filteredStudents.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <VectorIcon name="cellphone-off" size={42} color="#94A3B8" />
                  <Text style={styles.emptyTitleText}>No Student Devices Found</Text>
                  <Text style={styles.emptySubtitleText}>
                    No students in this class match the selected search query or status filter.
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={filteredStudents}
                  renderItem={renderStudentItem}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                />
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* Student Details Read-Only Modal */}
      {selectedStudent && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={!!selectedStudent}
          onRequestClose={() => setSelectedStudent(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Device Monitoring Details</Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setSelectedStudent(null)}
                  style={styles.modalCloseButton}
                >
                  <VectorIcon name="close" size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <View style={styles.modalIdentityRow}>
                  <View style={styles.modalAvatarPlaceholder}>
                    <Text style={styles.modalAvatarText}>
                      {selectedStudent.name.split(' ').map(n => n[0]).join('')}
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
                    <View
                      style={[
                        styles.modalStatusPill,
                        {
                          backgroundColor: getStatusStyle(selectedStudent.status).bg,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.modalStatusPillText,
                          { color: getStatusStyle(selectedStudent.status).text },
                        ]}
                      >
                        {selectedStudent.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.modalDetailItem}>
                    <Text style={styles.modalDetailLabel}>ACTIVE SCREEN TIME</Text>
                    <Text style={styles.modalDetailVal}>{selectedStudent.screenTime}</Text>
                  </View>

                  <View style={styles.modalDetailItem}>
                    <Text style={styles.modalDetailLabel}>RESTRICTION ATTEMPTS</Text>
                    <Text
                      style={[
                        styles.modalDetailVal,
                        selectedStudent.attempts > 0 && { color: colors.blocked, fontWeight: '700' },
                      ]}
                    >
                      {selectedStudent.attempts} blocks today
                    </Text>
                  </View>
                </View>

                <View style={styles.lockNoticeCard}>
                  <VectorIcon name="shield" size={16} color={colors.primary} />
                  <Text style={styles.lockNoticeText}>
                    Read-Only Monitoring Access. In accordance with classroom policy, only Administrators and HODs can modify restrictions.
                  </Text>
                </View>

                <Text style={styles.appStatusTitle}>Device App Categories Status</Text>
                <View style={styles.appBreakdownList}>
                  <View style={styles.appBreakdownItem}>
                    <VectorIcon name="instagram" size={16} color="#64748B" />
                    <Text style={styles.appName}>Social Media (Instagram, Facebook)</Text>
                    <Text style={[styles.appStatusLabel, { color: colors.blocked }]}>Blocked</Text>
                  </View>
                  <View style={styles.appBreakdownItem}>
                    <VectorIcon name="whatsapp" size={16} color="#64748B" />
                    <Text style={styles.appName}>Messaging (WhatsApp, Telegram)</Text>
                    <Text style={[styles.appStatusLabel, { color: colors.blocked }]}>Blocked</Text>
                  </View>
                  <View style={styles.appBreakdownItem}>
                    <VectorIcon name="gamepad" size={16} color="#64748B" />
                    <Text style={styles.appName}>Gaming Apps (Free Fire, PUBG)</Text>
                    <Text style={[styles.appStatusLabel, { color: colors.blocked }]}>Blocked</Text>
                  </View>
                  <View style={styles.appBreakdownItem}>
                    <VectorIcon name="book" size={16} color="#64748B" />
                    <Text style={styles.appName}>Educational & College Apps</Text>
                    <Text style={[styles.appStatusLabel, { color: colors.active }]}>Allowed</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setSelectedStudent(null)}
                style={styles.modalPrimaryBtn}
              >
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
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingTop: STATUSBAR_OFFSET,
    paddingBottom: 14,
    ...shadows.medium,
  },
  clockText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  bellDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#1E293B',
  },
  profileIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    gap: 6,
  },
  profileIndicatorImage: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#475569',
  },
  profileIndicatorText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  welcomeBanner: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: borderRadius.card,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.borderLight,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    ...shadows.card,
  },
  welcomeInfo: {
    flex: 1,
    marginRight: 10,
  },
  welcomeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1,
  },
  staffNameText: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 2,
  },
  mentorClassBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginTop: 8,
    alignSelf: 'flex-start',
    gap: 5,
  },
  mentorClassBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  staffMetaText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 6,
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 14,
    gap: 4,
  },
  datePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  statCard: {
    width: '45%',
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 8,
    marginVertical: 6,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...shadows.soft,
  },
  statIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 1,
  },
  listContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: borderRadius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.card,
  },
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 12,
  },
  listTitleText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  listCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    height: 44,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginLeft: 8,
    paddingVertical: 0,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  filterBadge: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterBadgeActive: {
    backgroundColor: colors.primaryLight,
    borderColor: '#EFF6FF',
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  filterBadgeTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  emptyTitleText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#475569',
    marginTop: 10,
  },
  emptySubtitleText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  studentCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: 12,
    padding: 12,
    ...shadows.soft,
  },
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  studentInfoCol: {
    flex: 1,
    marginRight: 8,
  },
  studentNameText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  studentRollText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  studentDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  studentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  studentMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  studentMetaText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  attemptsWarningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1F2',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginTop: 10,
    gap: 6,
  },
  attemptsWarningText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#E11D48',
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
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    paddingVertical: 16,
  },
  modalIdentityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  modalAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalAvatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  modalStudentName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  modalStudentRoll: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  modalDetailCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    gap: 10,
    marginBottom: 14,
  },
  modalDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalDetailLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
  },
  modalDetailVal: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalStatusPill: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  modalStatusPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  lockNoticeCard: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    gap: 8,
    marginBottom: 14,
  },
  lockNoticeText: {
    flex: 1,
    fontSize: 10,
    fontWeight: '600',
    color: '#1D4ED8',
    lineHeight: 14,
  },
  appStatusTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  appBreakdownList: {
    gap: 8,
  },
  appBreakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  appName: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
    marginLeft: 8,
  },
  appStatusLabel: {
    fontSize: 10,
    fontWeight: '800',
  },
  modalPrimaryBtn: {
    backgroundColor: colors.primary,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.soft,
  },
  modalPrimaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default StaffHomeScreen;
