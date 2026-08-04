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

// Import Reusable Modular Components
import LiveRestrictionClock from '../components/LiveRestrictionClock';
import ScheduleInfo from '../components/ScheduleInfo';
import syncService from '../../services/syncService';

const STATUSBAR_OFFSET = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 6 : 12;

/**
 * Perfectly Centered Student Dashboard Home Screen
 * - Header: Logo + Greeting & Student Name + Profile Icon
 * - Protection Card: Enable Accessibility Service & Display Over Apps Buttons
 * - Centerpiece: Live Restriction Clock vertically & horizontally centered on page
 * - Restriction Schedule info row (09:00 AM – 04:00 PM)
 * - 100% Flat Enterprise Layout on #F8FAFC
 */
export const HomeScreen = ({ data, onOpenProfile }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [statusMode, setStatusMode] = useState('ACTIVE'); // 'ACTIVE' | 'LIFTED' | 'BEFORE'
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [progress, setProgress] = useState(0.5);
  const [permissions, setPermissions] = useState({ accessibilityEnabled: false, overlayEnabled: false });

  const loadPermissions = async () => {
    try {
      const res = await syncService.checkPermissions();
      setPermissions(res);
    } catch (e) {
      console.warn('Permission check notice:', e.message);
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

  const studentName = data?.student?.name || 'Dharani V V';
  const studentDept = data?.student?.fullDepartment || data?.student?.department || 'Computer Science and Engineering';
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
          {/* Protection & Enforcement Status Card */}
          <View style={[styles.protectionCard, !isProtectionComplete && styles.protectionWarningCard]}>
            <View style={styles.protectionHeader}>
              <MaterialCommunityIcons
                name={isProtectionComplete ? "shield-check" : "shield-alert"}
                size={24}
                color={isProtectionComplete ? "#16A34A" : "#DC2626"}
              />
              <Text style={styles.protectionTitle}>
                {isProtectionComplete ? "App Blocking Protection Active" : "Action Required: Enable App Blocking"}
              </Text>
            </View>

            {!permissions.accessibilityEnabled && (
              <View style={styles.permissionRow}>
                <View style={styles.permTextGroup}>
                  <Text style={styles.permName}>Accessibility Service</Text>
                  <Text style={styles.permDesc}>Required to detect & restrict app launches</Text>
                </View>
                <TouchableOpacity
                  style={styles.enableButton}
                  onPress={() => syncService.openAccessibilitySettings()}
                >
                  <Text style={styles.enableButtonText}>Enable</Text>
                </TouchableOpacity>
              </View>
            )}

            {!permissions.overlayEnabled && (
              <View style={styles.permissionRow}>
                <View style={styles.permTextGroup}>
                  <Text style={styles.permName}>Display Over Apps</Text>
                  <Text style={styles.permDesc}>Required to display restriction screen</Text>
                </View>
                <TouchableOpacity
                  style={styles.enableButton}
                  onPress={() => syncService.openOverlaySettings()}
                >
                  <Text style={styles.enableButtonText}>Enable</Text>
                </TouchableOpacity>
              </View>
            )}

            {isProtectionComplete && (
              <Text style={styles.protectionActiveText}>
                All background enforcement services are enabled and monitoring active policy rules.
              </Text>
            )}
          </View>

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

  // Protection Status Card
  protectionCard: {
    width: '100%',
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  protectionWarningCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  protectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  protectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  protectionActiveText: {
    fontSize: 12,
    color: '#16A34A',
    fontWeight: '600',
    marginTop: 4,
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
