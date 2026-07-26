import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { colors, shadows } from '../styles/theme';
import VectorIcon from './VectorIcon';

/**
 * Animated Circular Timer Component
 * Matches the design specs from Image 2 & Image 3:
 * - Top Badge: "Restriction Active" (Green) / "Restriction Inactive" (Gray)
 * - Circular progress ring (Blue during active, Amber before 9 AM, Green after 4 PM)
 * - Inside circle: TIME REMAINING / RESTRICTIONS START IN / TIME'S UP
 * - Digital clock: 02:14:35
 * - Subtext: 2 Hours 14 Minutes Remaining / Have a great day!
 */
export const CircularTimer = ({ statusMode = 'ACTIVE', remainingSeconds = 0, progress = 1 }) => {
  const animatedProgress = useRef(new Animated.Value(progress)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const prevStatusRef = useRef(statusMode);

  // Animate progress ring when progress changes
  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: Math.max(0, Math.min(1, progress)),
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress, animatedProgress]);

  // Trigger smooth fade animation when status mode changes
  useEffect(() => {
    if (prevStatusRef.current !== statusMode) {
      prevStatusRef.current = statusMode;
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.3,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [statusMode, fadeAnim]);

  // Format seconds into HH:MM:SS format
  const formatTime = (totalSec) => {
    if (totalSec <= 0) return '00:00:00';
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  };

  // Format remaining time text (e.g. "2 Hours 14 Minutes Remaining")
  const formatRemainingText = (totalSec) => {
    if (totalSec <= 0) return 'Have a great day!';
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);

    if (hrs > 0) {
      return `${hrs} ${hrs === 1 ? 'Hour' : 'Hours'} ${mins} ${mins === 1 ? 'Minute' : 'Minutes'}\nRemaining`;
    }
    return `${mins} ${mins === 1 ? 'Minute' : 'Minutes'}\nRemaining`;
  };

  // Configure colors and labels based on status mode
  let ringColor = colors.primary; // #2563EB (Blue)
  let topBadgeText = 'Restriction Active';
  let topBadgeColor = '#22C55E'; // Green
  let topBadgeIcon = 'shield-check';
  let topBadgeBg = '#DCFCE7';

  let centerLabel = 'TIME REMAINING';

  if (statusMode === 'LIFTED') {
    ringColor = colors.active; // #22C55E (Green)
    topBadgeText = 'Restriction Inactive';
    topBadgeColor = '#6B7280'; // Gray
    topBadgeIcon = 'shield-off-outline';
    topBadgeBg = '#F3F4F6';
    centerLabel = "TIME'S UP";
  } else if (statusMode === 'BEFORE') {
    ringColor = '#F97316'; // #F97316 (Orange/Amber)
    topBadgeText = 'Restriction Inactive';
    topBadgeColor = '#6B7280'; // Gray
    topBadgeIcon = 'clock-outline';
    topBadgeBg = '#F3F4F6';
    centerLabel = 'RESTRICTIONS START IN';
  }

  // Semi-circle rotation interpolations for circular progress ring
  const rightDeg = animatedProgress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['-180deg', '0deg', '0deg'],
  });

  const leftDeg = animatedProgress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['-180deg', '-180deg', '0deg'],
  });

  const SIZE = 230;
  const STROKE = 12;
  const RADIUS = SIZE / 2;

  // Pre-calculated half-container styles to avoid inline style lints
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
    borderColor: ringColor,
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
    borderColor: ringColor,
    borderRightColor: 'transparent',
    borderTopColor: 'transparent',
    position: 'absolute',
    left: 0,
    transform: [{ rotate: leftDeg }],
  };

  return (
    <View style={styles.cardContainer}>
      {/* Top Restriction Badge inside Card */}
      <Animated.View style={[styles.topBadgeWrapper, { opacity: fadeAnim }]}>
        <View style={[styles.topBadge, { backgroundColor: topBadgeBg }]}>
          <VectorIcon name={topBadgeIcon} size={16} color={topBadgeColor} />
          <Text style={[styles.topBadgeText, { color: topBadgeColor }]}>
            {topBadgeText}
          </Text>
        </View>
      </Animated.View>

      {/* Center Animated Circular Progress Ring */}
      <View style={styles.timerCircleWrapper}>
        {/* Background Track Ring */}
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

        {/* Animated Progress Ring - Right Half */}
        <View style={rightHalfStyle}>
          <Animated.View style={rightAnimatedStyle} />
        </View>

        {/* Animated Progress Ring - Left Half */}
        <View style={leftHalfStyle}>
          <Animated.View style={leftAnimatedStyle} />
        </View>

        {/* Inside Circle Content Display */}
        <Animated.View style={[styles.innerContent, { opacity: fadeAnim }]}>
          {/* Top Label inside Circle */}
          <Text style={styles.centerLabelText}>{centerLabel}</Text>

          {/* Large Digital Clock Display */}
          <Text style={styles.clockDisplayText}>
            {formatTime(remainingSeconds)}
          </Text>

          {/* Subtext below Digital Clock */}
          <Text style={styles.clockSubtext}>
            {statusMode === 'LIFTED'
              ? 'Have a great day!'
              : formatRemainingText(remainingSeconds)}
          </Text>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: colors.card,
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...shadows.card,
  },
  topBadgeWrapper: {
    marginBottom: 16,
  },
  topBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 6,
  },
  topBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  timerCircleWrapper: {
    width: 230,
    height: 230,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
  },
  trackRing: {
    borderColor: '#F1F5F9',
    position: 'absolute',
  },
  innerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  centerLabelText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  clockDisplayText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.5,
    fontVariant: ['tabular-nums'],
    marginVertical: 2,
  },
  clockSubtext: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 4,
  },
});

export default CircularTimer;
