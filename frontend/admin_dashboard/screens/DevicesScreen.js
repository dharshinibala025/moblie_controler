import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import FilterChipGroup from '../components/FilterChipGroup';
import SectionTitle from '../components/SectionTitle';
import DeviceCard from '../components/DeviceCard';
import adminService from '../../services/adminService';

import colors from '../styles/colors';
import typography from '../styles/typography';
import { spacing } from '../styles/globalStyles';

const INITIAL_DEVICES = [
  {
    id: 'd1',
    name: "Dharani's Phone",
    deviceType: 'Android phone',
    ipAddress: '192.168.1.42',
    lastActive: '2m ago',
    isBlocked: false,
  },
  {
    id: 'd2',
    name: "Staff Room Tablet",
    deviceType: 'Android tablet',
    ipAddress: '192.168.1.58',
    lastActive: '10m ago',
    isBlocked: false,
  },
];

const DevicesScreen = () => {
  const [devices, setDevices] = useState(INITIAL_DEVICES);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('All');

  const loadDevices = async () => {
    const list = await adminService.getDevices();
    if (list && list.length > 0) {
      setDevices(list);
    }
  };

  useEffect(() => {
    loadDevices();
  }, []);

  const filteredDevices = useMemo(() => {
    return devices.filter((device) => {
      const matchesSearch = device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        device.deviceType.toLowerCase().includes(searchQuery.toLowerCase());
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

    // Optimistic UI update
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

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Header title="Devices" subtitle="Monitor and control connected devices" />

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
              name={device.name}
              deviceType={device.deviceType}
              ipAddress={device.ipAddress}
              lastActive={device.lastActive}
              isBlocked={device.isBlocked}
              onToggleBlock={() => handleToggleBlock(device.id)}
            />
          ))
        )}
      </View>

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
              name={device.name}
              deviceType={device.deviceType}
              ipAddress={device.ipAddress}
              lastActive={device.lastActive}
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
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
});

export default DevicesScreen;
