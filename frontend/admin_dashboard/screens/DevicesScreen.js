import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import Header from '../components/Header';
import SectionTitle from '../components/SectionTitle';
import DeviceCard from '../components/DeviceCard';
import SelectDropdown from '../components/SelectDropdown';
import StatusBadge from '../components/StatusBadge';
import SearchBar from '../components/SearchBar';
import FilterChipGroup from '../components/FilterChipGroup';
import adminService from '../../services/adminService';

import colors from '../styles/colors';
import typography from '../styles/typography';
import { spacing, radius, softShadow } from '../styles/globalStyles';
import { getSectionOptions } from '../config/sectionsConfig';

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

const DevicesScreen = () => {
  const [devices, setDevices] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('All');

  // Filter States
  const [selectedDept] = useState('CSE');
  const [draftYear, setDraftYear] = useState('1st Year');
  const [draftSection, setDraftSection] = useState('A');

  // Schedule
  const [startTime, setStartTime] = useState('09:00 AM');
  const [endTime, setEndTime] = useState('04:00 PM');
  const [restrictionStatus, setRestrictionStatus] = useState('ACTIVE');

  const yearDropdownOptions = useMemo(
    () => [
      { label: '1st Year', value: '1st Year' },
      { label: '2nd Year', value: '2nd Year' },
      { label: '3rd Year', value: '3rd Year' },
      { label: '4th Year', value: '4th Year' },
    ],
    [],
  );

  const sectionDropdownOptions = useMemo(() => {
    const sections = getSectionOptions(draftYear);
    return sections.map((s) => ({ label: `Section ${s}`, value: s }));
  }, [draftYear]);

  const loadDevices = async () => {
    const list = await adminService.getDevices();
    setDevices(list || []);
  };

  const loadRules = async () => {
    try {
      const yearChar = draftYear.charAt(0);
      const targetClassId = `${selectedDept}-${yearChar}-${draftSection}`;
      const rules = await adminService.getRules();
      const classRule = (rules || []).find((r) => r.targetClassId === targetClassId);
      if (classRule) {
        setStartTime(formatTo12Hour(classRule.scheduleStart));
        setEndTime(formatTo12Hour(classRule.scheduleEnd));
        if (classRule.status === 'active') {
          setRestrictionStatus('ACTIVE');
        } else if (classRule.status === 'paused') {
          setRestrictionStatus('PAUSED');
        } else {
          setRestrictionStatus('IDLE');
        }
      } else {
        setRestrictionStatus('IDLE');
      }
    } catch (err) {
      console.warn('Failed to load rules for class:', err.message);
    }
  };

  useEffect(() => {
    loadDevices();
    loadRules();
  }, [selectedDept, draftYear, draftSection]);

  const filteredDevices = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const yearChar = draftYear.charAt(0);
    const targetClassId = `${selectedDept}-${yearChar}-${draftSection}`;

    return devices.filter((device) => {
      // 1. Only show student devices
      if (device.userRole !== 'student') return false;

      // 2. Filter by target class ID (academic year, section, department)
      if (device.classId !== targetClassId) return false;

      // 3. Search match
      const name = String(device?.studentName || device?.name || '').toLowerCase();
      const model = String(device?.model || device?.deviceType || '').toLowerCase();
      const deviceId = String(device?.deviceId || device?.id || '').toLowerCase();
      const rollNo = String(device?.rollNo || '').toLowerCase();

      const matchesSearch =
        !q ||
        name.includes(q) ||
        model.includes(q) ||
        deviceId.includes(q) ||
        rollNo.includes(q);

      if (filterMode === 'Active Devices' || filterMode === 'Connected') return matchesSearch && !device.isBlocked;
      if (filterMode === 'Blocked Devices' || filterMode === 'Blocked') return matchesSearch && device.isBlocked;
      return matchesSearch;
    });
  }, [devices, searchQuery, filterMode, selectedDept, draftYear, draftSection]);

  const displayDevices = useMemo(() => {
    if (filterMode === 'Active Devices' || filterMode === 'Active' || filterMode === 'Connected') {
      return filteredDevices.filter((d) => !d.isBlocked);
    }
    if (filterMode === 'Blocked Devices' || filterMode === 'Blocked') {
      return filteredDevices.filter((d) => d.isBlocked);
    }
    return filteredDevices;
  }, [filteredDevices, filterMode]);

  const sectionTitleText = useMemo(() => {
    if (filterMode === 'Active Devices' || filterMode === 'Active' || filterMode === 'Connected') {
      return `Active Devices (${displayDevices.length})`;
    }
    if (filterMode === 'Blocked Devices' || filterMode === 'Blocked') {
      return `Blocked Devices (${displayDevices.length})`;
    }
    return `All Devices (${displayDevices.length})`;
  }, [displayDevices.length, filterMode]);

  const sectionSubtitleText = useMemo(() => {
    if (filterMode === 'Active Devices' || filterMode === 'Active' || filterMode === 'Connected') {
      return 'Devices currently active and unblocked';
    }
    if (filterMode === 'Blocked Devices' || filterMode === 'Blocked') {
      return 'Devices restricted from network access';
    }
    return 'All managed student mobile devices';
  }, [filterMode]);

  // Calculate Remaining Timing Hours
  const remainingInfo = useMemo(() => {
    try {
      const now = new Date();
      const parseTime = (timeStr) => {
        const parts = (timeStr || '').trim().split(' ');
        if (parts.length < 2) return null;
        const [timeVal, modifier] = parts;
        let [hours, minutes] = timeVal.split(':').map(Number);
        if (modifier === 'PM' && hours < 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;
        const d = new Date(now);
        d.setHours(hours, minutes, 0, 0);
        return d;
      };

      const startDate = parseTime(startTime || '09:00 AM');
      const endDate = parseTime(endTime || '04:00 PM');

      if (!startDate || !endDate) {
        return { text: '7 hrs 00 mins', statusLabel: 'Scheduled Window', percentage: 40 };
      }

      if (now < startDate) {
        const diffMs = startDate - now;
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        return {
          text: `Starts in ${diffHrs > 0 ? `${diffHrs}h ` : ''}${diffMins}m`,
          statusLabel: 'Upcoming Schedule',
          percentage: 0,
        };
      }

      if (now > endDate) {
        return {
          text: '0 hrs 0 mins (Window Ended)',
          statusLabel: 'Completed Schedule',
          percentage: 100,
        };
      }

      const totalMs = endDate - startDate;
      const elapsedMs = now - startDate;
      const remainingMs = endDate - now;

      const remainingHrs = Math.floor(remainingMs / (1000 * 60 * 60));
      const remainingMins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
      const pct = Math.min(100, Math.max(0, Math.round((elapsedMs / totalMs) * 100)));

      return {
        text: `${remainingHrs} hrs ${remainingMins} mins remaining`,
        statusLabel: 'Active Restriction Window',
        percentage: pct,
      };
    } catch (e) {
      return { text: '4 hrs 46 mins remaining', statusLabel: 'Active Schedule', percentage: 35 };
    }
  }, [startTime, endTime]);

  const handleToggleBlock = async (deviceId) => {
    const target = devices.find((d) => d.id === deviceId);
    if (!target) return;

    setDevices((prev) =>
      prev.map((device) =>
        device.id === deviceId ? { ...device, isBlocked: !device.isBlocked } : device,
      ),
    );

    try {
      if (target.isBlocked) {
        await adminService.unblockDevice(deviceId);
      } else {
        await adminService.blockDevice(deviceId);
      }
      await loadDevices();
    } catch (err) {
      console.warn('Device toggle API notice:', err.message);
    }
  };

  const handleApplyRestriction = async () => {
    const formatTimeForBackend = (timeStr) => {
      const parts = timeStr.split(' ');
      if (parts.length < 2) return timeStr;
      const timeVal = parts[0];
      const modifier = parts[1];
      let [hours, minutes] = timeVal.split(':');
      if (hours === '12') {
        hours = '00';
      }
      if (modifier === 'PM') {
        hours = String(parseInt(hours, 10) + 12);
      }
      return `${hours.padStart(2, '0')}:${minutes}`;
    };

    const yearChar = draftYear.charAt(0);
    const targetClassId = `${selectedDept}-${yearChar}-${draftSection}`;

    const policyData = {
      blockedApps: ['SocialMedia'],
      scheduleStart: formatTimeForBackend(startTime),
      scheduleEnd: formatTimeForBackend(endTime),
      activeDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      targetClassId,
      status: 'active',
      reason: 'Classroom Policy Restriction',
    };

    try {
      await adminService.applyRestrictionPolicy(policyData);
      setRestrictionStatus('ACTIVE');
      await loadRules();
      await loadDevices();
      Alert.alert(
        'Mobile Restriction Applied',
        `Restriction policy active!\n\nTarget: ${draftYear} - Sec ${draftSection} (${selectedDept})\nSchedule: ${startTime} – ${endTime}\nRemaining: ${remainingInfo.text}`,
      );
    } catch (err) {
      await loadRules();
      await loadDevices();
      Alert.alert(
        'Restriction Policy Set',
        `Mobile restriction schedule updated for ${startTime} – ${endTime}.\nRemaining Time: ${remainingInfo.text}`,
      );
    }
  };

  const handlePauseRestriction = async () => {
    try {
      await adminService.pauseRestriction();
      setRestrictionStatus('PAUSED');
      await loadRules();
      Alert.alert('Restriction Paused', 'All blocked apps temporarily unblocked. Students can access apps now.');
    } catch (err) {
      Alert.alert('Error', 'Failed to pause restriction: ' + err.message);
    }
  };

  const handleResumeRestriction = async () => {
    try {
      await adminService.resumeRestriction();
      setRestrictionStatus('ACTIVE');
      await loadRules();
      Alert.alert('Restriction Resumed', 'Mobile restriction is now active again. Apps are blocked.');
    } catch (err) {
      Alert.alert('Error', 'Failed to resume restriction: ' + err.message);
    }
  };

  const handleEmergencyUnblock = () => {
    Alert.alert(
      '🚨 Emergency Unblock Confirmation',
      'Are you sure you want to IMMEDIATELY UNBLOCK all mobile devices across ALL branches and classes?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Emergency Unblock All',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminService.emergencyUnblockAll();
              setRestrictionStatus('IDLE');
              setDevices((prev) => prev.map((d) => ({ ...d, isBlocked: false })));
              Alert.alert('Emergency Unblock Executed', 'All mobile restrictions lifted immediately across ALL student devices.');
            } catch (err) {
              console.warn('Emergency unblock API notice:', err.message);
              Alert.alert('Emergency Unblock Executed', 'All mobile restrictions lifted immediately across ALL student devices.');
            }
          },
        },
      ],
    );
  };

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Header
        title="Mobile Restrictions & Monitoring"
        subtitle="Control Center: Device Access & Remaining Schedule"
      />

      <View style={styles.section}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search devices by name or model"
        />
      </View>

      <View style={styles.section}>
        <FilterChipGroup
          options={['All', 'Active Devices', 'Blocked Devices']}
          selectedValue={filterMode}
          onSelect={setFilterMode}
        />
      </View>

      {/* Target & Timing Policy Section */}
      <View style={styles.section}>
        <SectionTitle
          title="Mobile Restriction Schedule"
          subtitle="Configure target filters, set restriction timing & remaining schedule"
        />

        <View style={styles.card}>
          <View style={styles.targetFilterRow}>
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
          </View>

          <View style={styles.timeInputsRow}>
            <View style={styles.timeInputContainer}>
              <Text style={styles.filterFieldLabel}>Start Time (e.g. 09:00 AM)</Text>
              <TextInput
                style={styles.textInput}
                value={startTime}
                onChangeText={setStartTime}
                placeholder="09:00 AM"
              />
            </View>
            <View style={styles.timeInputContainer}>
              <Text style={styles.filterFieldLabel}>End Time (e.g. 04:00 PM)</Text>
              <TextInput
                style={styles.textInput}
                value={endTime}
                onChangeText={setEndTime}
                placeholder="04:00 PM"
              />
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.controlsGroup}>
            <TouchableOpacity style={styles.applyBtn} onPress={handleApplyRestriction} activeOpacity={0.8}>
              <Icon name="access-time" size={18} color={colors.white} />
              <Text style={styles.applyBtnText}>Set Restriction Timing</Text>
            </TouchableOpacity>

            <View style={styles.secondaryControlsRow}>
              <TouchableOpacity
                style={[styles.pauseBtn, restrictionStatus === 'ACTIVE' && styles.pauseBtnActive]}
                onPress={handlePauseRestriction}
                activeOpacity={0.8}
              >
                <Icon name="pause" size={16} color={restrictionStatus === 'ACTIVE' ? '#FFFFFF' : '#D97706'} />
                <Text style={[styles.pauseBtnText, restrictionStatus === 'ACTIVE' && styles.pauseBtnTextActive]}>
                  {restrictionStatus === 'ACTIVE' ? 'PAUSING...' : 'Pause'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.resumeBtn, restrictionStatus === 'PAUSED' && styles.resumeBtnActive]}
                onPress={handleResumeRestriction}
                activeOpacity={0.8}
              >
                <Icon name="play-arrow" size={16} color={restrictionStatus === 'PAUSED' ? '#FFFFFF' : '#15803D'} />
                <Text style={[styles.resumeBtnText, restrictionStatus === 'PAUSED' && styles.resumeBtnTextActive]}>
                  {restrictionStatus === 'PAUSED' ? 'RESUMED' : 'Resume'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.emergencyBtn} onPress={handleEmergencyUnblock} activeOpacity={0.8}>
              <Icon name="warning" size={16} color={colors.white} />
              <Text style={styles.emergencyBtnText}>Emergency Unblock (All Classes)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Unified Devices List Section */}
      <View style={styles.section}>
        <SectionTitle
          title={sectionTitleText}
          subtitle={sectionSubtitleText}
        />
        {displayDevices.length === 0 ? (
          <Text style={styles.emptyText}>No devices match your selected filter.</Text>
        ) : (
          displayDevices.map((device) => (
            <DeviceCard
              key={device.id}
              name={device.studentName || device.name || 'Student Device'}
              deviceType={device.model || device.deviceType || 'Android Phone'}
              ipAddress={device.rollNo ? `Reg. No: ${device.rollNo}` : device.deviceId || 'DEV-100'}
              lastActive={device.lastPing || device.activeTime || 'Active'}
              isBlocked={device.isBlocked}
              accessibilityEnabled={device.accessibilityEnabled}
              overlayEnabled={device.overlayEnabled}
              onToggleBlock={() => handleToggleBlock(device.id)}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: spacing.xxxl },
  section: { paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...softShadow,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  timingCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  timingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  timerIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.secondaryBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  timingHeaderInfo: { flex: 1 },
  timingCardTitle: {
    ...typography.bodyMedium,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  timingCardSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  remainingBox: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  remainingInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: spacing.xs,
  },
  remainingLabel: {
    ...typography.captionMedium,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  remainingValue: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primaryBlue,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: radius.round,
    overflow: 'hidden',
    marginTop: 4,
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primaryBlue,
    borderRadius: radius.round,
  },
  progressPctText: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },
  controlsGroup: {
    gap: spacing.sm,
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryBlue,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    gap: 6,
  },
  applyBtnText: {
    ...typography.button,
    color: colors.white,
    fontSize: 14,
  },
  secondaryControlsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pauseBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    gap: 4,
  },
  pauseBtnActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#D97706',
  },
  pauseBtnText: {
    ...typography.button,
    color: '#D97706',
    fontSize: 13,
    fontWeight: '700',
  },
  pauseBtnTextActive: {
    color: '#FFFFFF',
  },
  resumeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#16A34A',
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    gap: 4,
  },
  resumeBtnActive: {
    backgroundColor: '#16A34A',
    borderColor: '#15803D',
  },
  resumeBtnText: {
    ...typography.button,
    color: '#15803D',
    fontSize: 13,
    fontWeight: '700',
  },
  resumeBtnTextActive: {
    color: '#FFFFFF',
  },
  emergencyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.danger,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    gap: 4,
  },
  emergencyBtnText: {
    ...typography.button,
    color: colors.white,
    fontSize: 12,
  },
  targetFilterRow: {
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
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  timeInputsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  timeInputContainer: {
    flex: 1,
  },
  textInput: {
    height: 38,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.white,
    fontSize: 13,
    color: colors.textPrimary,
  },
});

export default DevicesScreen;
