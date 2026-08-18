import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
  Animated,
  Platform,
  StatusBar,
  AppState,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import AsyncStorage from '@react-native-async-storage/async-storage';

// Import Reusable Modular Components
import LiveRestrictionClock from '../components/LiveRestrictionClock';
import ScheduleInfo from '../components/ScheduleInfo';
import PermissionModal from '../../components/PermissionModal';
import syncService from '../../services/syncService';

const STATUSBAR_OFFSET = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 6 : 12;

export const HomeScreen = ({ data, onOpenProfile }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [statusMode, setStatusMode] = useState('ACTIVE'); // 'ACTIVE' | 'LIFTED' | 'BEFORE'
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [progress, setProgress] = useState(0.5);
  const [permissions, setPermissions] = useState({ accessibilityEnabled: false, overlayEnabled: false });
  const [scheduleStart, setScheduleStart] = useState('09:00');
  const [scheduleEnd, setScheduleEnd] = useState('16:00');
  const scheduleStartRef = useRef('09:00');
  const scheduleEndRef = useRef('16:00');

  const handleScheduleStartChange = (val) => {
    setScheduleStart(val);
    scheduleStartRef.current = val;
  };
  const handleScheduleEndChange = (val) => {
    setScheduleEnd(val);
    scheduleEndRef.current = val;
  };

  const formatTo12Hour = (time24) => {
    if (!time24) return '09:00 AM';
    const [h, m] = time24.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${String(hour12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  // Custom Permission Modal State — one-by-one, no double popups
  const [permModalVisible, setPermModalVisible] = useState(false);
  const [permStep, setPermStep] = useState('restriction'); // 'restriction' | 'accessibility' | 'overlay'
  // Refs keep the AppState listener reading live values without re-subscribing.
  const permStepRef = useRef('restriction');
  const permModalVisibleRef = useRef(false);
  useEffect(() => { permStepRef.current = permStep; }, [permStep]);
  useEffect(() => { permModalVisibleRef.current = permModalVisible; }, [permModalVisible]);
  // Guard: prevent re-showing permission flow when returning from Settings
  const permFlowRunning = useRef(false);
  const permFlowDone = useRef(false);

  const markPermissionPrompted = async () => {
    try {
      await AsyncStorage.setItem('@focussync:permissionPrompted', 'true');
      permFlowDone.current = true;
    } catch (e) { /* ignore */ }
  };

  const grantRestrictionConsent = async () => {
    try {
      await AsyncStorage.setItem('@focussync:restrictionConsent', 'true');
    } catch (e) { /* ignore */ }
  };

  // Runs the native Notification step, then the Overlay step (in that order).
  const continueAfterAccessibility = async () => {
    // STEP: Notification — fire native Android OS popup directly (NO custom modal)
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      try {
        const { PermissionsAndroid } = require('react-native');
        const hasNotif = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
        if (!hasNotif) {
          await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
          // Wait 600ms for the native dialog to fully close before next step
          await new Promise(resolve => setTimeout(resolve, 600));
        }
      } catch (e) {
        console.warn('POST_NOTIFICATIONS request notice:', e.message);
      }
    }

    // STEP: Overlay — show custom modal (no native popup exists for this)
    const res = await syncService.checkPermissions();
    setPermissions(res);
    if (!res.overlayEnabled) {
      setPermStep('overlay');
      setPermModalVisible(true);
    } else {
      await markPermissionPrompted();
    }
  };

  // Grants the restriction consent (non-blocking) and advances to Accessibility.
  const advanceFromRestriction = async () => {
    await grantRestrictionConsent();
    const res = await syncService.checkPermissions();
    setPermissions(res);
    if (!res.accessibilityEnabled) {
      setPermStep('accessibility');
      setPermModalVisible(true);
    } else {
      await continueAfterAccessibility();
    }
  };

  const runPermissionFlow = async () => {
    if (permFlowRunning.current || permFlowDone.current) return;
    permFlowRunning.current = true;
    try {
      const alreadyDone = await AsyncStorage.getItem('@focussync:permissionPrompted');
      if (alreadyDone === 'true') {
        permFlowDone.current = true;
        permFlowRunning.current = false;
        return;
      }

      // STEP 1: Restriction consent — custom modal (no native permission).
      const restrictionConsent = await AsyncStorage.getItem('@focussync:restrictionConsent');
      if (restrictionConsent !== 'true') {
        setPermStep('restriction');
        setPermModalVisible(true);
        permFlowRunning.current = false;
        return;
      }

      // STEP 2: Accessibility — show custom modal (no native popup exists for this)
      const res = await syncService.checkPermissions();
      setPermissions(res);
      if (!res.accessibilityEnabled) {
        setPermStep('accessibility');
        setPermModalVisible(true);
        permFlowRunning.current = false;
        return;
      }

      // STEP 3 + 4: Notification (native) then Overlay.
      await continueAfterAccessibility();
    } catch (e) {
      console.warn('Permission flow notice:', e.message);
    }
    permFlowRunning.current = false;
  };

  const loadPermissions = async () => {
    try {
      const res = await syncService.checkPermissions();
      setPermissions(res);
    } catch (e) {
      console.warn('Permission check notice:', e.message);
    }
  };

  const handlePrimaryPermissionAction = async () => {
    setPermModalVisible(false);
    await new Promise(resolve => setTimeout(resolve, 400));
    if (permStep === 'restriction') {
      await advanceFromRestriction();
    } else if (permStep === 'accessibility') {
      syncService.openAccessibilitySettings();
      // AppState will re-check when user returns from Settings
    } else if (permStep === 'overlay') {
      syncService.openOverlaySettings();
      await markPermissionPrompted();
    }
  };

  const handleSecondaryPermissionAction = async () => {
    setPermModalVisible(false);
    if (permStep === 'restriction') {
      // Consent is non-blocking — proceed to the next step regardless.
      await advanceFromRestriction();
    } else if (permStep === 'accessibility') {
      // Skipped accessibility — still proceed to Notification + Overlay.
      await continueAfterAccessibility();
    } else {
      await markPermissionPrompted();
    }
  };

  const handleTertiaryPermissionAction = async () => {
    // "Don't allow" behaves like "Ask later" for the restriction consent.
    await handleSecondaryPermissionAction();
  };

  // Fade-in animation on mount
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Run the one-by-one permission flow once on first launch
    runPermissionFlow();

    // Start real-time Socket.io listener for instant blocking/unblocking
    syncService.startRealtimeListener();

    // Start periodic sync as fallback (30 seconds)
    syncService.startPeriodicSync(30 * 1000);

    // Load cached policy for dynamic schedule
    syncService.getCachedPolicy().then((p) => {
      if (p) {
        if (p.scheduleStart) handleScheduleStartChange(p.scheduleStart);
        if (p.scheduleEnd) handleScheduleEndChange(p.scheduleEnd);
      }
    }).catch(() => {});

    const subscription = AppState.addEventListener('change', async (nextState) => {
      if (nextState === 'active') {
        const res = await syncService.checkPermissions().catch(() => null);
        if (res) setPermissions(res);

        syncService.getCachedPolicy().then((p) => {
          if (p) {
            if (p.scheduleStart) handleScheduleStartChange(p.scheduleStart);
            if (p.scheduleEnd) handleScheduleEndChange(p.scheduleEnd);
          }
        }).catch(() => {});

        // If user returned from Settings and a permission step was in progress,
        // check if it was granted and advance to next step (one-by-one, no re-trigger)
        if (!permFlowDone.current && !permFlowRunning.current && !permModalVisibleRef.current) {
          if (permStepRef.current === 'accessibility' && res?.accessibilityEnabled) {
            setPermModalVisible(false);
            await continueAfterAccessibility();
          } else if (permStepRef.current === 'overlay' && res?.overlayEnabled) {
            setPermModalVisible(false);
            await markPermissionPrompted();
          }
        }
      }
    });

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    const updateState = () => {
      const now = new Date();
      setCurrentTime(now);

      const hours = now.getHours();
      const minutes = now.getMinutes();
      const seconds = now.getSeconds();
      const currentSec = hours * 3600 + minutes * 60 + seconds;

      const [startH, startM] = scheduleStartRef.current.split(':').map(Number);
      const [endH, endM] = scheduleEndRef.current.split(':').map(Number);
      const startSec = startH * 3600 + startM * 60;
      const endSec = endH * 3600 + endM * 60;
      const totalDuration = endSec - startSec;

      if (currentSec >= startSec && currentSec < endSec) {
        const remaining = endSec - currentSec;
        const prog = remaining / totalDuration;
        setStatusMode('ACTIVE');
        setRemainingSeconds(remaining);
        setProgress(prog);
      } else if (currentSec >= endSec) {
        setStatusMode('LIFTED');
        setRemainingSeconds(0);
        setProgress(1.0);
      } else {
        const remaining = startSec - currentSec;
        const prog = remaining / startSec;
        setStatusMode('BEFORE');
        setRemainingSeconds(remaining);
        setProgress(prog);
      }
    };

    updateState();
    const interval = setInterval(updateState, 1000);
    return () => {
      clearInterval(interval);
      subscription?.remove();
      syncService.stopRealtimeListener();
      syncService.stopPeriodicSync();
    };
    // Mount-only effect: the permission flow runs once; the AppState listener
    // reads live step state via refs (permStepRef/permModalVisibleRef), so
    // re-subscribing on every step change is intentionally avoided.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fadeAnim]);

  const onRefresh = () => {
    setRefreshing(true);
    loadPermissions();
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  // Determine Greeting based on time
  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const studentName = data?.student?.name || '';
  const studentDept = data?.student?.fullDepartment || data?.student?.department || '';
  const isProtectionComplete = permissions.accessibilityEnabled && permissions.overlayEnabled;

  return (
    <View style={styles.container}>
      {/* 1. Header (Logo + Greeting & Student Name + Profile Icon) */}
      <View style={styles.headerContainer}>
        <View style={styles.headerLeftGroup}>
          <View style={styles.logoBadge}>
            <Image
              source={require('../../welcome/assets/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <View style={styles.textGroup}>
            <Text style={styles.greetingText}>{getGreeting()}</Text>
            <Text style={styles.studentNameText}>{studentName}</Text>
            <Text style={styles.departmentText}>{studentDept}</Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onOpenProfile}
          style={styles.avatarButton}
        >
          <MaterialCommunityIcons
            name="account-circle-outline"
            size={36}
            color="#2563EB"
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2563EB']}
            tintColor="#2563EB"
          />
        }
      >
        <Animated.View style={[styles.mainBodyWrapper, { opacity: fadeAnim }]}>
          {/* Protection Active Indicator Banner */}
          {isProtectionComplete ? (
            <View style={styles.protectionActiveBadge}>
              <MaterialCommunityIcons name="shield-check" size={20} color="#16A34A" />
              <Text style={styles.protectionActiveBadgeText}>
                App Blocking Protection Active & Enforced
              </Text>
            </View>
          ) : null}

          {/* 2. Live Restriction Clock Centerpiece */}
          <LiveRestrictionClock
            currentTime={currentTime}
            remainingSeconds={remainingSeconds}
            progress={progress}
            statusMode={statusMode}
          />

          {/* 3. Restriction Schedule Info */}
          <ScheduleInfo scheduleText={`${formatTo12Hour(scheduleStart)} – ${formatTo12Hour(scheduleEnd)}`} />
        </Animated.View>
      </ScrollView>

      {/* Custom Permission Dialog — one-by-one, only for Restriction, Accessibility & Overlay */}
      <PermissionModal
        visible={permModalVisible}
        type={permStep}
        onPrimary={handlePrimaryPermissionAction}
        onSecondary={handleSecondaryPermissionAction}
        onTertiary={handleTertiaryPermissionAction}
        onDismiss={handleSecondaryPermissionAction}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: STATUSBAR_OFFSET,
    paddingBottom: 8,
    backgroundColor: '#F8FAFC',
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    padding: 3,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  textGroup: {
    flex: 1,
  },
  greetingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 1,
  },
  studentNameText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 1,
  },
  departmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
  avatarButton: {
    padding: 2,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    paddingBottom: 60, // Clearance for bottom navigation bar
  },
  mainBodyWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Protection Status Badges
  protectionActiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginVertical: 10,
    gap: 8,
    width: '100%',
  },
  protectionActiveBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16A34A',
  },
  protectionWarningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginVertical: 10,
    gap: 8,
    width: '100%',
  },
  protectionWarningBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
    flex: 1,
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  permTextGroup: {
    flex: 1,
    paddingRight: 8,
  },
  permName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  permDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  enableButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  enableButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});

export default HomeScreen;
