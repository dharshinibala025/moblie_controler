import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { colors, shadows, borderRadius } from '../../student_dashboard/styles/theme';
import VectorIcon from '../../student_dashboard/components/VectorIcon';
import StaffHeader from '../components/StaffHeader';
import PermissionModal from '../../components/PermissionModal';

const STATUSBAR_OFFSET = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 16;

export const StaffDashboardTab = ({ staffInfo: propStaffInfo, onNavigateTab }) => {
  const staffInfo = propStaffInfo || { name: '', department: '' };
  const [currentTime, setCurrentTime] = useState('');
  const [liveStudents, setLiveStudents] = useState([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [onlineStudents, setOnlineStudents] = useState(0);
  const [blockedStudents, setBlockedStudents] = useState(0);
  const [restrictedStudents, setRestrictedStudents] = useState(0);
  const [unblockedStudents, setUnblockedStudents] = useState(0);
  const [warningCount, setWarningCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [classAlerts, setClassAlerts] = useState([]);
  const [permModalVisible, setPermModalVisible] = useState(false);
  const [permStep, setPermStep] = useState('notification');

  // Check Staff Notification Permission on Mount (Once only)
  useEffect(() => {
    const checkStaffNotif = async () => {
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const alreadyPrompted = await AsyncStorage.getItem('@focussync:staffPermissionPrompted');
        if (alreadyPrompted === 'true') return;

        if (Platform.OS === 'android' && Platform.Version >= 33) {
          const { PermissionsAndroid } = require('react-native');
          const hasNotif = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
          if (!hasNotif) {
            setPermStep('notification');
            setPermModalVisible(true);
          }
        }
      } catch (e) {
        // ignore
      }
    };
    checkStaffNotif();
  }, []);

  const handleStaffNotifPermission = async () => {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      try {
        const { PermissionsAndroid } = require('react-native');
        await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      } catch (e) {
        // ignore
      }
    }
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem('@focussync:staffPermissionPrompted', 'true');
    } catch (e) {
      // ignore
    }
    setPermModalVisible(false);
  };

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
    const interval = setInterval(updateTime, 30000);
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

          const restricted = students.filter(s => s.scheduleRestricted).length;
          setRestrictedStudents(restricted);

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

  const mentorClass = staffInfo.assignedClass || staffInfo.classId || '';

  const displayTotal = totalStudents || liveStudents.length;
  const displayBlocked = blockedStudents || liveStudents.filter((s) => s.status === 'blocked' || s.deviceStatus === 'blocked').length;
  const displayRestricted = restrictedStudents || liveStudents.filter((s) => s.scheduleRestricted).length;
  const displayUnblocked = unblockedStudents || (displayTotal - displayBlocked - displayRestricted);

  // Sort students alphabetically by name
  const sortedStudents = [...liveStudents].sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  // Helper to format assigned class name (e.g. "III CSE - A" -> "CSE - Section 3rd Year A")
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

        return `${dept} - Section ${yearText ? `${yearText} ` : ''}${section}`;
      }
    }

    const str = String(assignedClass).trim();
    let yearText = '';
    if (str.includes('III') || str.includes('3rd')) yearText = '3rd Year';
    else if (str.includes('IV') || str.includes('4th') || str.includes('Final')) yearText = 'Final Year';
    else if (str.includes('II') || str.includes('2nd')) yearText = '2nd Year';
    else if (str.includes('I') || str.includes('1st')) yearText = '1st Year';

    let section = 'A';
    if (str.includes(' - ')) {
      section = str.split(' - ')[1] || 'A';
    } else if (str.match(/Section\s+([A-Z])/i)) {
      section = str.match(/Section\s+([A-Z])/i)[1];
    } else {
      const lastChar = str.trim().slice(-1);
      if (['A', 'B', 'C', 'D'].includes(lastChar)) section = lastChar;
    }

    return `CSE - Section ${yearText ? `${yearText} ` : ''}${section}`;
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
    } else if (item.scheduleRestricted) {
      badgeBgColor = '#FEF3C7';
      badgeTextColor = '#D97706';
      badgeText = 'Restricted';
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
      <StaffHeader staffInfo={staffInfo} alertCount={classAlerts.length} onNavigateTab={onNavigateTab} />

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

        {/* 4 Executive Compact Stats Cards */}
        <View style={styles.statsGrid}>
          {/* Card 1: Total Students */}
          <View style={styles.statCard}>
            <View style={styles.statHeaderRow}>
              <View style={[styles.statIconContainer, { backgroundColor: '#EFF6FF' }]}>
                <VectorIcon name="school" size={14} color={colors.primary} />
              </View>
              <Text style={[styles.badgeText, { color: '#0284C7' }]}>100%</Text>
            </View>
            <Text style={styles.statValue}>{displayTotal}</Text>
            <Text style={styles.statLabel} numberOfLines={1}>Total</Text>
          </View>

          {/* Card 2: Unblocked Students */}
          <View style={styles.statCard}>
            <View style={styles.statHeaderRow}>
              <View style={[styles.statIconContainer, { backgroundColor: '#DCFCE7' }]}>
                <VectorIcon name="cellphone" size={14} color="#16A34A" />
              </View>
              <Text style={[styles.badgeText, { color: '#16A34A' }]}>
                {displayTotal ? Math.round((displayUnblocked / displayTotal) * 100) : 0}%
              </Text>
            </View>
            <Text style={styles.statValue}>{displayUnblocked}</Text>
            <Text style={styles.statLabel} numberOfLines={1}>Unblocked</Text>
          </View>

          {/* Card 3: Blocked Students */}
          <View style={styles.statCard}>
            <View style={styles.statHeaderRow}>
              <View style={[styles.statIconContainer, { backgroundColor: '#FEE2E2' }]}>
                <VectorIcon name="cellphone-off" size={14} color="#EF4444" />
              </View>
              {displayBlocked > 0 ? (
                <Text style={[styles.badgeText, { color: '#EF4444' }]}>
                  {displayTotal ? Math.round((displayBlocked / displayTotal) * 100) : 0}%
                </Text>
              ) : null}
            </View>
            <Text style={styles.statValue}>{displayBlocked}</Text>
            <Text style={styles.statLabel} numberOfLines={1}>Blocked</Text>
          </View>

          {/* Card 4: Restricted Students */}
          <View style={styles.statCard}>
            <View style={styles.statHeaderRow}>
              <View style={[styles.statIconContainer, { backgroundColor: '#FEF3C7' }]}>
                <VectorIcon name="clock-outline" size={14} color="#D97706" />
              </View>
              {displayRestricted > 0 ? (
                <Text style={[styles.badgeText, { color: '#D97706' }]}>
                  {displayTotal ? Math.round((displayRestricted / displayTotal) * 100) : 0}%
                </Text>
              ) : null}
            </View>
            <Text style={styles.statValue}>{displayRestricted}</Text>
            <Text style={styles.statLabel} numberOfLines={1}>Restricted</Text>
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
            />
          )}
        </View>
      </ScrollView>

      {/* Permission Modal Dialog */}
      <PermissionModal
        visible={permModalVisible}
        type="notification"
        onPrimary={handleStaffNotifPermission}
        onSecondary={() => setPermModalVisible(false)}
        onTertiary={() => setPermModalVisible(false)}
        onDismiss={() => setPermModalVisible(false)}
      />
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
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    marginBottom: 16,
    width: '100%',
  },
  statCard: {
    width: '47%',
    marginHorizontal: '1.5%',
    marginBottom: 8,
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
