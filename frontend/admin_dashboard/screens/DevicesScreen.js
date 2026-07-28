import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

import Header from '../components/Header';
import SectionTitle from '../components/SectionTitle';
import DeviceCard from '../components/DeviceCard';

import colors from '../styles/colors';
import typography from '../styles/typography';
import { spacing } from '../styles/globalStyles';

// ---------------------------------------------------------------------------
// Dummy data (no backend / no API calls). Device status is toggled purely
// in local component state -- ready for a future backend integration.
// ---------------------------------------------------------------------------

const INITIAL_DEVICES = [
  {
    id: 'd1',
    name: "Aarav's Phone",
    deviceType: 'Android phone',
    ipAddress: '192.168.1.42',
    lastActive: '2m ago',
    isBlocked: false,
  },
  {
    id: 'd2',
    name: "Meera's Tablet",
    deviceType: 'Android tablet',
    ipAddress: '192.168.1.58',
    lastActive: '10m ago',
    isBlocked: false,
  },
  {
    id: 'd3',
    name: 'Staff Room Device',
    deviceType: 'Android phone',
    ipAddress: '192.168.1.19',
    lastActive: '1h ago',
    isBlocked: false,
  },
  {
    id: 'd4',
    name: "Rohan's Phone",
    deviceType: 'Android phone',
    ipAddress: '192.168.1.77',
    lastActive: '3h ago',
    isBlocked: true,
  },
  {
    id: 'd5',
    name: 'Unknown Device',
    deviceType: 'Android phone',
    ipAddress: '192.168.1.103',
    lastActive: '1d ago',
    isBlocked: true,
  },
];

const DevicesScreen = () => {
  const [devices, setDevices] = useState(INITIAL_DEVICES);

  const connectedDevices = useMemo(() => devices.filter((d) => !d.isBlocked), [devices]);
  const blockedDevices = useMemo(() => devices.filter((d) => d.isBlocked), [devices]);

  const handleToggleBlock = (deviceId) => {
    setDevices((prev) =>
      prev.map((device) =>
        device.id === deviceId ? { ...device, isBlocked: !device.isBlocked } : device,
      ),
    );
  };

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Header title="Devices" subtitle="Monitor and control connected devices" />

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
