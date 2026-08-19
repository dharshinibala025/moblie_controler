import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { colors, shadows, borderRadius } from '../../student_dashboard/styles/theme';
import VectorIcon from '../../student_dashboard/components/VectorIcon';
import staffService from '../../services/staffService';

const STATUSBAR_OFFSET = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 16;


const parseTo24Hour = (timeStr) => {
  if (!timeStr) return '09:00';
  const clean = timeStr.trim().toUpperCase();
  const match = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/);
  if (!match) return '09:00';
  let [_, hoursStr, minutesStr, ampm] = match;
  let hours = parseInt(hoursStr, 10);
  if (ampm === 'PM' && hours < 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;
  return `${hours.toString().padStart(2, '0')}:${minutesStr}`;
};

const formatTo12Hour = (timeStr) => {
  if (!timeStr) return '09:00 AM';
  const parts = timeStr.split(':');
  if (parts.length < 2) return '09:00 AM';
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
};

export const StaffDevicesTab = ({ staffInfo: propStaffInfo, onNavigateTab }) => {
  const staffInfo = propStaffInfo || { name: '', department: '' };
  const mentorClass = staffInfo.assignedClass || staffInfo.classId || 'Not Assigned';

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

    const deptPart = classPart.replace(/^[IVX\s]+/, '').trim(); // Remove Roman numerals

    return `${yearText} ${deptPart}${section ? ` - Section ${section}` : ''}`;
  };

  // State
  const [startTime, setStartTime] = useState('09:00 AM');
  const [endTime, setEndTime] = useState('04:00 PM');
  const [restrictionStatus, setRestrictionStatus] = useState('IDLE');
  const [currentTime, setCurrentTime] = useState('');
  const [activeRule, setActiveRule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liveStudents, setLiveStudents] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

  // Helper to resolve staff class ID dynamically.
  // Rules and student matching are keyed by the human-readable class CODE
  // (e.g. "CSE-2-A"), NOT the Mongo ObjectId, so we must always resolve the code.
  const resolveStaffClassCode = async () => {
    const isObjectId = (value) => !!value && /^[a-f0-9]{24}$/i.test(value);

    const candidates = [staffInfo?.classId, staffInfo?.assignedClass];
    for (const candidate of candidates) {
      if (candidate && !isObjectId(candidate)) {
        return candidate;
      }
    }

    if (staffInfo?.classRoomId) {
      try {
        const staffService = require('../../services/staffService').default;
        const myClassesRes = await staffService.fetchMyClasses();
        if (myClassesRes && myClassesRes.classes && myClassesRes.classes.length > 0) {
          const cls = myClassesRes.classes[0];
          return cls.code || cls._id;
        }
      } catch (e) {
        console.warn('FocusSync: My classes fetch notice:', e.message);
      }
    }

    return staffInfo?.classRoomId || staffInfo?.classId || 'default-class';
  };

  const getAssignedClassId = () => resolveStaffClassCode();

  // Load rules on mount + poll live status every 15s
  useEffect(() => {
    const fetchRule = async () => {
      const classIdToQuery = await getAssignedClassId();
      if (!classIdToQuery) return;
      try {
        const staffService = require('../../services/staffService').default;
        const rules = await staffService.fetchClassRules(classIdToQuery);
        if (rules && rules.length > 0) {
          // Find most recent rule
          const rule = rules[0];
          setActiveRule(rule);

          setStartTime(formatTo12Hour(rule.scheduleStart));
          setEndTime(formatTo12Hour(rule.scheduleEnd));

          if (rule.status === 'active') {
            setRestrictionStatus('ACTIVE');
          } else if (rule.status === 'paused') {
            setRestrictionStatus('PAUSED');
          } else {
            setRestrictionStatus('IDLE');
          }
        } else {
          setRestrictionStatus('IDLE');
        }
      } catch (err) {
        console.warn('FocusSync: Failed to load class rules:', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchStudents = async () => {
      const classIdToQuery = await getAssignedClassId();
      if (!classIdToQuery) return;
      try {
        const staffService = require('../../services/staffService').default;
        const data = await staffService.fetchClassLiveStatus(classIdToQuery);
        if (data && data.students) {
          setLiveStudents(data.students);
        }
      } catch (e) {
        // ignore
      }
    };

    fetchRule();
    fetchStudents();
    const liveInterval = setInterval(() => {
      fetchRule();
      fetchStudents();
    }, 15 * 1000);
    return () => clearInterval(liveInterval);
  }, [staffInfo]);

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

  // Restriction actions
  const handleApplyRestriction = async () => {
    const classIdToQuery = await getAssignedClassId();

    setLoading(true);
    try {
      const staffService = require('../../services/staffService').default;
      
      const payload = {
        blockedApps: ['SocialMedia', 'Games'],
        scheduleStart: parseTo24Hour(startTime),
        scheduleEnd: parseTo24Hour(endTime),
        activeDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        reason: `Study Hours Policy restriction`,
        status: 'active',
      };

      let ruleResult;
      if (activeRule && activeRule._id) {
        try {
          ruleResult = await staffService.updateClassRule(classIdToQuery, activeRule._id, payload);
        } catch (e) {
          ruleResult = await staffService.createClassRule(classIdToQuery, payload);
        }
      } else {
        ruleResult = await staffService.createClassRule(classIdToQuery, payload);
      }

      // Explicitly send start command to trigger real-time dispatch (Socket/FCM)
      if (ruleResult && ruleResult._id) {
        try {
          await staffService.sendClassRuleCommand(classIdToQuery, ruleResult._id, 'start');
        } catch (cmdErr) {
          console.warn('Rule command notice:', cmdErr.message);
        }
      }

      setActiveRule(ruleResult);
      setRestrictionStatus('ACTIVE');

      Alert.alert(
        'Restriction Applied',
        `Restriction schedule successfully applied to your class!\n\nClass: ${mentorClass}\nSchedule: ${startTime} – ${endTime}`,
      );
    } catch (err) {
      Alert.alert('Apply Failed', err.message || 'Failed to apply restriction policy. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePauseRestriction = async () => {
    const classIdToQuery = await getAssignedClassId();

    // Optimistic UI: instantly show paused
    setRestrictionStatus('PAUSED');
    setActionLoading(true);
    try {
      const staffService = require('../../services/staffService').default;
      await staffService.pauseClassRestriction(classIdToQuery);
      Alert.alert('Restriction Paused', 'Mobile restriction temporarily paused. Students can access apps now.');
    } catch (err) {
      setRestrictionStatus('ACTIVE');
      Alert.alert('Pause Failed', err.message || 'Failed to pause restriction. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResumeRestriction = async () => {
    const classIdToQuery = await getAssignedClassId();

    // Optimistic UI: instantly show active
    setRestrictionStatus('ACTIVE');
    setActionLoading(true);
    try {
      const staffService = require('../../services/staffService').default;
      await staffService.resumeClassRestriction(classIdToQuery);
      Alert.alert('Restriction Resumed', 'Mobile restriction is active again. Apps are now blocked.');
    } catch (err) {
      setRestrictionStatus('PAUSED');
      Alert.alert('Resume Failed', err.message || 'Failed to resume restriction. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = () => {
    if (restrictionStatus === 'ACTIVE') return '#16A34A';
    if (restrictionStatus === 'PAUSED') return '#F59E0B';
    return '#64748B';
  };

  return (
    <View style={styles.container}>
      {/* Page Header (White background, flat text) */}
      <View style={styles.subHeader}>
        <Text style={styles.titleText}>Class Restrictions & Rules</Text>
        <Text style={styles.subtitleText}>
          Configure and enforce mobile blocklists and schedules for your students.
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Flat Restriction Configuration form (No surrounding card wrap) */}
        <View style={styles.flatFormContainer}>
          {/* Status Row */}
          <View style={styles.statusIndicatorRow}>
            <Text style={styles.labelTitle}>Restriction Status:</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '1A' }]}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
              <Text style={[styles.statusBadgeText, { color: getStatusColor() }]}>
                {restrictionStatus}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Locked Target Mentor Class */}
          <Text style={styles.labelTitle}>Target Supervision Class</Text>
          <View style={styles.targetClassRow}>
            <View style={styles.lockedField}>
              <Text style={styles.fieldLabel}>Department</Text>
              <View style={styles.lockedBadge}>
                <VectorIcon name="school" size={14} color="#475569" />
                <Text style={styles.lockedBadgeText}>
                  {staffInfo.department || 'CSE'}
                </Text>
              </View>
            </View>

            <View style={styles.lockedField}>
              <Text style={styles.fieldLabel}>Class Assignment</Text>
              <View style={[styles.lockedBadge, { backgroundColor: colors.primaryLight }]}>
                <VectorIcon name="book" size={14} color={colors.primaryDark} />
                <Text style={[styles.lockedBadgeText, { color: colors.primaryDark }]}>
                  {formatClassDisplay(mentorClass)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Restriction Schedule */}
          <Text style={styles.labelTitle}>RESTRICTION SCHEDULE</Text>

          <View style={styles.scheduleRow}>
            <View style={styles.timeInputBox}>
              <Text style={styles.timeInputLabel}>Start Time</Text>
              <TextInput
                style={styles.timeInput}
                value={startTime}
                onChangeText={setStartTime}
              />
            </View>

            <View style={styles.timeInputBox}>
              <Text style={styles.timeInputLabel}>End Time</Text>
              <TextInput
                style={styles.timeInput}
                value={endTime}
                onChangeText={setEndTime}
              />
            </View>
          </View>

          <View style={styles.divider} />

          {/* Control Action Buttons */}
          <View style={styles.controlsGroup}>
            <TouchableOpacity
              style={styles.applyBtn}
              onPress={handleApplyRestriction}
              activeOpacity={0.8}
            >
              <VectorIcon name="clock-outline" size={18} color="#FFFFFF" />
              <Text style={styles.applyBtnText}>Set Restriction Timing</Text>
            </TouchableOpacity>

            <View style={styles.secondaryControlsRow}>
              <TouchableOpacity
                style={[styles.pauseBtn, restrictionStatus === 'ACTIVE' && styles.pauseBtnActive]}
                onPress={handlePauseRestriction}
                disabled={restrictionStatus !== 'ACTIVE' || actionLoading}
              >
                <VectorIcon name="pause" size={16} color={restrictionStatus === 'ACTIVE' ? '#FFFFFF' : '#F59E0B'} />
                <Text style={[styles.pauseBtnText, restrictionStatus === 'ACTIVE' && styles.pauseBtnTextActive]}>
                  Pause
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.resumeBtn, restrictionStatus === 'PAUSED' && styles.resumeBtnActive]}
                onPress={handleResumeRestriction}
                disabled={restrictionStatus !== 'PAUSED' || actionLoading}
              >
                <VectorIcon name="play" size={16} color={restrictionStatus === 'PAUSED' ? '#FFFFFF' : '#16A34A'} />
                <Text style={[styles.resumeBtnText, restrictionStatus === 'PAUSED' && styles.resumeBtnTextActive]}>
                  Resume
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.removeRestrictionBtn}
              onPress={() => {
                Alert.alert(
                  'Remove Restriction',
                  'Are you sure you want to remove the restriction for this class?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Remove',
                      style: 'destructive',
                      onPress: async () => {
                        const classIdToQuery = await getAssignedClassId();
                        setActionLoading(true);
                        try {
                          const staffService = require('../../services/staffService').default;
                          await staffService.updateClassRule(classIdToQuery, activeRule._id, { status: 'stopped' });
                          setRestrictionStatus('IDLE');
                          setActiveRule(null);
                          Alert.alert('Restriction Removed', 'Class restriction has been removed successfully.');
                        } catch (err) {
                          Alert.alert('Remove Failed', err.message || 'Failed to remove restriction. Please try again.');
                        } finally {
                          setActionLoading(false);
                        }
                      },
                    },
                  ],
                );
              }}
              disabled={restrictionStatus === 'IDLE' || actionLoading}
              activeOpacity={0.8}
            >
              <VectorIcon name="close-circle-outline" size={18} color="#FFFFFF" />
              <Text style={styles.removeRestrictionBtnText}>Remove Restriction</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Student Devices List */}
        <View style={styles.deviceListSection}>
          <View style={styles.listHeaderRow}>
            <Text style={styles.listTitleText}>Student Devices</Text>
            <Text style={styles.listCountText}>({liveStudents.length} Students)</Text>
          </View>

          {liveStudents.length === 0 ? (
            <View style={styles.emptyDeviceContainer}>
              <VectorIcon name="cellphone-off" size={40} color="#94A3B8" />
              <Text style={styles.emptyDeviceTitle}>No Student Devices</Text>
              <Text style={styles.emptyDeviceSubtitle}>No students are currently registered.</Text>
            </View>
          ) : (
            liveStudents.map((student, index) => {
              const isBlocked = student.deviceStatus === 'blocked';
              const hasPerms = student.accessibilityEnabled && student.overlayEnabled;
              const isLoggedIn = student.isOnline;

              // Clean status badges — no "RESTRICTED" label
              let badgeBgColor = '#DCFCE7';
              let badgeTextColor = '#16A34A';
              let badgeText = 'Active';
              let cellphoneColor = '#16A34A';
              let cellphoneBg = '#DCFCE7';

              if (!student.hasDevice) {
                badgeBgColor = '#F1F5F9';
                badgeTextColor = '#64748B';
                badgeText = 'No Login';
                cellphoneColor = '#94A3B8';
                cellphoneBg = '#F1F5F9';
              } else if (!hasPerms) {
                badgeBgColor = '#FEF3C7';
                badgeTextColor = '#D97706';
                badgeText = 'Setup Needed';
                cellphoneColor = '#D97706';
                cellphoneBg = '#FEF3C7';
              } else if (isBlocked) {
                badgeBgColor = '#FEE2E2';
                badgeTextColor = '#EF4444';
                badgeText = 'Blocked';
                cellphoneColor = '#EF4444';
                cellphoneBg = '#FEE2E2';
              } else if (!isLoggedIn) {
                badgeBgColor = '#F1F5F9';
                badgeTextColor = '#64748B';
                badgeText = 'Offline';
                cellphoneColor = '#94A3B8';
                cellphoneBg = '#F1F5F9';
              }

              return (
                <View key={student.studentId || index} style={styles.studentDeviceRow}>
                  <View style={styles.studentDeviceInfo}>
                    <View style={[styles.studentIconWrapper, { backgroundColor: cellphoneBg }]}>
                      <VectorIcon name="cellphone" size={16} color={cellphoneColor} />
                    </View>
                    <View style={styles.studentTextGroup}>
                      <Text style={styles.studentDeviceName}>{student.name}</Text>
                      <Text style={styles.studentDeviceMeta}>
                        {student.deviceModel || 'Android'} · {student.rollNo || student.email}
                      </Text>
                      <View style={styles.permBadgeRow}>
                        <View style={[styles.permBadge, { backgroundColor: student.accessibilityEnabled ? '#DCFCE7' : '#FEE2E2' }]}>
                          <Text style={[styles.permBadgeText, { color: student.accessibilityEnabled ? '#16A34A' : '#DC2626' }]}>
                            Access {student.accessibilityEnabled ? 'ON' : 'OFF'}
                          </Text>
                        </View>
                        <View style={[styles.permBadge, { backgroundColor: student.overlayEnabled ? '#DCFCE7' : '#FEE2E2' }]}>
                          <Text style={[styles.permBadgeText, { color: student.overlayEnabled ? '#16A34A' : '#DC2626' }]}>
                            Overlay {student.overlayEnabled ? 'ON' : 'OFF'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  <View style={[styles.studentBadge, { backgroundColor: badgeBgColor }]}>
                    <Text style={[styles.studentBadgeText, { color: badgeTextColor }]}>{badgeText}</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
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
  subHeader: {
    paddingHorizontal: 20,
    paddingTop: STATUSBAR_OFFSET,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0,
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
  flatFormContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  statusIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  labelTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E3A8A',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  targetClassRow: {
    flexDirection: 'row',
    gap: 12,
  },
  lockedField: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    height: 40,
    paddingHorizontal: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  lockedBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  appsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  appActionsGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  miniBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  miniBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  appsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginHorizontal: -4,
  },
  appChip: {
    width: '31.3%',
    marginHorizontal: '1%',
    marginVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  appChipBlocked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  appChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    marginLeft: 4,
  },
  appChipTextBlocked: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  scheduleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeInputBox: {
    flex: 1,
  },
  timeInputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
  },
  timeInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    height: 44,
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  controlsGroup: {
    gap: 10,
  },
  applyBtn: {
    backgroundColor: colors.primary,
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...shadows.soft,
  },
  applyBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  secondaryControlsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  pauseBtn: {
    flex: 1,
    backgroundColor: '#FFFBEB',
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  pauseBtnActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#D97706',
  },
  pauseBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D97706',
  },
  pauseBtnTextActive: {
    color: '#FFFFFF',
  },
  resumeBtn: {
    flex: 1,
    backgroundColor: '#F0FDF4',
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  resumeBtnActive: {
    backgroundColor: '#16A34A',
    borderColor: '#15803D',
  },
  resumeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16A34A',
  },
  resumeBtnTextActive: {
    color: '#FFFFFF',
  },
  removeRestrictionBtn: {
    backgroundColor: '#DC2626',
    height: 44,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#B91C1C',
    marginTop: 6,
  },
  removeRestrictionBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  deviceListSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 12,
  },
  listTitleText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  listCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  studentDeviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  studentDeviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  studentIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentTextGroup: {
    flex: 1,
  },
  studentDeviceName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  studentDeviceMeta: {
    fontSize: 10,
    fontWeight: '500',
    color: '#94A3B8',
    marginTop: 1,
  },
  permBadgeRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  permBadge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  permBadgeText: {
    fontSize: 8,
    fontWeight: '700',
  },
  studentBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginLeft: 8,
  },
  studentBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  emptyDeviceContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyDeviceTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginTop: 8,
  },
  emptyDeviceSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
});

export default StaffDevicesTab;
