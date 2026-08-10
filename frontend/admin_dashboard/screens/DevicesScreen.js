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
import adminService, { MOCK_DEVICES } from '../../services/adminService';

import colors from '../styles/colors';
import typography from '../styles/typography';
import { spacing, radius, softShadow } from '../styles/globalStyles';
import { getSectionOptions } from '../config/sectionsConfig';

const SUPPORTED_APPS = [
  'Instagram',
  'WhatsApp',
  'Telegram',
  'Snapchat',
  'Twitter (X)',
  'Free Fire',
  'Facebook',
  'YouTube',
  'PUBG',
  'BGMI',
  'Discord',
  'Games',
  'Threads',
  'Hotstar',
  'JioCinema',
  'Netflix',
  'Net Mirror',
  'Sun NXT',
  'Prime Video',
  'Airtel Xstream',
  'Zee5',
  'Google Play Store',
];

const APP_PACKAGE_MAPPING = {
  'Instagram': 'com.instagram.android',
  'WhatsApp': 'com.whatsapp',
  'Telegram': 'org.telegram.messenger',
  'Snapchat': 'com.snapchat.android',
  'Twitter (X)': 'com.twitter.android',
  'Free Fire': 'com.dts.freefireth',
  'Facebook': 'com.facebook.katana',
  'YouTube': 'com.google.android.youtube',
  'PUBG': 'com.tencent.ig',
  'BGMI': 'com.pubg.imobile',
  'Discord': 'com.discord',
  'Games': 'Games', // Handled by backend dynamically to resolve all student scanned games
  'Threads': 'com.instagram.barcelona',
  'Hotstar': 'in.startv.hotstar',
  'JioCinema': 'com.jio.media.ondemand',
  'Netflix': 'com.netflix.mediaclient',
  'Net Mirror': 'com.netmirror',
  'Sun NXT': 'com.sun.nxt',
  'Prime Video': 'com.amazon.avod.thirdpartyclient',
  'Airtel Xstream': 'com.airtel.tv',
  'Zee5': 'com.graymatrix.did',
  'Google Play Store': 'com.android.vending',
};

const DevicesScreen = () => {
  const [devices, setDevices] = useState(MOCK_DEVICES);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('All');

  // Filter States
  const [selectedDept] = useState('CSE');
  const [draftYear, setDraftYear] = useState('1st Year');
  const [draftSection, setDraftSection] = useState('A');
  const [selectedApps, setSelectedApps] = useState([...SUPPORTED_APPS]);

  // Schedule
  const [startTime, setStartTime] = useState('09:00 AM');
  const [endTime, setEndTime] = useState('04:00 PM');
  const [restrictionStatus, setRestrictionStatus] = useState('IDLE');

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

  useEffect(() => {
    loadDevices();
  }, []);

  const filteredDevices = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return devices.filter((device) => {
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

      if (filterMode === 'Connected') return matchesSearch && !device.isBlocked;
      if (filterMode === 'Blocked') return matchesSearch && device.isBlocked;
      return matchesSearch;
    });
  }, [devices, searchQuery, filterMode]);

  const connectedDevices = useMemo(() => filteredDevices.filter((d) => !d.isBlocked), [filteredDevices]);
  const blockedDevices = useMemo(() => filteredDevices.filter((d) => d.isBlocked), [filteredDevices]);

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

  const handleToggleApp = (appName) => {
    setSelectedApps((prev) =>
      prev.includes(appName) ? prev.filter((a) => a !== appName) : [...prev, appName],
    );
  };

  const handleSelectAllApps = () => setSelectedApps([...SUPPORTED_APPS]);
  const handleClearSelection = () => setSelectedApps([]);

  const handleApplyRestriction = async () => {
    if (selectedApps.length === 0) {
      Alert.alert('No Apps Selected', 'Please select at least one app to block.');
      return;
    }

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
      blockedApps: selectedApps.map(app => APP_PACKAGE_MAPPING[app] || app.toLowerCase()),
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
      Alert.alert(
        'Restriction Applied',
        `Restriction policy active!\n\nTarget: ${draftYear} - Sec ${draftSection} (${selectedDept})\nBlocked Apps: ${selectedApps.length} Apps Selected\nSchedule: ${startTime} – ${endTime}`,
      );
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to apply restriction policy.');
    }
  };

  const handleEmergencyUnblock = () => {
    Alert.alert(
      '🚨 Emergency Unblock Confirmation',
      'Are you sure you want to IMMEDIATELY UNBLOCK all mobile devices?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Emergency Unblock',
          style: 'destructive',
          onPress: async () => {
            setRestrictionStatus('IDLE');
            setDevices((prev) => prev.map((d) => ({ ...d, isBlocked: false })));

            try {
              await adminService.emergencyUnblockAll();
            } catch (err) {
              console.warn('Emergency unblock API notice:', err.message);
            }

            Alert.alert('Emergency Unblock Executed', 'All mobile restrictions lifted immediately across all devices.');
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
        subtitle="Control Center: Block Apps & Device Access"
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
          options={['All', 'Connected', 'Blocked']}
          selectedValue={filterMode}
          onSelect={setFilterMode}
        />
      </View>

      {/* Target & Apps Policy Section */}
      <View style={styles.section}>
        <SectionTitle
          title="Mobile Restriction Policy"
          subtitle="Configure target filters, block app list & time schedule"
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

          <View style={styles.appsHeaderRow}>
            <Text style={styles.labelTitle}>APPS TO BLOCK ({selectedApps.length})</Text>
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
              const isAppBlocked = selectedApps.includes(app);
              return (
                <TouchableOpacity
                  key={app}
                  style={[styles.appChip, isAppBlocked && styles.appChipBlocked]}
                  onPress={() => handleToggleApp(app)}
                  activeOpacity={0.8}
                >
                  <Icon
                    name={isAppBlocked ? 'check-box' : 'check-box-outline-blank'}
                    size={16}
                    color={isAppBlocked ? colors.white : colors.textMuted}
                  />
                  <Text style={[styles.appChipText, isAppBlocked && styles.appChipTextBlocked]}>
                    {app}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.divider} />

          <View style={styles.controlsGroup}>
            <TouchableOpacity style={styles.applyBtn} onPress={handleApplyRestriction} activeOpacity={0.8}>
              <Icon name="gavel" size={18} color={colors.white} />
              <Text style={styles.applyBtnText}>Apply Restriction Policy</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.emergencyBtn} onPress={handleEmergencyUnblock} activeOpacity={0.8}>
              <Icon name="warning" size={18} color={colors.white} />
              <Text style={styles.emergencyBtnText}>Emergency Unblock All</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Connected Devices */}
      <View style={styles.section}>
        <SectionTitle
          title={`Connected Devices (${connectedDevices.length})`}
          subtitle="Devices currently online"
        />
        {connectedDevices.length === 0 ? (
          <Text style={styles.emptyText}>No connected devices.</Text>
        ) : (
          connectedDevices.map((device) => (
            <DeviceCard
              key={device.id}
              name={device.studentName || device.name || 'Student Device'}
              deviceType={device.model || device.deviceType || 'Android Phone'}
              ipAddress={device.rollNo ? `Reg. No: ${device.rollNo}` : device.deviceId || 'DEV-100'}
              lastActive={device.lastPing || device.activeTime || 'Active'}
              isBlocked={device.isBlocked}
              onToggleBlock={() => handleToggleBlock(device.id)}
            />
          ))
        )}
      </View>

      {/* Blocked Devices */}
      <View style={styles.section}>
        <SectionTitle
          title={`Blocked Devices (${blockedDevices.length})`}
          subtitle="Devices restricted from network access"
        />
        {blockedDevices.length === 0 ? (
          <Text style={styles.emptyText}>No blocked devices.</Text>
        ) : (
          blockedDevices.map((device) => (
            <DeviceCard
              key={device.id}
              name={device.studentName || device.name || 'Student Device'}
              deviceType={device.model || device.deviceType || 'Android Phone'}
              ipAddress={device.rollNo ? `Reg. No: ${device.rollNo}` : device.deviceId || 'DEV-100'}
              lastActive={device.lastPing || device.activeTime || 'Active'}
              isBlocked={device.isBlocked}
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
  labelTitle: {
    ...typography.captionMedium,
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
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
