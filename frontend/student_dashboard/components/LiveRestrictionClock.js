import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

/**
 * LiveRestrictionClock Component
 * Perfectly proportioned 240px circular timer dial centerpiece:
 * - 240px diameter with 12px Royal Blue (#2563EB) progress stroke
 * - Thin light-grey background track ring (#E5E7EB)
 * - Inside display: RESTRICTION TIMER badge, Live Countdown (32px), Current Time & Date
 */
export const LiveRestrictionClock = ({
  currentTime,
  remainingSeconds = 0,
  progress = 0.5,
  statusMode = 'ACTIVE',
}) => {
  const animatedProgress = useRef(new Animated.Value(progress)).current;

  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: Math.max(0, Math.min(1, progress)),
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress, animatedProgress]);

  const formatCountdown = (totalSec) => {
    if (totalSec <= 0) return '00:00:00';
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  };

  const formatCurrentTime = (date) => {
    let h = date.getHours();
    const m = date.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12;
    const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
    return `${pad(h)}:${pad(m)} ${ampm}`;
  };

  const formatDateString = (date) => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
  };

  let strokeColor = '#2563EB';
  let badgeLabel = 'RESTRICTION TIMER';

  if (statusMode === 'LIFTED') {
    strokeColor = '#22C55E';
    badgeLabel = 'RESTRICTION COMPLETED';
  } else if (statusMode === 'BEFORE') {
    strokeColor = '#F97316';
    badgeLabel = 'UPCOMING RESTRICTION';
  }

  // Proportioned 240px Dial Geometry
  const SIZE = 240;
  const STROKE = 12;
  const RADIUS = SIZE / 2;

  const rightDeg = animatedProgress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['-180deg', '0deg', '0deg'],
  });

  const leftDeg = animatedProgress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['-180deg', '-180deg', '0deg'],
  });

  const rightHalfStyle = {
    position: 'absolute',
    top: 0,
    right: 0,
    width: RADIUS,
    height: SIZE,
    overflow: 'hidden',
  };

  const rightAnimatedStyle = {
    width: SIZE,
    height: SIZE,
    borderRadius: RADIUS,
    borderWidth: STROKE,
    borderColor: strokeColor,
    borderLeftColor: 'transparent',
    borderBottomColor: 'transparent',
    position: 'absolute',
    right: 0,
    transform: [{ rotate: rightDeg }],
  };

  const leftHalfStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: RADIUS,
    height: SIZE,
    overflow: 'hidden',
  };

  const leftAnimatedStyle = {
    width: SIZE,
    height: SIZE,
    borderRadius: RADIUS,
    borderWidth: STROKE,
    borderColor: strokeColor,
    borderRightColor: 'transparent',
    borderTopColor: 'transparent',
    position: 'absolute',
    left: 0,
    transform: [{ rotate: leftDeg }],
  };

  return (
    <View style={styles.container}>
      <View style={styles.clockDial}>
        {/* Track Ring */}
        <View
          style={[
            styles.trackRing,
            {
              width: SIZE,
              height: SIZE,
              borderRadius: RADIUS,
              borderWidth: STROKE,
            },
          ]}
        />

        {/* Animated Progress Arc - Right */}
        <View style={rightHalfStyle}>
          <Animated.View style={rightAnimatedStyle} />
        </View>

        {/* Animated Progress Arc - Left */}
        <View style={leftHalfStyle}>
          <Animated.View style={leftAnimatedStyle} />
        </View>

        {/* Center Display */}
        <View style={styles.centerContent}>
          <View style={styles.badgePill}>
            <MaterialCommunityIcons
              name="timer-outline"
              size={14}
              color={strokeColor}
            />
            <Text style={[styles.badgeText, { color: strokeColor }]}>
              {badgeLabel}
            </Text>
          </View>

          <Text style={styles.countdownText}>
            {formatCountdown(remainingSeconds)}
          </Text>

          <Text style={styles.currentTimeText}>
            {formatCurrentTime(currentTime)}
          </Text>

          <Text style={styles.currentDateText}>
            {formatDateString(currentTime)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 14,
  },
  clockDial: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  trackRing: {
    borderColor: '#E5E7EB',
    position: 'absolute',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 5,
    marginBottom: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  countdownText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.5,
    fontVariant: ['tabular-nums'],
    marginVertical: 1,
  },
  currentTimeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4B5563',
    marginTop: 4,
  },
  currentDateText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
    marginTop: 1,
  },
});

export default LiveRestrictionClock;
