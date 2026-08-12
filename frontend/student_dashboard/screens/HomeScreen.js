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

  // Custom Permission Modal State — pops up on first prompt only
  const [permModalVisible, setPermModalVisible] = useState(false);
  const [permStep, setPermStep] = useState('notification'); // 'notification' | 'accessibility' | 'overlay'

  const markPermissionPrompted = async () => {
    try {
      await AsyncStorage.setItem('@focussync:permissionPrompted', 'true');
    } catch (e) {
      // ignore
    }
  };

  const loadPermissions = async () => {
    try {
      const res = await syncService.checkPermissions();
      setPermissions(res);

      const alreadyPrompted = await AsyncStorage.getItem('@focussync:permissionPrompted');
      if (alreadyPrompted === 'true') {
        setPermModalVisible(false);
        return;
      }

      // Check if any permission needs prompting
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        const { PermissionsAndroid } = require('react-native');
        const hasNotif = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
        if (!hasNotif) {
          setPermStep('notification');
          setPermModalVisible(true);
          return;
        }
      }

      if (!res.accessibilityEnabled) {
        setPermStep('accessibility');
        setPermModalVisible(true);
      } else if (!res.overlayEnabled) {
        setPermStep('overlay');
        setPermModalVisible(true);
      } else {
        setPermModalVisible(false);
        markPermissionPrompted();
      }
    } catch (e) {
      console.warn('Permission check notice:', e.message);
    }
  };

  const handlePrimaryPermissionAction = async () => {
    if (permStep === 'notification') {
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        try {
          const { PermissionsAndroid } = require('react-native');
          await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
        } catch (e) {
          console.warn('POST_NOTIFICATIONS error:', e);
        }
      }
      if (!permissions.accessibilityEnabled) {
        setPermStep('accessibility');
      } else if (!permissions.overlayEnabled) {
        setPermStep('overlay');
      } else {
        setPermModalVisible(false);
        markPermissionPrompted();
      }
    } else if (permStep === 'accessibility') {
      syncService.openAccessibilitySettings();
      if (!permissions.overlayEnabled) {
        setPermStep('overlay');
      } else {
        setPermModalVisible(false);
        markPermissionPrompted();
      }
    } else if (permStep === 'overlay') {
      syncService.openOverlaySettings();
      setPermModalVisible(false);
      markPermissionPrompted();
    }
  };

  // Fade-in animation on mount
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadPermissions();
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        loadPermissions();
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

      const startSec = 9 * 3600; // 09:00:00 AM (32400s)
      const endSec = 16 * 3600; // 04:00:00 PM (57600s)
      const totalDuration = endSec - startSec; // 7 hours (25200s)

      if (currentSec >= startSec && currentSec < endSec) {
        // Active between 09:00 AM and 04:00 PM
        const remaining = endSec - currentSec;
        const prog = remaining / totalDuration;
        setStatusMode('ACTIVE');
        setRemainingSeconds(remaining);
        setProgress(prog);
      } else if (currentSec >= endSec) {
        // Completed after 04:00 PM
        setStatusMode('LIFTED');
        setRemainingSeconds(0);
        setProgress(1.0);
      } else {
        // Upcoming before 09:00 AM
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
    };
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
          <ScheduleInfo scheduleText="09:00 AM – 04:00 PM" />
        </Animated.View>
      </ScrollView>

      {/* Custom Permission Dialog Popup (Matching Screenshots) */}
      <PermissionModal
        visible={permModalVisible}
        type={permStep}
        onPrimary={handlePrimaryPermissionAction}
        onSecondary={() => setPermModalVisible(false)}
        onTertiary={() => setPermModalVisible(false)}
        onDismiss={() => setPermModalVisible(false)}
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
