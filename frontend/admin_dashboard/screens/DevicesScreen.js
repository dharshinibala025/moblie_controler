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
import SelectDropdown from '../components/SelectDropdown';
import StatusBadge from '../components/StatusBadge';
import SearchBar from '../components/SearchBar';

import colors from '../styles/colors';
import typography from '../styles/typography';
import { spacing, radius, softShadow } from '../styles/globalStyles';
import { getSectionOptions } from '../config/sectionsConfig';

const SUPPORTED_APPS = [
  'Instagram',
  'WhatsApp',
  'Facebook',
  'Snapchat',
  'Telegram',
  'Discord',
  'Twitter (X)',
  'YouTube',
  'Netflix',
  'Prime Video',
  'BGMI',
  'Free Fire',
  'PUBG',
];

const INITIAL_DEVICES_MONITORING = [
  {
    id: 'd1',
    studentName: 'Aarav Sharma',
    registerNumber: '2024CSE024',
    department: 'CSE',
    year: '1st Year',
    section: 'A',
    isBlocked: false,
    lastSyncTime: 'Just now',
    isOnline: true,
  },
  {
    id: 'd2',
    studentName: 'Meera Krishnan',
    registerNumber: '2024CSE007',
    department: 'CSE',
    year: '1st Year',
    section: 'B',
    isBlocked: false,
    lastSyncTime: '2m ago',
    isOnline: true,
  },
  {
    id: 'd3',
    studentName: 'Rohan Verma',
    registerNumber: '2023ECE011',
    department: 'ECE',
    year: '2nd Year',
    section: 'A',
    isBlocked: true,
    lastSyncTime: '5m ago',
    isOnline: true,
  },
  {
    id: 'd4',
    studentName: 'Sneha Pillai',
    registerNumber: '2023ECE018',
    department: 'ECE',
    year: '2nd Year',
    section: 'C',
    isBlocked: false,
    lastSyncTime: '12m ago',
    isOnline: false,
  },
  {
    id: 'd5',
    studentName: 'Karthik Jayan',
    registerNumber: '2022MECH029',
    department: 'MECH',
    year: '3rd Year',
    section: 'B',
    isBlocked: false,
    lastSyncTime: '1h ago',
    isOnline: false,
  },
  {
    id: 'd6',
    studentName: 'Divya Menon',
    registerNumber: '2022MECH005',
    department: 'MECH',
    year: '3rd Year',
    section: 'D',
    isBlocked: true,
    lastSyncTime: '3m ago',
    isOnline: true,
  },
];

const DevicesScreen = () => {
  // Mobile Restriction State
  const [selectedDept] = useState('CSE');
  const [selectedYear, setSelectedYear] = useState('1st Year');
  const [selectedSection, setSelectedSection] = useState('A');
  const [draftYear, setDraftYear] = useState('1st Year');
  const [draftSection, setDraftSection] = useState('A');
  // Selected apps map
  const [selectedApps, setSelectedApps] = useState(['Instagram', 'WhatsApp', 'Snapchat', 'BGMI', 'PUBG']);

  // Schedule
  const [startTime, setStartTime] = useState('09:00 AM');
  const [endTime, setEndTime] = useState('04:00 PM');

  // Restriction Status State
  const [restrictionStatus, setRestrictionStatus] = useState('IDLE'); // 'IDLE' | 'ACTIVE' | 'PAUSED'

  // Live Monitoring State
  const [monitoringDevices, setMonitoringDevices] = useState(INITIAL_DEVICES_MONITORING);
  const [searchQuery, setSearchQuery] = useState('');

  const yearDropdownOptions = useMemo(
    () => [
      { label: 'I Year', value: '1st Year' },
      { label: 'II Year', value: '2nd Year' },
      { label: 'III Year', value: '3rd Year' },
      { label: 'IV Year', value: '4th Year' },
    ],
    [],
  );

  const sectionDropdownOptions = useMemo(() => {
    const sections = getSectionOptions(draftYear);
    return sections.map((s) => ({ label: s, value: s }));
  }, [draftYear]);

  useEffect(() => {
    if (draftSection !== 'All' && !sectionDropdownOptions.some((o) => o.value === draftSection)) {
      setDraftSection(sectionDropdownOptions[0]?.value || 'A');
    }
  }, [sectionDropdownOptions, draftSection]);

  const handleApplyTarget = useCallback(() => {
    setSelectedYear(draftYear);
    setSelectedSection(draftSection);
  }, [draftYear, draftSection]);

  const handleClearTarget = useCallback(() => {
    setDraftYear('1st Year');
    setDraftSection('A');
    setSelectedYear('1st Year');
    setSelectedSection('A');
  }, []);

  // Toggle Single App
  const handleToggleApp = (appName) => {
    setSelectedApps((prev) =>
      prev.includes(appName) ? prev.filter((a) => a !== appName) : [...prev, appName],
    );
  };

  // Select All Apps
  const handleSelectAllApps = () => {
    setSelectedApps([...SUPPORTED_APPS]);
  };

  // Clear App Selection
  const handleClearSelection = () => {
    setSelectedApps([]);
  };

  // Restriction Action Handlers
  const handleApplyRestriction = () => {
    if (selectedApps.length === 0) {
      Alert.alert('No Apps Selected', 'Please select at least one app to block.');
      return;
    }
    setRestrictionStatus('ACTIVE');
    const targetLabel = `${selectedYear} - Section ${selectedSection}`;
    Alert.alert(
      'Restriction Applied',
      `Restriction successfully applied!\n\nTarget: ${targetLabel} (${selectedDept})\nBlocked Apps: ${selectedApps.length} Apps Selected\nSchedule: ${startTime} – ${endTime}`,
    );
  };

  const handlePauseRestriction = () => {
    setRestrictionStatus('PAUSED');
    Alert.alert('Restriction Paused', 'Mobile restriction policy has been temporarily paused.');
  };

  const handleResumeRestriction = () => {
    setRestrictionStatus('ACTIVE');
    Alert.alert('Restriction Resumed', 'Mobile restriction policy is now active.');
  };

  const handleRemoveRestriction = () => {
    setRestrictionStatus('IDLE');
    Alert.alert('Restriction Removed', 'All restriction policies have been removed.');
  };

  const handleEmergencyUnblock = () => {
    Alert.alert(
      '🚨 Emergency Unblock Confirmation',
      'Are you sure you want to IMMEDIATELY UNBLOCK all mobile devices across the department?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Emergency Unblock',
          style: 'destructive',
          onPress: () => {
            setRestrictionStatus('IDLE');
            setMonitoringDevices((prev) =>
              prev.map((d) => ({ ...d, isBlocked: false })),
            );
            Alert.alert(
              'Emergency Unblock Executed',
              'All mobile restrictions lifted immediately across all devices.',
            );
          },
        },
      ],
    );
  };

  const filteredMonitoringDevices = useMemo(() => {
    return monitoringDevices.filter((dev) => {
      const q = searchQuery.toLowerCase();
      return (
        dev.studentName.toLowerCase().includes(q) ||
        dev.registerNumber.toLowerCase().includes(q) ||
        dev.department.toLowerCase().includes(q)
      );
    });
  }, [monitoringDevices, searchQuery]);

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Header
        title="Mobile Restrictions & Monitoring"
        subtitle="HOD Control Center: Block Apps & Live Device Sync"
      />

      {/* ================================================================= */}
      {/* 3. MOBILE RESTRICTION MANAGEMENT PANEL */}
      {/* ================================================================= */}
      <View style={styles.section}>
        <SectionTitle
          title="Mobile Restriction Policy"
          subtitle="Configure target filters, block app list & time schedule"
        />

        <View style={styles.card}>
          {/* Target Filters — Dropdown-based */}
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

            <View style={styles.filterActions}>
              <TouchableOpacity style={styles.filterApplyBtn} onPress={handleApplyTarget} activeOpacity={0.8}>
                <Icon name="check" size={14} color={colors.white} />
                <Text style={styles.filterApplyBtnText}>Apply</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.clearBtn} onPress={handleClearTarget} activeOpacity={0.8}>
                <Icon name="clear" size={14} color={colors.textSecondary} />
                <Text style={styles.clearBtnText}>Clear</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Supported Apps Grid */}
          <View style={styles.appsHeaderRow}>
            <Text style={styles.labelTitle}>1. APPS TO BLOCK ({selectedApps.length})</Text>
            <View style={styles.appActionsGroup}>
              <TouchableOpacity style={styles.miniBtn} onPress={handleSelectAllApps}>
                <Text style={styles.miniBtnText}>Select All</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.miniBtn} onPress={handleClearSelection}>
                <Text style={styles.miniBtnText}>Clear</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.appsGrid}>
            {SUPPORTED_APPS.map((app) => {
              const isBlocked = selectedApps.includes(app);
              return (
                <TouchableOpacity
                  key={app}
                  style={[styles.appChip, isBlocked && styles.appChipBlocked]}
                  onPress={() => handleToggleApp(app)}
                  activeOpacity={0.8}
                >
                  <Icon
                    name={isBlocked ? 'check-box' : 'check-box-outline-blank'}
                    size={16}
                    color={isBlocked ? colors.white : colors.textMuted}
                  />
                  <Text style={[styles.appChipText, isBlocked && styles.appChipTextBlocked]}>
                    {app}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.divider} />

          {/* Restriction Schedule */}
          <Text style={styles.labelTitle}>2. RESTRICTION SCHEDULE</Text>

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
              <Icon name="gavel" size={18} color={colors.white} />
              <Text style={styles.applyBtnText}>Apply Restriction</Text>
            </TouchableOpacity>

            <View style={styles.secondaryControlsRow}>
              {restrictionStatus === 'ACTIVE' ? (
                <TouchableOpacity style={styles.pauseBtn} onPress={handlePauseRestriction}>
                  <Icon name="pause-circle-filled" size={16} color={colors.warning} />
                  <Text style={styles.pauseBtnText}>Pause</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.resumeBtn} onPress={handleResumeRestriction}>
                  <Icon name="play-circle-filled" size={16} color={colors.success} />
                  <Text style={styles.resumeBtnText}>Resume</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.removeBtn} onPress={handleRemoveRestriction}>
                <Icon name="remove-circle-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.removeBtnText}>Remove</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.emergencyBtn} onPress={handleEmergencyUnblock}>
              <Icon name="warning" size={18} color={colors.white} />
              <Text style={styles.emergencyBtnText}>Emergency Unblock All</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ================================================================= */}
      {/* 4. LIVE MONITORING SECTION */}
      {/* ================================================================= */}
      <View style={styles.section}>
        <SectionTitle
          title={`Live Device Monitoring (${filteredMonitoringDevices.length})`}
          subtitle="Real-time device sync status, online state & restriction status"
        />

        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search live student devices"
        />

        <View style={{ marginTop: spacing.md }}>
          {filteredMonitoringDevices.map((dev) => (
            <View key={dev.id} style={styles.deviceCard}>
              <View style={styles.deviceCardHeader}>
                <View style={styles.leftStudentInfo}>
                  <View style={styles.avatarMini}>
                    <Text style={styles.avatarMiniText}>
                      {dev.studentName.slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.studentName}>{dev.studentName}</Text>
                    <Text style={styles.studentMeta}>
                      Reg: {dev.registerNumber} • {dev.department}
                    </Text>
                  </View>
                </View>

                <View style={styles.onlineBadgeGroup}>
                  <View
                    style={[
                      styles.onlineDot,
                      { backgroundColor: dev.isOnline ? colors.success : colors.textMuted },
                    ]}
                  />
                  <Text style={styles.onlineText}>{dev.isOnline ? 'Online' : 'Offline'}</Text>
                </View>
              </View>

              <View style={styles.deviceDivider} />

              <View style={styles.deviceCardBody}>
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>CLASS & SECTION</Text>
                  <Text style={styles.metaVal}>
                    {dev.year} - Sec {dev.section}
                  </Text>
                </View>

                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>LAST SYNC TIME</Text>
                  <Text style={styles.metaVal}>{dev.lastSyncTime}</Text>
                </View>

                <View style={styles.metaColRight}>
                  <StatusBadge
                    label={dev.isBlocked ? 'Blocked' : 'Active'}
                    variant={dev.isBlocked ? 'danger' : 'success'}
                  />
                </View>
              </View>

              {/* Monitor-only info footer */}
              <View style={styles.monitorNote}>
                <Icon name="visibility" size={12} color={colors.textMuted} />
                <Text style={styles.monitorNoteText}>View-only — Use Mobile Restriction Policy above to block</Text>
              </View>
            </View>
          ))}
        </View>
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
  labelTitle: {
    ...typography.captionMedium,
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  spacer: { height: spacing.md },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  targetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  targetChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  targetChipActive: {
    backgroundColor: colors.primaryBlue,
    borderColor: colors.primaryBlue,
  },
  targetText: {
    ...typography.captionMedium,
    color: colors.textSecondary,
    fontSize: 12,
  },
  targetTextActive: {
    color: colors.white,
  },
  appsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appActionsGroup: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  miniBtn: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  miniBtnText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.primaryBlue,
    fontWeight: '600',
  },
  appsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  appChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    gap: 4,
  },
  appChipBlocked: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
  appChipText: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textPrimary,
  },
  appChipTextBlocked: {
    color: colors.white,
    fontWeight: '700',
  },
  scheduleRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  timeInputBox: {
    flex: 1,
  },
  timeInputLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: 4,
  },
  timeInput: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '600',
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
    backgroundColor: colors.warningSoft,
    borderWidth: 1,
    borderColor: colors.warning,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    gap: 4,
  },
  pauseBtnText: {
    ...typography.button,
    color: colors.warning,
    fontSize: 12,
  },
  resumeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.successSoft,
    borderWidth: 1,
    borderColor: colors.success,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    gap: 4,
  },
  resumeBtnText: {
    ...typography.button,
    color: colors.success,
    fontSize: 12,
  },
  removeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    gap: 4,
  },
  removeBtnText: {
    ...typography.button,
    color: colors.textSecondary,
    fontSize: 12,
  },
  emergencyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.danger,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    gap: 6,
  },
  emergencyBtnText: {
    ...typography.button,
    color: colors.white,
    fontSize: 13,
  },

  /* Live Monitoring Card Styles */
  deviceCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...softShadow,
  },
  deviceCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftStudentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatarMini: {
    width: 36,
    height: 36,
    borderRadius: radius.round,
    backgroundColor: colors.secondaryBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarMiniText: {
    ...typography.captionMedium,
    color: colors.primaryBlue,
    fontWeight: '700',
  },
  studentName: {
    ...typography.bodyMedium,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  studentMeta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  onlineBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.white,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.round,
    borderWidth: 1,
    borderColor: colors.border,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  onlineText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  deviceDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  deviceCardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaCol: {
    flex: 1,
  },
  metaColRight: {
    alignItems: 'flex-end',
  },
  metaLabel: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
  },
  metaVal: {
    ...typography.captionMedium,
    fontSize: 12,
    color: colors.textPrimary,
    marginTop: 1,
  },
  toggleDeviceBtn: {
    marginTop: spacing.sm,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  blockDevBtn: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
  },
  unblockDevBtn: {
    backgroundColor: colors.successSoft,
    borderColor: colors.success,
  },
  toggleDeviceText: {
    ...typography.captionMedium,
    fontSize: 11,
    fontWeight: '700',
  },
  blockDevText: { color: colors.danger },
  unblockDevText: { color: colors.success },

  /* Monitor-only note */
  monitorNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  monitorNoteText: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textMuted,
    fontStyle: 'italic',
    flex: 1,
  },

  /* Dropdown filter styles */
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
    minWidth: 120,
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
  filterApplyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    backgroundColor: colors.primaryBlue,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    gap: 4,
  },
  filterApplyBtnText: {
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
});

export default DevicesScreen;
