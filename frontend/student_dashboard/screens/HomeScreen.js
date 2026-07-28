import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { colors, shadows } from '../styles/theme';
import Header from '../components/Header';
import CircularTimer from '../components/CircularTimer';
import VectorIcon from '../components/VectorIcon';

/**
 * Modern Student Dashboard Home Screen
 * Features:
 * - Header component with College Logo, Student Greeting, Department & Profile Avatar
 * - Proper status bar offset padding (prevents notch/camera punch-hole overlap)
 * - Real-Time Animated Circular Countdown Timer Card
 * - Today's Restriction Schedule Card
 * - Motivational Quote Card
 * - NO Blocked Applications section on Home page
 */
export const HomeScreen = ({ data, onOpenProfile }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [statusMode, setStatusMode] = useState('ACTIVE'); // 'ACTIVE' | 'LIFTED' | 'BEFORE'
  const [remainingSeconds, setRemainingSeconds] = useState(8075);
  const [progress, setProgress] = useState(0.75);

  useEffect(() => {
    const updateRestrictionState = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const seconds = now.getSeconds();
      const currentSec = hours * 3600 + minutes * 60 + seconds;

      const startSec = 9 * 3600; // 09:00:00 AM (32400s)
      const endSec = 16 * 3600; // 04:00:00 PM (57600s)
      const totalDuration = endSec - startSec; // 7 hours (25200s)

      if (currentSec >= startSec && currentSec < endSec) {
        // 09:00 AM - 04:00 PM: Restrictions Active
        const remaining = endSec - currentSec;
        const prog = remaining / totalDuration;
        setStatusMode('ACTIVE');
        setRemainingSeconds(remaining);
        setProgress(prog);
      } else if (currentSec >= endSec) {
        // After 04:00 PM: Restrictions Lifted / Time's Up
        setStatusMode('LIFTED');
        setRemainingSeconds(0);
        setProgress(1.0);
      } else {
        // Before 09:00 AM: Restrictions Start In
        const remaining = startSec - currentSec;
        const prog = remaining / startSec;
        setStatusMode('BEFORE');
        setRemainingSeconds(remaining);
        setProgress(prog);
      }
    };

    updateRestrictionState();
    const intervalId = setInterval(updateRestrictionState, 1000);
    return () => clearInterval(intervalId);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  return (
    <View style={styles.container}>
      {/* Top Header with College Logo, Student Info & Profile Avatar */}
      <Header
        student={data?.student}
        onOpenProfile={onOpenProfile}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Main Animated Circular Countdown Timer Card */}
        <CircularTimer
          statusMode={statusMode}
          remainingSeconds={remainingSeconds}
          progress={progress}
        />

        {/* Today's Restriction Schedule Card */}
        <View style={styles.scheduleCard}>
          <View style={styles.iconCircle}>
            <VectorIcon name="calendar-month" size={20} color="#2563EB" />
          </View>

          <View style={styles.scheduleTextContainer}>
            <Text style={styles.scheduleLabel}>Today's Restriction Schedule</Text>
            <Text style={styles.scheduleTime}>
              {data?.restrictionStatus?.schedule && data.restrictionStatus.schedule !== 'N/A'
                ? data.restrictionStatus.schedule
                : 'No active schedule'}
            </Text>
          </View>

          <View style={styles.iconCircle}>
            <VectorIcon name="clock-outline" size={20} color="#2563EB" />
          </View>
        </View>

        {/* Motivational Quote Card */}
        <View style={styles.quoteCard}>
          <View style={styles.quoteIconContainer}>
            <VectorIcon name="format-quote-open" size={24} color="#2563EB" />
          </View>

          <View style={styles.quoteTextContainer}>
            <Text style={styles.quoteLine}>Discipline today,</Text>
            <Text style={styles.quoteLine}>Freedom tomorrow.</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingTop: 10,
    paddingBottom: 100, // Clearance above bottom navigation bar
  },

  // Today's Restriction Schedule Card
  scheduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...shadows.soft,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scheduleTextContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  scheduleLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 3,
  },
  scheduleTime: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563EB',
  },

  // Motivational Quote Card
  quoteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 20,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...shadows.soft,
    gap: 14,
  },
  quoteIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quoteTextContainer: {
    flex: 1,
  },
  quoteLine: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 20,
  },
});

export default HomeScreen;
