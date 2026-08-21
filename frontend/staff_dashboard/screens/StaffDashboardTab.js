import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { colors, shadows, borderRadius } from '../../student_dashboard/styles/theme';
import VectorIcon from '../../student_dashboard/components/VectorIcon';
import StaffHeader from '../components/StaffHeader';
import PermissionModal from '../../components/PermissionModal';
import formatClassDisplay from '../../utils/formatClassDisplay';

const STATUSBAR_OFFSET = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 16;

export const StaffDashboardTab = ({ staffInfo: propStaffInfo, onNavigateTab }) => {
  const staffInfo = propStaffInfo || { name: '', department: '' };
  const [currentTime, setCurrentTime] = useState('');
  const [liveStudents, setLiveStudents] = useState([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [onlineStudents, setOnlineStudents] = useState(0);
  const [blockedStudents, setBlockedStudents] = useState(0);
  const [restrictedStudents, setRestrictedStudents] = useState(0);
  const [classAlerts, setClassAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [permModalVisible, setPermModalVisible] = useState(false);

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
            setPermModalVisible(true);
          }
        }
      } catch (e) {}
    };
    checkStaffNotif();
  }, []);

  const handleStaffNotifPermission = async () => {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      try {
        const { PermissionsAndroid } = require('react-native');
        await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      } catch (e) {}
    }
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem('@focussync:staffPermissionPrompted', 'true');
    } catch (e) {}
    setPermModalVisible(false);
  };

  const handlePermDismiss = async () => {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem('@focussync:staffPermissionPrompted', 'true');
    } catch (e) {}
    setPermModalVisible(false);
  };

  useEffect(() => {
    const updateTime = () => {
      const date = new Date();
      const options = { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true };
      const formatted = date.toLocaleDateString('en-US', options);
      const parts = formatted.split(', ');
      if (parts.length >= 3) {
        const yearTime = parts[2].split(' ');
        setCurrentTime(`${parts[0]}, ${parts[1]}, ${yearTime[0]} | ${yearTime.slice(1).join(' ')}`);
      } else {
        setCurrentTime(date.toLocaleTimeString());
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

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
          setBlockedStudents(students.filter(s => s.deviceStatus === 'blocked').length);
          setRestrictedStudents(students.filter(s => s.scheduleRestricted).length);
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
    return () => { isMounted = false; clearInterval(pollInterval); };
  }, [staffInfo]);

  const mentorClass = staffInfo.assignedClass || staffInfo.classId || '';

  const displayTotal = useMemo(() => totalStudents || liveStudents.length, [totalStudents, liveStudents]);

  const displayBlocked = useMemo(() => {
    return blockedStudents ?? liveStudents.filter((s) => s.deviceStatus === 'blocked').length;
  }, [blockedStudents, liveStudents]);

  const displayRestricted = useMemo(() => {
    return restrictedStudents ?? liveStudents.filter((s) => s.scheduleRestricted).length;
  }, [restrictedStudents, liveStudents]);

  const displayUnblocked = useMemo(() => {
    const val = displayTotal - displayBlocked - displayRestricted;
    return val > 0 ? val : 0;
  }, [displayTotal, displayBlocked, displayRestricted]);

  const sortedStudents = useMemo(() => {
    return [...liveStudents].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [liveStudents]);

  const renderStudentItem = ({ item, index }) => {
    const isBlocked = item.deviceStatus === 'blocked';
    let badgeBgColor = '#DCFCE7';
    let badgeTextColor = '#16A34A';
    let badgeText = 'Unblocked';

    if (!item.hasDevice) {
      badgeBgColor = '#FEF3C7'; badgeTextColor = '#D97706'; badgeText = 'No Login';
    } else if (!item.accessibilityEnabled || !item.overlayEnabled) {
      badgeBgColor = '#FEE2E2'; badgeTextColor = '#EF4444'; badgeText = 'No Perms';
    } else if (isBlocked) {
      badgeBgColor = '#FEE2E2'; badgeTextColor = '#EF4444'; badgeText = 'Blocked';
    } else if (item.scheduleRestricted) {
      badgeBgColor = '#FEF3C7'; badgeTextColor = '#D97706'; badgeText = 'Restricted';
    } else if (item.deviceStatus === 'offline') {
      badgeBgColor = '#F1F5F9'; badgeTextColor = '#64748B'; badgeText = 'Offline';
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
        <View style={[styles.statusBadge, { backgroundColor: badgeBgColor }]}>
          <Text style={[styles.statusText, { color: badgeTextColor }]}>{badgeText}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StaffHeader staffInfo={staffInfo} alertCount={classAlerts.length} onNavigateTab={onNavigateTab} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.welcomeHeaderSection}>
          <View style={styles.welcomeInfo}>
            <Text style={styles.welcomeLabel}>CLASS MENTOR CONSOLE</Text>
            <Text style={styles.classNameText}>{formatClassDisplay(mentorClass)}</Text>
            <Text style={styles.staffMetaText}>
              Mentor: {staffInfo.name}  ·  Dept: {typeof staffInfo.department === 'string' ? staffInfo.department : (staffInfo.department?.name || '')}
            </Text>
            {currentTime ? <Text style={styles.clockBannerText}>{currentTime}</Text> : null}
          </View>
          <View style={styles.classIcon}>
            <VectorIcon name="school" size={24} color={colors.primary} />
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statHeaderRow}>
              <View style={[styles.statIconContainer, { backgroundColor: '#EFF6FF' }]}>
                <VectorIcon name="school" size={14} color={colors.primary} />
              </View>
              <Text style={[styles.badgeText, { color: '#0284C7' }]}>{displayTotal ? `${Math.round((onlineStudents / displayTotal) * 100)}%` : '0%'}</Text>
            </View>
            <Text style={styles.statValue}>{displayTotal}</Text>
            <Text style={styles.statLabel} numberOfLines={1}>Total</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statHeaderRow}>
              <View style={[styles.statIconContainer, { backgroundColor: '#DCFCE7' }]}>
                <VectorIcon name="cellphone" size={14} color="#16A34A" />
              </View>
              <Text style={[styles.badgeText, { color: '#16A34A' }]}>{displayTotal ? Math.round((displayUnblocked / displayTotal) * 100) : 0}%</Text>
            </View>
            <Text style={styles.statValue}>{displayUnblocked}</Text>
            <Text style={styles.statLabel} numberOfLines={1}>Unblocked</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statHeaderRow}>
              <View style={[styles.statIconContainer, { backgroundColor: '#FEE2E2' }]}>
                <VectorIcon name="cellphone-off" size={14} color="#EF4444" />
              </View>
              {displayBlocked > 0 ? <Text style={[styles.badgeText, { color: '#EF4444' }]}>{displayTotal ? Math.round((displayBlocked / displayTotal) * 100) : 0}%</Text> : null}
            </View>
            <Text style={styles.statValue}>{displayBlocked}</Text>
            <Text style={styles.statLabel} numberOfLines={1}>Blocked</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statHeaderRow}>
              <View style={[styles.statIconContainer, { backgroundColor: '#FEF3C7' }]}>
                <VectorIcon name="clock-outline" size={14} color="#D97706" />
              </View>
              {displayRestricted > 0 ? <Text style={[styles.badgeText, { color: '#D97706' }]}>{displayTotal ? Math.round((displayRestricted / displayTotal) * 100) : 0}%</Text> : null}
            </View>
            <Text style={styles.statValue}>{displayRestricted}</Text>
            <Text style={styles.statLabel} numberOfLines={1}>Restricted</Text>
          </View>
        </View>

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
              keyExtractor={(item) => item.studentId || item.email || String(Math.random())}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
            />
          )}
        </View>
      </ScrollView>

      <PermissionModal
        visible={permModalVisible}
        type="notification"
        onPrimary={handleStaffNotifPermission}
        onSecondary={handlePermDismiss}
        onTertiary={handlePermDismiss}
        onDismiss={handlePermDismiss}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { paddingBottom: 40 },
  welcomeHeaderSection: { marginHorizontal: 16, marginTop: 20, marginBottom: 20, paddingVertical: 4, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  welcomeInfo: { flex: 1 },
  welcomeLabel: { fontSize: 10, fontWeight: '800', color: colors.primary, letterSpacing: 1 },
  classNameText: { fontSize: 22, fontWeight: '800', color: '#0F172A', marginTop: 8 },
  staffMetaText: { fontSize: 12, fontWeight: '600', color: '#64748B', marginTop: 10 },
  clockBannerText: { fontSize: 11, fontWeight: '600', color: colors.primary, marginTop: 8 },
  classIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, marginBottom: 16, width: '100%' },
  statCard: { width: '47%', marginHorizontal: '1.5%', marginBottom: 8, backgroundColor: '#FFFFFF', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 6, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden', ...shadows.soft },
  statHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  statIconContainer: { width: 24, height: 24, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  badgeText: { fontSize: 9, fontWeight: '700' },
  statValue: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 1 },
  statLabel: { fontSize: 10, fontWeight: '600', color: '#64748B' },
  listContainer: { backgroundColor: '#FFFFFF', marginHorizontal: 16, borderRadius: borderRadius.card, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  listTitleText: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  listSubtitleText: { fontSize: 11, fontWeight: '500', color: '#64748B', marginTop: 2, marginBottom: 16 },
  studentItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  indexContainer: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  indexText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  studentRoll: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  itemSeparator: { height: 1, backgroundColor: '#F1F5F9' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 32, paddingHorizontal: 16 },
  emptyTitleText: { fontSize: 14, fontWeight: '800', color: '#475569', marginTop: 10 },
  emptySubtitleText: { fontSize: 12, color: '#94A3B8', textAlign: 'center', marginTop: 4, lineHeight: 18 },
});

export default StaffDashboardTab;