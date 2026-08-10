import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, Platform, StatusBar } from 'react-native';
import { colors, shadows, borderRadius } from '../../student_dashboard/styles/theme';
import VectorIcon from '../../student_dashboard/components/VectorIcon';
import staffMockData from '../data/staffMockData';
import StaffHeader from '../components/StaffHeader';

const STATUSBAR_OFFSET = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 16;

export const StaffDashboardTab = ({ staffInfo: propStaffInfo, onNavigateTab }) => {
  const staffInfo = propStaffInfo || { name: '', department: '' };
  const [currentTime, setCurrentTime] = useState('');
  const [liveStudents, setLiveStudents] = useState([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [onlineStudents, setOnlineStudents] = useState(0);
  const [blockedStudents, setBlockedStudents] = useState(0);
  const [unblockedStudents, setUnblockedStudents] = useState(0);
  const [warningCount, setWarningCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [classAlerts, setClassAlerts] = useState([]);

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

  // Fetch live class status from backend
  useEffect(() => {
    let isMounted = true;
    const fetchStatus = async () => {
      const classIdToQuery = staffInfo?.classRoomId || staffInfo?.classId;
      if (!classIdToQuery) return;

      try {
        const staffService = require('../../services/staffService').default;
        const data = await staffService.fetchClassLiveStatus(classIdToQuery);
        if (isMounted && data) {
          const students = data.students || [];
          setLiveStudents(students);
          setTotalStudents(data.totalStudents || students.length);
          setOnlineStudents(data.onlineStudents || students.filter(s => s.isOnline).length);

          const blocked = students.filter(s => s.deviceStatus === 'blocked').length;
          setBlockedStudents(blocked);

          const unblocked = students.filter(s => s.deviceStatus === 'online' || s.deviceStatus === 'active').length;
          setUnblockedStudents(unblocked);

          const warnings = students.reduce((sum, s) => sum + (s.attempts || 0), 0);
          setWarningCount(warnings);
          setClassAlerts(data.alerts || []);
        }
      } catch (err) {
        console.warn('FocusSync: Failed to load class live status:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchStatus();
    const pollInterval = setInterval(fetchStatus, 10000);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [staffInfo]);

  const mentorClass = staffInfo.assignedClass || staffInfo.classId || 'Not Assigned';

  // Sort students alphabetically by name
  const sortedStudents = [...liveStudents].sort((a, b) => a.name.localeCompare(b.name));

  // Helper to format assigned class name (e.g. "III CSE - A" -> "3rd Year CSE - Section A")
  const formatClassDisplay = (assignedClass) => {
    if (!assignedClass) return 'No Class Assigned';

    // Handle new format: e.g. "CSE-2-D"
    if (assignedClass.includes('-') && !assignedClass.includes(' - ')) {
      const parts = assignedClass.split('-');
      if (parts.length === 3) {
        const dept = parts[0];
        const yearVal = parts[1];
        const section = parts[2];

        let yearText = `${yearVal}th Year`;
        if (yearVal === '1') yearText = '1st Year';
        else if (yearVal === '2') yearText = '2nd Year';
        else if (yearVal === '3') yearText = '3rd Year';
        else if (yearVal === '4') yearText = '4th Year';

        return `${yearText} ${dept} - Section ${section}`;
      }
    }

    // Handle old format: e.g. "III CSE - A"
    const parts = assignedClass.split(' - ');
    const classPart = parts[0]; // e.g. "III CSE"
    const section = parts[1] || ''; // e.g. "A"

    let yearText = '';
    if (classPart.startsWith('III')) {
      yearText = '3rd Year';
    } else if (classPart.startsWith('II')) {
      yearText = '2nd Year';
    } else if (classPart.startsWith('IV')) {
      yearText = '4th Year';
    } else if (classPart.startsWith('I')) {
      yearText = '1st Year';
    } else {
      yearText = classPart;
    }

    // Extract department if present (e.g., "III CSE" -> "CSE")
    const deptPart = classPart.replace(/^[IVX\s]+/, '').trim(); // Remove Roman numerals

    return `${yearText} ${deptPart}${section ? ` - Section ${section}` : ''}`;
  };

  const renderStudentItem = ({ item, index }) => {
    const isBlocked = item.deviceStatus === 'blocked';
    
    // Determine status badge style and text
    let badgeBgColor = '#DCFCE7';
    let badgeTextColor = '#16A34A';
    let badgeText = 'Unblocked';

    if (!item.hasDevice) {
      badgeBgColor = '#FEF3C7';
      badgeTextColor = '#D97706';
      badgeText = 'No Login';
    } else if (!item.accessibilityEnabled || !item.overlayEnabled) {
      badgeBgColor = '#FEE2E2';
      badgeTextColor = '#EF4444';
      badgeText = 'No Perms';
    } else if (isBlocked) {
      badgeBgColor = '#FEE2E2';
      badgeTextColor = '#EF4444';
      badgeText = 'Blocked';
    } else if (item.deviceStatus === 'offline') {
      badgeBgColor = '#F1F5F9';
      badgeTextColor = '#64748B';
      badgeText = 'Offline';
    }

    return (
      <View style={styles.studentItem}>
        <View style={styles.indexContainer}>
          <Text style={styles.indexText}>{index + 1}</Text>
        </View>
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>{item.name}</Text>
          <Text style={styles.studentRoll}>{item.rollNo || item.email}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: badgeBgColor },
          ]}
        >
          <Text style={[styles.statusText, { color: badgeTextColor }]}>
            {badgeText}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StaffHeader staffInfo={staffInfo} onNavigateTab={onNavigateTab} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Mentor Title (Flat layout, no card background) */}
        <View style={styles.welcomeHeaderSection}>
          <View style={styles.welcomeInfo}>
            <Text style={styles.welcomeLabel}>CLASS MENTOR CONSOLE</Text>
            <Text style={styles.classNameText}>{formatClassDisplay(mentorClass)}</Text>
            <Text style={styles.staffMetaText}>
              Mentor: {staffInfo.name}  •  Dept: {typeof staffInfo.department === 'string' ? staffInfo.department : (staffInfo.department?.name || 'Computer Science Engineering')}
            </Text>
            {currentTime ? (
              <Text style={styles.clockBannerText}>{currentTime}</Text>
            ) : null}
          </View>
          <View style={styles.classIcon}>
            <VectorIcon name="school" size={24} color={colors.primary} />
          </View>
        </View>

        {/* Dynamic Class Alerts & Warnings Banner */}
        {classAlerts.length > 0 ? (
          <View style={styles.alertsBannerContainer}>
            <View style={styles.alertsBannerHeader}>
              <VectorIcon name="alert-circle" size={16} color="#EF4444" />
              <Text style={styles.alertsBannerTitle}>COMPLIANCE ALERTS ({classAlerts.length})</Text>
            </View>
            <ScrollView style={styles.alertsScroll} nestedScrollEnabled={true}>
              {classAlerts.map((alert, idx) => (
                <View key={idx} style={styles.alertRow}>
                  <Text style={styles.alertDot}>•</Text>
                  <Text style={styles.alertMessageText} numberOfLines={2}>
                    {alert.message}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* 3 Executive Compact Stats Cards */}
        <View style={styles.statsGrid}>
          {/* Card 1: Total Students */}
          <View style={styles.statCard}>
            <View style={styles.statHeaderRow}>
              <View style={[styles.statIconContainer, { backgroundColor: '#EFF6FF' }]}>
                <VectorIcon name="school" size={14} color={colors.primary} />
              </View>
              <Text style={[styles.badgeText, { color: '#0284C7' }]}>100%</Text>
            </View>
            <Text style={styles.statValue}>{totalStudents}</Text>
            <Text style={styles.statLabel} numberOfLines={1}>Total</Text>
          </View>

          {/* Card 2: Unblocked Students */}
          <View style={styles.statCard}>
            <View style={styles.statHeaderRow}>
              <View style={[styles.statIconContainer, { backgroundColor: '#DCFCE7' }]}>
                <VectorIcon name="cellphone" size={14} color="#16A34A" />
              </View>
              <Text style={[styles.badgeText, { color: '#16A34A' }]}>
                {totalStudents ? Math.round((unblockedStudents / totalStudents) * 100) : 0}%
              </Text>
            </View>
            <Text style={styles.statValue}>{unblockedStudents}</Text>
            <Text style={styles.statLabel} numberOfLines={1}>Unblocked</Text>
          </View>

          {/* Card 3: Blocked Students */}
          <View style={styles.statCard}>
            <View style={styles.statHeaderRow}>
              <View style={[styles.statIconContainer, { backgroundColor: '#FEE2E2' }]}>
                <VectorIcon name="cellphone-off" size={14} color="#EF4444" />
              </View>
              {blockedStudents > 0 ? (
                <Text style={[styles.badgeText, { color: '#EF4444' }]}>
                  {totalStudents ? Math.round((blockedStudents / totalStudents) * 100) : 0}%
                </Text>
              ) : null}
            </View>
            <Text style={styles.statValue}>{blockedStudents}</Text>
            <Text style={styles.statLabel} numberOfLines={1}>Blocked</Text>
          </View>
        </View>

        {/* Alphabetical Student Directory */}
        <View style={styles.listContainer}>
          <Text style={styles.listTitleText}>My Class Student Directory</Text>
          <Text style={styles.listSubtitleText}>Class students listed in alphabetical order.</Text>

          {liveStudents.length === 0 ? (
            <View style={styles.emptyContainer}>
              <VectorIcon name="account-off" size={48} color="#94A3B8" />
              <Text style={styles.emptyTitleText}>No Assigned Students</Text>
              <Text style={styles.emptySubtitleText}>No students are assigned to your class.</Text>
            </View>
          ) : (
            <FlatList
              data={sortedStudents}
              renderItem={renderStudentItem}
              keyExtractor={(item) => item.studentId || item.email}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
              style={styles.flatList}
            />
          )}
        </View>
      </ScrollView>
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
  topBarTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  alertsBannerContainer: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: 8,
    padding: 12,
  },
  alertsBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertsBannerTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#EF4444',
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  alertsScroll: {
    maxHeight: 100,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  alertDot: {
    color: '#EF4444',
    marginRight: 6,
    fontSize: 14,
    lineHeight: 14,
  },
  alertMessageText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
    lineHeight: 16,
  },
  welcomeHeaderSection: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 20,
    paddingVertical: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeInfo: {
    flex: 1,
  },
  welcomeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1,
  },
  classNameText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 8,
  },
  staffMetaText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 10,
  },
  clockBannerText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 8,
  },
  classIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    marginBottom: 16,
    width: '100%',
  },
  statCard: {
    width: '31.5%',
    marginHorizontal: '0.8%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    ...shadows.soft,
  },
  statHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  statIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 1,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  listContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: borderRadius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  listTitleText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  listSubtitleText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
    marginBottom: 16,
  },
  flatList: {
    marginTop: 4,
  },
  studentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  indexContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  indexText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  studentRoll: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  itemSeparator: {
    height: 1,
    backgroundColor: '#F1F5F9',
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
});

export default StaffDashboardTab;
