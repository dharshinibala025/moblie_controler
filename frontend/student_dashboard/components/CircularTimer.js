import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';

/**
 * Clean Flat Animated Circular Timer Component (No Card Wrapper)
 * - Animated circular progress ring
 * - Labels: TIME REMAINING / RESTRICTIONS START IN / TIME'S UP
 * - Large digital clock (05:22:16)
 * - Subtext (5 Hours 22 Minutes Remaining)
 */
export const CircularTimer = ({ statusMode = 'ACTIVE', remainingSeconds = 0, progress = 1 }) => {
  const animatedProgress = useRef(new Animated.Value(progress)).current;

  // Animate progress ring smoothly when progress changes
  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: Math.max(0, Math.min(1, progress)),
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress, animatedProgress]);

  // Format seconds into HH:MM:SS format
  const formatTime = (totalSec) => {
    if (totalSec <= 0) return '00:00:00';
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  };

  // Format remaining time subtext (e.g. "5 Hours 22 Minutes Remaining")
  const formatRemainingText = (totalSec) => {
    if (totalSec <= 0) return 'Restrictions lifted for today';
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);

    if (hrs > 0) {
      return `${hrs} ${hrs === 1 ? 'Hour' : 'Hours'} ${mins} ${mins === 1 ? 'Minute' : 'Minutes'} Remaining`;
    }
    return `${mins} ${mins === 1 ? 'Minute' : 'Minutes'} Remaining`;
  };

  let ringColor = '#2563EB'; // Primary #2563EB
  let centerLabel = 'TIME REMAINING';

  if (statusMode === 'LIFTED') {
    ringColor = '#22C55E'; // Success #22C55E
    centerLabel = "TIME'S UP";
  } else if (statusMode === 'BEFORE') {
    ringColor = '#F97316';
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

  const SIZE = 240;
  const STROKE = 10;
  const RADIUS = SIZE / 2;

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
    <View style={styles.timerContainer}>
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
        <View style={styles.innerContent}>
          <Text style={styles.centerLabelText}>{centerLabel}</Text>
          <Text style={styles.clockDisplayText}>
            {formatTime(remainingSeconds)}
          </Text>
          <Text style={styles.clockSubtext}>
            {statusMode === 'LIFTED'
              ? 'Restrictions Lifted'
              : formatRemainingText(remainingSeconds)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  timerCircleWrapper: {
    width: 240,
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackRing: {
    borderColor: '#E2E8F0',
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
    color: '#6B7280',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  clockDisplayText: {
    fontSize: 34,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: 0.5,
    fontVariant: ['tabular-nums'],
    marginVertical: 2,
  },
  clockSubtext: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
});

export default CircularTimer;
