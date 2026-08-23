import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  ActivityIndicator,
  Alert,
  DeviceEventEmitter,
} from 'react-native';
import { colors, shadows, borderRadius } from '../styles/theme';
import VectorIcon from '../components/VectorIcon';
import syncService from '../../services/syncService';
import studentService from '../../services/studentService';

const STATUSBAR_OFFSET =
  Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 16;

export const EnforcementDiagnosticsScreen = ({ onBack }) => {
  const [enforcementState, setEnforcementState] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState({
    connected: false,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEnforcementState = async () => {
    try {
      setLoading(true);
      const state = await syncService.getEnforcementState();
      setEnforcementState(state);
    } catch (err) {
      console.warn('EnforcementDiagnostics: Failed to fetch state', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEnforcementState();

    const connListener = DeviceEventEmitter.addListener(
      'FocusSync:connectionStatus',
      status => {
        setConnectionStatus(status);
      },
    );

    const policyListener = DeviceEventEmitter.addListener(
      'FocusSync:policyChanged',
      () => {
        fetchEnforcementState();
      },
    );

    return () => {
      connListener?.remove();
      policyListener?.remove();
    };
  }, []);

  const handleForceSync = async () => {
    setRefreshing(true);
    try {
      await syncService.sync('manual');
      setTimeout(fetchEnforcementState, 2000);
    } catch (err) {
      Alert.alert('Sync Failed', err.message || 'Failed to force sync');
      setRefreshing(false);
    }
  };

  const handleTestBlock = () => {
    syncService.testBlockOverlay();
    Alert.alert(
      'Test Block',
      'Test block overlay launched. Check if the block screen appears.',
    );
  };

  const handleOpenAccessibility = () => {
    syncService.openAccessibilitySettings();
  };

  const handleOpenOverlay = () => {
    syncService.openOverlaySettings();
  };

  const getStatusConfig = status => {
    switch (status) {
      case 'OK':
        return {
          color: colors.active,
          bg: colors.activeLight,
          icon: 'check-circle',
          label: 'All Systems OK',
        };
      case 'ENABLE_IN_SETTINGS':
        return {
          color: '#EF4444',
          bg: '#FEE2E2',
          icon: 'settings',
          label: 'Enable in Accessibility Settings',
        };
      case 'SERVICE_DEAD_REENABLE':
        return {
          color: '#F59E0B',
          bg: '#FEF3C7',
          icon: 'alert-circle',
          label: 'Service Dead - Re-enable Required',
        };
      case 'ENABLE_OVERLAY_PERMISSION':
        return {
          color: '#F59E0B',
          bg: '#FEF3C7',
          icon: 'layers',
          label: 'Enable Display Over Apps Permission',
        };
      default:
        return {
          color: colors.textMuted,
          bg: colors.surface,
          icon: 'help-circle',
          label: 'Unknown Status',
        };
    }
  };

  const diagnostic = enforcementState?.diagnostic || 'UNKNOWN';
  const statusConfig = getStatusConfig(diagnostic);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={fetchEnforcementState}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
    >
      {/* Back Navigation Header */}
      <View style={styles.screenHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <VectorIcon name="chevron-left" size={22} color={colors.primary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Enforcement Diagnostics</Text>
        <Text style={styles.screenSubtitle}>
          Real-time enforcement chain health check
        </Text>
      </View>

      {/* Overall Status Banner */}
      <View
        style={[
          {
            ...styles.syncBanner,
            backgroundColor: statusConfig.bg,
            borderColor: statusConfig.color,
          },
        ]}
      >
        <VectorIcon
          name={statusConfig.icon}
          size={24}
          color={statusConfig.color}
        />
        <View style={styles.bannerContent}>
          <Text style={[styles.bannerTitle, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
          <Text style={styles.bannerSub}>
            Tap items below for details and actions
          </Text>
        </View>
      </View>

      {/* Connection Status Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <VectorIcon
            name={connectionStatus.connected ? 'wifi' : 'wifi-off'}
            size={18}
            color={connectionStatus.connected ? colors.active : '#EF4444'}
          />
          <Text style={styles.cardTitle}>Real-time Connection</Text>
        </View>

        <View style={styles.diagnosticRow}>
          <View style={styles.diagnosticItem}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: connectionStatus.connected
                    ? colors.active
                    : '#EF4444',
                },
              ]}
            />
            <Text style={styles.diagnosticLabel}>Socket.io</Text>
            <Text style={styles.diagnosticValue}>
              {connectionStatus.connected ? 'Connected' : 'Disconnected'}
            </Text>
            {connectionStatus.reason && (
              <Text style={styles.diagnosticSub}>
                Reason: {connectionStatus.reason}
              </Text>
            )}
          </View>

          <View style={styles.diagnosticItem}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: enforcementState?.configured
                    ? colors.active
                    : '#EF4444',
                },
              ]}
            />
            <Text style={styles.diagnosticLabel}>Policy Configured</Text>
            <Text style={styles.diagnosticValue}>
              {enforcementState?.configured ? 'Yes' : 'No'}
            </Text>
          </View>
        </View>

        <View style={styles.diagnosticRow}>
          <View style={styles.diagnosticItem}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: enforcementState?.emergency
                    ? '#EF4444'
                    : colors.active,
                },
              ]}
            />
            <Text style={styles.diagnosticLabel}>Emergency Mode</Text>
            <Text style={styles.diagnosticValue}>
              {enforcementState?.emergency ? 'Active' : 'Inactive'}
            </Text>
          </View>

          <View style={styles.diagnosticItem}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: enforcementState?.scheduleActive
                    ? colors.active
                    : colors.textMuted,
                },
              ]}
            />
            <Text style={styles.diagnosticLabel}>Schedule Active</Text>
            <Text style={styles.diagnosticValue}>
              {enforcementState?.scheduleActive ? 'Yes' : 'No'}
            </Text>
          </View>
        </View>
      </View>

      {/* Permissions & Service Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <VectorIcon name="shield-check" size={18} color={colors.primary} />
          <Text style={styles.cardTitle}>Permissions & Service</Text>
        </View>

        <View style={styles.diagnosticRow}>
          <View style={styles.diagnosticItem}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: enforcementState?.accessibilityEnabled
                    ? colors.active
                    : '#EF4444',
                },
              ]}
            />
            <Text style={styles.diagnosticLabel}>Accessibility Enabled</Text>
            <Text style={styles.diagnosticValue}>
              {enforcementState?.accessibilityEnabled ? 'Enabled' : 'Disabled'}
            </Text>
          </View>

          <View style={styles.diagnosticItem}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: enforcementState?.accessibilityRunning
                    ? colors.active
                    : '#EF4444',
                },
              ]}
            />
            <Text style={styles.diagnosticLabel}>Service Running</Text>
            <Text style={styles.diagnosticValue}>
              {enforcementState?.accessibilityRunning ? 'Running' : 'DEAD'}
            </Text>
          </View>
        </View>

        <View style={styles.diagnosticRow}>
          <View style={styles.diagnosticItem}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: enforcementState?.overlayEnabled
                    ? colors.active
                    : '#EF4444',
                },
              ]}
            />
            <Text style={styles.diagnosticLabel}>Overlay Permission</Text>
            <Text style={styles.diagnosticValue}>
              {enforcementState?.overlayEnabled ? 'Granted' : 'Denied'}
            </Text>
          </View>

          <View style={styles.diagnosticItem}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: enforcementState?.configured
                    ? colors.active
                    : '#EF4444',
                },
              ]}
            />
            <Text style={styles.diagnosticLabel}>Policy Stored</Text>
            <Text style={styles.diagnosticValue}>
              {enforcementState?.configured ? 'Yes' : 'No'}
            </Text>
          </View>
        </View>
      </View>

      {/* Policy Details Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <VectorIcon name="file-document" size={18} color={colors.primary} />
          <Text style={styles.cardTitle}>Active Policy Details</Text>
        </View>

        <View style={styles.diagnosticRow}>
          <View style={styles.diagnosticItem}>
            <Text style={styles.diagnosticLabel}>Status</Text>
            <Text style={styles.diagnosticValue}>
              {enforcementState?.status || 'N/A'}
            </Text>
          </View>

          <View style={styles.diagnosticItem}>
            <Text style={styles.diagnosticLabel}>Policy Version</Text>
            <Text style={styles.diagnosticValue}>
              {enforcementState?.policyVersion || 0}
            </Text>
          </View>
        </View>

        <View style={styles.diagnosticRow}>
          <View style={styles.diagnosticItem}>
            <Text style={styles.diagnosticLabel}>Schedule</Text>
            <Text style={styles.diagnosticValue}>
              {enforcementState?.scheduleStart || '09:00'} -{' '}
              {enforcementState?.scheduleEnd || '16:00'}
            </Text>
          </View>

          <View style={styles.diagnosticItem}>
            <Text style={styles.diagnosticLabel}>Active Days</Text>
            <Text style={styles.diagnosticValue}>
              {(enforcementState?.activeDays || []).join(', ')}
            </Text>
          </View>
        </View>

        <View style={styles.diagnosticRow}>
          <View style={styles.diagnosticItem}>
            <Text style={styles.diagnosticLabel}>Blocked Apps Count</Text>
            <Text style={styles.diagnosticValue}>
              {enforcementState?.blockedAppCount || 0}
            </Text>
          </View>

          <View style={styles.diagnosticItem}>
            <Text style={styles.diagnosticLabel}>Category Apps Count</Text>
            <Text style={styles.diagnosticValue}>
              {enforcementState?.categoryAppCount || 0}
            </Text>
          </View>
        </View>
      </View>

      {/* Actions Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <VectorIcon name="tool" size={18} color={colors.primary} />
          <Text style={styles.cardTitle}>Actions</Text>
        </View>

        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={handleForceSync}
            disabled={refreshing}
            activeOpacity={0.8}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <VectorIcon name="refresh" size={18} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Force Sync Now</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#F59E0B' }]}
            onPress={handleTestBlock}
            activeOpacity={0.8}
          >
            <VectorIcon name="play-circle" size={18} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Test Block Overlay</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: enforcementState?.accessibilityRunning
                  ? '#16A34A'
                  : '#EF4444',
              },
            ]}
            onPress={handleOpenAccessibility}
            activeOpacity={0.8}
          >
            <VectorIcon name="settings" size={18} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>
              {enforcementState?.accessibilityRunning
                ? 'Accessibility Settings'
                : 'Re-enable Accessibility'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: enforcementState?.overlayEnabled
                  ? '#16A34A'
                  : '#EF4444',
              },
            ]}
            onPress={handleOpenOverlay}
            activeOpacity={0.8}
          >
            <VectorIcon name="layers" size={18} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>
              {enforcementState?.overlayEnabled
                ? 'Overlay Settings'
                : 'Enable Overlay Permission'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Troubleshooting Guide Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <VectorIcon name="information" size={18} color={colors.primary} />
          <Text style={styles.cardTitle}>Troubleshooting Guide</Text>
        </View>
        <Text style={styles.policyText}>
          <Text style={{ fontWeight: '700', marginBottom: 8 }}>
            Common Issues:
          </Text>
          •{' '}
          <Text style={{ fontWeight: '600' }}>
            Accessibility shows Enabled but Service is DEAD:
          </Text>{' '}
          Turn OFF → wait 3 seconds → Turn ON again in Settings → Accessibility
          → FocusSync.
          <Text style={{ marginTop: 8 }} />•{' '}
          <Text style={{ fontWeight: '600' }}>Apps not blocking:</Text> Check
          "Service Running" is green. If red, re-enable accessibility. Also
          verify Overlay permission is granted.
          <Text style={{ marginTop: 8 }} />•{' '}
          <Text style={{ fontWeight: '600' }}>No real-time updates:</Text> Check
          "Socket.io" shows Connected. If disconnected, pull down to force sync
          or restart app.
          <Text style={{ marginTop: 8 }} />•{' '}
          <Text style={{ fontWeight: '600' }}>Emergency mode active:</Text>{' '}
          Admin has unlocked all apps. Restrictions will resume when admin
          disables emergency.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingTop: STATUSBAR_OFFSET,
    paddingBottom: 40,
  },
  screenHeader: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    gap: 4,
  },
  backText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  screenSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 4,
  },
  syncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 14,
    padding: 14,
    borderRadius: borderRadius.card,
    gap: 12,
    borderWidth: 1,
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  bannerSub: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.card,
    padding: 18,
    marginHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  diagnosticRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  diagnosticItem: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 4,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  diagnosticLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  diagnosticValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  diagnosticSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 8,
    ...shadows.soft,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  policyText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    lineHeight: 20,
  },
});

export default EnforcementDiagnosticsScreen;
