import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

/**
 * Executive Smart Restriction Clock Component
 * High-precision luxury chronometer centerpiece for Student Dashboard:
 * - 260px outer diameter with precision perimeter tick marks (24 dial markers)
 * - Animated ambient breathing aura ring around dial
 * - Dual-ring circular progress arc with orbiting glow node
 * - Elevated inner glass core with drop shadow
 * - Micro-segmented digital readout (HRS : MIN : SEC) with tabular typography
 * - Live status pill with animated breathing indicator dot
 * - Real-time clock & date indicator badge
 */
export const LiveRestrictionClock = ({
  currentTime,
  remainingSeconds = 0,
  progress = 0.5,
  statusMode = 'ACTIVE',
}) => {
  const animatedProgress = useRef(new Animated.Value(progress)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  // Smooth progress ring transition
  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: Math.max(0, Math.min(1, progress)),
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress, animatedProgress]);

  // Ambient breathing animation loop
  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [pulseAnim]);

  const formatTimeDigits = (totalSec) => {
    if (totalSec <= 0) return { hrs: '00', mins: '00', secs: '00' };
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
    return { hrs: pad(h), mins: pad(m), secs: pad(s) };
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
    return `${month} ${day}`;
  };

  // Status configuration
  let strokeColor = '#2563EB'; // Royal Blue
  let lightBg = '#EFF6FF';
  let borderTint = '#BFDBFE';
  let badgeLabel = 'LIVE RESTRICTION';

  if (statusMode === 'LIFTED') {
    strokeColor = '#16A34A'; // Emerald Green
    lightBg = '#DCFCE7';
    borderTint = '#BBF7D0';
    badgeLabel = 'RESTRICTION LIFTED';
  } else if (statusMode === 'BEFORE') {
    strokeColor = '#EA580C'; // Amber / Orange
    lightBg = '#FFEDD5';
    borderTint = '#FED7AA';
    badgeLabel = 'UPCOMING SCHEDULE';
  }

  // Geometry dimensions
  const SIZE = 260;
  const STROKE = 8;
  const RADIUS = SIZE / 2;

  // Arc interpolation
  const rightDeg = animatedProgress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['-180deg', '0deg', '0deg'],
  });

  const leftDeg = animatedProgress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['-180deg', '-180deg', '0deg'],
  });

  // Orbiting progress tip angle
  const tipDeg = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Breathing pulse interpolation
  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1.0, 1.04],
  });

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0.5],
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

  const { hrs, mins, secs } = formatTimeDigits(remainingSeconds);

  // Generate 24 perimeter dial ticks
  const dialTicks = Array.from({ length: 24 }, (_, i) => i);

  return (
    <View style={styles.container}>
      {/* Outer Ambient Breathing Pulse Aura */}
      <Animated.View
        style={[
          styles.ambientAura,
          {
            backgroundColor: strokeColor,
            opacity: pulseOpacity,
            transform: [{ scale: pulseScale }],
          },
        ]}
      />

      {/* Main Clock Dial Outer Body */}
      <View style={styles.clockDial}>
        {/* Track Ring */}
        <View
          style={[
            styles.trackRing,
            {
              width: SIZE - 10,
              height: SIZE - 10,
              borderRadius: (SIZE - 10) / 2,
              borderWidth: STROKE,
            },
          ]}
        />

        {/* 24 Precision Chronometer Tick Marks */}
        {dialTicks.map((idx) => {
          const angle = idx * 15;
          const isMajor = idx % 2 === 0;
          return (
            <View
              key={idx}
              style={[
                styles.tickContainer,
                { transform: [{ rotate: `${angle}deg` }] },
              ]}
            >
              <View
                style={[
                  styles.tickLine,
                  isMajor ? styles.tickMajor : styles.tickMinor,
                  { backgroundColor: isMajor ? strokeColor : '#CBD5E1' },
                ]}
              />
            </View>
          );
        })}

        {/* Animated Progress Arc - Right */}
        <View style={rightHalfStyle}>
          <Animated.View style={rightAnimatedStyle} />
        </View>

        {/* Animated Progress Arc - Left */}
        <View style={leftHalfStyle}>
          <Animated.View style={leftAnimatedStyle} />
        </View>

        {/* Orbiting Leading Node at tip of progress arc */}
        <Animated.View
          style={[
            styles.tipNodeWrapper,
            {
              transform: [
                { rotate: tipDeg },
                { translateY: -((SIZE - STROKE) / 2) },
              ],
            },
          ]}
        >
          <View style={[styles.tipNodeGlow, { borderColor: strokeColor }]}>
            <View style={[styles.tipNodeCore, { backgroundColor: strokeColor }]} />
          </View>
        </Animated.View>

        {/* Elevated Inner Glass Core Dial */}
        <View style={styles.innerGlassCore}>
          {/* Status Badge Pill */}
          <View
            style={[
              styles.badgePill,
              { backgroundColor: lightBg, borderColor: borderTint },
            ]}
          >
            <Animated.View
              style={[
                styles.statusDot,
                { backgroundColor: strokeColor, opacity: pulseOpacity },
              ]}
            />
            <Text style={[styles.badgeText, { color: strokeColor }]}>
              {badgeLabel}
            </Text>
          </View>

          {/* Micro-Segmented Executive Digital Display */}
          <View style={styles.digitContainer}>
            <View style={styles.digitBox}>
              <Text style={styles.digitNumber}>{hrs}</Text>
              <Text style={styles.digitLabel}>HRS</Text>
            </View>

            <Text style={styles.colonSeparator}>:</Text>

            <View style={styles.digitBox}>
              <Text style={styles.digitNumber}>{mins}</Text>
              <Text style={styles.digitLabel}>MIN</Text>
            </View>

            <Text style={styles.colonSeparator}>:</Text>

            <View style={styles.digitBox}>
              <Text style={[styles.digitNumber, { color: strokeColor }]}>
                {secs}
              </Text>
              <Text style={styles.digitLabel}>SEC</Text>
            </View>
          </View>

          {/* Real-time Clock & Date Footer */}
          <View style={styles.realTimeBadge}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={12}
              color="#64748B"
            />
            <Text style={styles.realTimeText}>
              {formatCurrentTime(currentTime)}
            </Text>
            <Text style={styles.dotDivider}>•</Text>
            <Text style={styles.realDateText}>
              {formatDateString(currentTime)}
            </Text>
          </View>
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
    position: 'relative',
  },
  ambientAura: {
    position: 'absolute',
    width: 274,
    height: 274,
    borderRadius: 137,
  },
  clockDial: {
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  trackRing: {
    borderColor: '#F1F5F9',
    position: 'absolute',
  },

  /* Ticks styling */
  tickContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  tickLine: {
    marginTop: 4,
    borderRadius: 1,
  },
  tickMajor: {
    width: 2,
    height: 7,
    opacity: 0.7,
  },
  tickMinor: {
    width: 1.5,
    height: 4,
    opacity: 0.4,
  },

  /* Orbiting Progress Node */
  tipNodeWrapper: {
    position: 'absolute',
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  tipNodeGlow: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  tipNodeCore: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  /* Inner Glass Core */
  innerGlassCore: {
    width: 208,
    height: 208,
    borderRadius: 104,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F8FAFC',
    paddingHorizontal: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },

  /* Status Pill */
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
    marginBottom: 8,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },

  /* Segmented Digital Display */
  digitContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
  },
  digitBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 4,
    paddingHorizontal: 6,
    minWidth: 42,
  },
  digitNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.5,
    fontVariant: ['tabular-nums'],
  },
  digitLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    marginTop: 1,
  },
  colonSeparator: {
    fontSize: 18,
    fontWeight: '800',
    color: '#94A3B8',
    marginHorizontal: 3,
    marginTop: -8,
  },

  /* Real-time Footer */
  realTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 4,
    marginTop: 8,
  },
  realTimeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  dotDivider: {
    fontSize: 10,
    color: '#94A3B8',
  },
  realDateText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
});

export default LiveRestrictionClock;
