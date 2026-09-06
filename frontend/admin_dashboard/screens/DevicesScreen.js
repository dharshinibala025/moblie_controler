import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  NativeModules,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import Header from '../components/Header';
import SectionTitle from '../components/SectionTitle';
import DeviceCard from '../components/DeviceCard';
import SelectDropdown from '../components/SelectDropdown';
import StatusBadge from '../components/StatusBadge';
import SearchBar from '../components/SearchBar';
import FilterChipGroup from '../components/FilterChipGroup';
import RestrictionActionModal from '../components/RestrictionActionModal';
import adminService from '../../services/adminService';

import colors from '../styles/colors';
import typography from '../styles/typography';
import { spacing, radius, softShadow } from '../styles/globalStyles';
import { getSectionOptions } from '../config/sectionsConfig';

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

const TIME_REGEX = /^\d{1,2}:\d{2}\s*(AM|PM)$/i;

const parseTo24Hour = (timeStr) => {
  if (!timeStr) return null;
  const clean = timeStr.trim().toUpperCase();
  const match = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  if (hours < 1 || hours > 12) return null;
  if (match[3] === 'PM' && hours < 12) hours += 12;
  if (match[3] === 'AM' && hours === 12) hours = 0;
  return `${hours.toString().padStart(2, '0')}:${match[2]}`;
};

const DevicesScreen = () => {
  const [devices, setDevices] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('All');

  // Filter States
  const [selectedDept] = useState('CSE');
  const [draftYear, setDraftYear] = useState('All');
  const [draftSection, setDraftSection] = useState('All');

  // Schedule
  const [startTime, setStartTime] = useState('09:00 AM');
  const [endTime, setEndTime] = useState('04:00 PM');
  const [restrictionStatus, setRestrictionStatus] = useState('IDLE');
  const [actionLoading, setActionLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({ type: 'success', title: '', message: '' });

  const showRestrictionModal = (type, title, message) => {
    setModalConfig({ type, title, message });
    setModalVisible(true);
  };

  const yearDropdownOptions = useMemo(
    () => [
      { label: 'ALL Year', value: 'All' },
      { label: '1st Year', value: '1st Year' },
      { label: '2nd Year', value: '2nd Year' },
      { label: '3rd Year', value: '3rd Year' },
      { label: '4th Year', value: '4th Year' },
    ],
    [],
  );

  const sectionDropdownOptions = useMemo(() => {
    const sections = getSectionOptions(draftYear);
    const sectionOpts = sections.map((s) => ({ label: `Section ${s}`, value: s }));
    return [{ label: 'ALL Section', value: 'All' }, ...sectionOpts];
  }, [draftYear]);

  const loadDevices = useCallback(async () => {
    const list = await adminService.getDevices();
    setDevices(list || []);
  }, []);

  const loadRules = useCallback(async () => {
    try {
      const rules = await adminService.getRules();
      if (draftYear === 'All' || draftSection === 'All') {
        // For "All", show the active rule or most recent rule
        const classRule = (rules || []).find((r) => r.status === 'active') || (rules || [])[0];
        if (classRule) {
          setStartTime(formatTo12Hour(classRule.scheduleStart));
          setEndTime(formatTo12Hour(classRule.scheduleEnd));
          if (classRule.status === 'active') setRestrictionStatus('ACTIVE');
          else if (classRule.status === 'paused') setRestrictionStatus('PAUSED');
          else setRestrictionStatus('IDLE');
        } else {
          setRestrictionStatus('IDLE');
        }
      } else {
        const yearChar = draftYear.charAt(0);
        const targetClassId = `${selectedDept}-${yearChar}-${draftSection}`;
        const classRule = (rules || []).find((r) => r.targetClassId === targetClassId);
        if (classRule) {
          setStartTime(formatTo12Hour(classRule.scheduleStart));
          setEndTime(formatTo12Hour(classRule.scheduleEnd));
          if (classRule.status === 'active') setRestrictionStatus('ACTIVE');
          else if (classRule.status === 'paused') setRestrictionStatus('PAUSED');
          else setRestrictionStatus('IDLE');
        } else {
          setRestrictionStatus('IDLE');
        }
      }
    } catch (err) {
      console.warn('Failed to load rules for class:', err.message);
    }
  }, [selectedDept, draftYear, draftSection]);

  useEffect(() => {
    loadDevices();
    loadRules();
  }, [selectedDept, draftYear, draftSection, loadDevices, loadRules]);

  const filteredDevices = useMemo(() => {
    const q = searchQuery.toLowerCase();

    return devices.filter((device) => {
      if (device.userRole !== 'student') return false;

      // Filter by classId matching pattern
      const deviceClassId = device.classId || '';
      if (draftYear !== 'All' && draftSection !== 'All') {
        const yearChar = draftYear.charAt(0);
        const targetClassId = `${selectedDept}-${yearChar}-${draftSection}`;
        if (deviceClassId !== targetClassId) return false;
      } else if (draftYear !== 'All') {
        const yearChar = draftYear.charAt(0);
        if (!deviceClassId.startsWith(`${selectedDept}-${yearChar}-`)) return false;
      } else if (draftSection !== 'All') {
        const suffix = `-${draftSection}`;
        if (!deviceClassId.endsWith(suffix)) return false;
      }
      // If both are 'All', show all student devices

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

  const displayDevices = filteredDevices;

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

    const previousBlocked = target.isBlocked;

    setDevices((prev) =>
      prev.map((device) =>
        device.id === deviceId ? { ...device, isBlocked: !device.isBlocked } : device,
      ),
    );

    try {
      if (previousBlocked) {
        await adminService.unblockDevice(deviceId);
      } else {
        await adminService.blockDevice(deviceId);
      }
      await loadDevices();
    } catch (err) {
      setDevices((prev) =>
        prev.map((device) =>
          device.id === deviceId ? { ...device, isBlocked: previousBlocked } : device,
        ),
      );
      Alert.alert('Toggle Failed', 'Failed to update device status: ' + (err.message || 'Please try again.'));
    }
  };

  // Compute target class IDs based on current filter selection
  const computeTargetClassIds = useCallback(() => {
    const yearChars = draftYear === 'All' ? ['1', '2', '3', '4'] : [draftYear.charAt(0)];
    const sections = draftSection === 'All'
      ? getSectionOptions(null).filter((s) => s !== 'All')
      : [draftSection];
    const ids = [];
    yearChars.forEach((yc) => {
      sections.forEach((sec) => {
        ids.push(`${selectedDept}-${yc}-${sec}`);
      });
    });
    return ids;
  }, [selectedDept, draftYear, draftSection]);

  const handleApplyRestriction = async () => {
    if (!TIME_REGEX.test(startTime.trim())) {
      Alert.alert('Invalid Start Time', 'Please enter time in format like "09:00 AM" or "02:30 PM".');
      return;
    }
    if (!TIME_REGEX.test(endTime.trim())) {
      Alert.alert('Invalid End Time', 'Please enter time in format like "04:00 PM" or "10:30 PM".');
      return;
    }
    const parsedStart = parseTo24Hour(startTime);
    const parsedEnd = parseTo24Hour(endTime);
    if (!parsedStart || !parsedEnd) {
      Alert.alert('Invalid Time', 'Please use valid 12-hour format (e.g. "09:00 AM").');
      return;
    }

    const targetClassIds = computeTargetClassIds();

    setActionLoading(true);
    setPendingAction('apply');
    try {
      const policyData = {
        blockedApps: ['com.instagram.android', 'com.whatsapp', 'com.google.android.youtube', 'com.facebook.katana', 'SocialMedia'],
        scheduleStart: parsedStart,
        scheduleEnd: parsedEnd,
        activeDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        targetClassIds,
        status: 'active',
        reason: 'Classroom Policy Restriction',
      };
      const result = await adminService.applyRestrictionPolicyBulk(policyData);

      const applied = result?.applied ?? 0;
      const total = result?.total ?? targetClassIds.length;

      if (applied > 0) {
        setRestrictionStatus('ACTIVE');
      } else {
        setRestrictionStatus('IDLE');
      }

      // Refresh rules + device list once, in parallel (single round-trip latency).
      await Promise.all([loadRules(), loadDevices()]);

      if (applied === total) {
        showRestrictionModal(
          'success',
          'Mobile Restriction Applied',
          `Restriction policy active for ${applied} class(es)!\nSchedule: ${startTime} – ${endTime}`,
        );
      } else {
        showRestrictionModal(
          'warning',
          'Partial Success',
          `Applied to ${applied}/${total} classes.\nSchedule: ${startTime} – ${endTime}`,
        );
      }
    } catch (err) {
      setRestrictionStatus('IDLE');
      showRestrictionModal('error', 'Apply Failed', err.message || 'Failed to apply restriction policy. Please try again.');
    } finally {
      setActionLoading(false);
      setPendingAction(null);
    }
  };

  const handlePauseRestriction = async () => {
    let targetClassIds = computeTargetClassIds();
    if (draftYear === 'All' && draftSection === 'All') {
      targetClassIds = ['ALL', ...targetClassIds];
    }
    // Optimistic UI: instantly show paused
    setRestrictionStatus('PAUSED');
    setActionLoading(true);
    setPendingAction('pause');
    try {
      if (NativeModules.AppScanner && NativeModules.AppScanner.savePolicy) {
        NativeModules.AppScanner.savePolicy(
          'local',
          [],
          '09:00',
          '16:00',
          ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          'Paused by Administrator',
          1,
          'paused',
          false,
        ).catch(() => null);
      }
      await adminService.pauseRestriction(targetClassIds);
      await Promise.all([loadRules(), loadDevices()]);
      showRestrictionModal('success', 'Restriction Paused', 'All blocked apps temporarily unblocked. Devices can access apps.');
    } catch (err) {
      setRestrictionStatus('ACTIVE');
      showRestrictionModal('error', 'Pause Failed', 'Failed to pause restriction: ' + err.message);
    } finally {
      setActionLoading(false);
      setPendingAction(null);
    }
  };

  const handleResumeRestriction = async () => {
    let targetClassIds = computeTargetClassIds();
    if (draftYear === 'All' && draftSection === 'All') {
      targetClassIds = ['ALL', ...targetClassIds];
    }
    // Optimistic UI: instantly show active
    setRestrictionStatus('ACTIVE');
    setActionLoading(true);
    setPendingAction('resume');
    try {
      await adminService.resumeRestriction(targetClassIds);
      await Promise.all([loadRules(), loadDevices()]);
      showRestrictionModal('success', 'Restriction Resumed', 'Mobile restriction is now active. Restricted apps are blocked.');
    } catch (err) {
      setRestrictionStatus('PAUSED');
      showRestrictionModal('error', 'Resume Failed', 'Failed to resume restriction: ' + err.message);
    } finally {
      setActionLoading(false);
      setPendingAction(null);
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
            setActionLoading(true);
            setPendingAction('emergency');
            try {
              if (NativeModules.AppScanner && NativeModules.AppScanner.clearPolicy) {
                await NativeModules.AppScanner.clearPolicy().catch(() => null);
              }
              await adminService.emergencyUnblockAll();
              setRestrictionStatus('IDLE');
              setDevices((prev) => prev.map((d) => ({ ...d, isBlocked: false })));
              await Promise.all([loadRules(), loadDevices()]);
              showRestrictionModal('success', 'Emergency Unblock Executed', 'All mobile restrictions lifted immediately across ALL student devices.');
            } catch (err) {
              showRestrictionModal('error', 'Emergency Unblock Failed', err.message || 'Failed to execute emergency unblock. Please try again.');
            } finally {
              setActionLoading(false);
              setPendingAction(null);
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
            <TouchableOpacity
              style={[styles.applyBtn, actionLoading && styles.applyBtnDisabled]}
              onPress={handleApplyRestriction}
              disabled={actionLoading}
              activeOpacity={0.8}
            >
              {actionLoading && pendingAction === 'apply' ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Icon name="access-time" size={18} color={colors.white} />
              )}
              <Text style={styles.applyBtnText}>
                {actionLoading && pendingAction === 'apply' ? 'Applying…' : 'Set Restriction Timing'}
              </Text>
            </TouchableOpacity>

            <View style={styles.secondaryControlsRow}>
              <TouchableOpacity
                style={[
                  styles.pauseBtn,
                  restrictionStatus === 'ACTIVE' && styles.pauseBtnActive,
                  restrictionStatus !== 'ACTIVE' && styles.pauseBtnDimmed,
                ]}
                onPress={handlePauseRestriction}
                disabled={actionLoading || restrictionStatus === 'IDLE'}
                activeOpacity={0.8}
              >
                {actionLoading && pendingAction === 'pause' ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Icon
                    name="pause"
                    size={16}
                    color={restrictionStatus === 'ACTIVE' ? '#FFFFFF' : '#94A3B8'}
                  />
                )}
                <Text style={[
                  styles.pauseBtnText,
                  restrictionStatus === 'ACTIVE' && styles.pauseBtnTextActive,
                  restrictionStatus !== 'ACTIVE' && styles.pauseBtnTextDimmed,
                ]}>
                  Pause
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.resumeBtn,
                  restrictionStatus === 'PAUSED' && styles.resumeBtnActive,
                  restrictionStatus !== 'PAUSED' && styles.resumeBtnDimmed,
                ]}
                onPress={handleResumeRestriction}
                disabled={actionLoading || restrictionStatus === 'IDLE'}
                activeOpacity={0.8}
              >
                {actionLoading && pendingAction === 'resume' ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Icon
                    name="play-arrow"
                    size={16}
                    color={restrictionStatus === 'PAUSED' ? '#FFFFFF' : '#94A3B8'}
                  />
                )}
                <Text style={[
                  styles.resumeBtnText,
                  restrictionStatus === 'PAUSED' && styles.resumeBtnTextActive,
                  restrictionStatus !== 'PAUSED' && styles.resumeBtnTextDimmed,
                ]}>
                  Resume
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.emergencyBtn, actionLoading && styles.applyBtnDisabled]}
              onPress={handleEmergencyUnblock}
              disabled={actionLoading}
              activeOpacity={0.8}
            >
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

      <RestrictionActionModal
        visible={modalVisible}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        onDismiss={() => setModalVisible(false)}
      />
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
  applyBtnDisabled: {
    opacity: 0.6,
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
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    gap: 4,
  },
  pauseBtnActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#D97706',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  pauseBtnDimmed: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    opacity: 0.5,
  },
  pauseBtnText: {
    ...typography.button,
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
  },
  pauseBtnTextActive: {
    color: '#FFFFFF',
  },
  pauseBtnTextDimmed: {
    color: '#CBD5E1',
  },
  resumeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    gap: 4,
  },
  resumeBtnActive: {
    backgroundColor: '#16A34A',
    borderColor: '#15803D',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  resumeBtnDimmed: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    opacity: 0.5,
  },
  resumeBtnText: {
    ...typography.button,
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
  },
  resumeBtnTextActive: {
    color: '#FFFFFF',
  },
  resumeBtnTextDimmed: {
    color: '#CBD5E1',
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
  statusIndicatorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.round,
    gap: spacing.xs,
    borderWidth: 1,
  },
  statusActive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  statusPaused: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  statusIdle: {
    backgroundColor: '#F1F5F9',
    borderColor: '#94A3B8',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: '#DC2626',
  },
  dotPaused: {
    backgroundColor: '#F59E0B',
  },
  dotIdle: {
    backgroundColor: '#94A3B8',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  textActive: {
    color: '#DC2626',
  },
  textPaused: {
    color: '#D97706',
  },
  textIdle: {
    color: '#64748B',
  },
});

export default DevicesScreen;
