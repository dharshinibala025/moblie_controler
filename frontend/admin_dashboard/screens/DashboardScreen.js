import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import Header from '../components/Header';
import StatsCard from '../components/StatsCard';
import SectionTitle from '../components/SectionTitle';
import DashboardCard from '../components/DashboardCard';
import ActivityCard from '../components/ActivityCard';
import PlaceholderChart from '../components/PlaceholderChart';
import adminService from '../../services/adminService';

import colors from '../styles/colors';
import typography from '../styles/typography';
import { spacing, radius } from '../styles/globalStyles';

const INITIAL_STATS = [
  {
    id: 'total-students',
    icon: 'school',
    label: 'Total Students',
    value: '12',
    iconColor: colors.primaryBlue,
    iconBackground: colors.secondaryBackground,
    trend: '+4.2%',
    trendPositive: true,
  },
  {
    id: 'total-staff',
    icon: 'groups',
    label: 'Total Staff',
    value: '1',
    iconColor: colors.skyBlue,
    iconBackground: colors.secondaryBackground,
    trend: '+1.1%',
    trendPositive: true,
  },
  {
    id: 'connected-phones',
    icon: 'smartphone',
    label: 'Connected Phones',
    value: '1',
    iconColor: colors.success,
    iconBackground: colors.successSoft,
    trend: '+8.6%',
    trendPositive: true,
  },
  {
    id: 'blocked-phones',
    icon: 'phonelink-erase',
    label: 'Blocked Phones',
    value: '0',
    iconColor: colors.danger,
    iconBackground: colors.dangerSoft,
    trend: '0%',
    trendPositive: false,
  },
];

const INITIAL_ACTIVITIES = [
  {
    id: 'activity-1',
    icon: 'person-add',
    title: 'New student registered',
    description: 'Dharani V V joined CSE - 1st Year',
    time: '2m ago',
    iconColor: colors.primaryBlue,
    iconBackground: colors.secondaryBackground,
  },
];

const USAGE_SUMMARY_DATA = [
  { label: 'Mon', value: 42 },
  { label: 'Tue', value: 58 },
  { label: 'Wed', value: 65 },
  { label: 'Thu', value: 49 },
  { label: 'Fri', value: 72 },
  { label: 'Sat', value: 38 },
  { label: 'Sun', value: 30 },
];

const DashboardScreen = () => {
  const [stats, setStats] = useState(INITIAL_STATS);
  const [activities, setActivities] = useState(INITIAL_ACTIVITIES);

  useEffect(() => {
    let isMounted = true;
    const fetchOverview = async () => {
      const res = await adminService.getDashboardOverview();
      if (res && isMounted) {
        if (res.stats && res.stats.length > 0) {
          setStats(res.stats);
        }
        if (res.recentActivities && res.recentActivities.length > 0) {
          setActivities(res.recentActivities);
        }
      }
    };
    fetchOverview();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Header
        title="Dashboard"
        subtitle="Welcome back, Admin"
        rightElement={
          <View style={styles.headerActions}>
            <View style={styles.notificationButton}>
              <Icon name="notifications-none" size={20} color={colors.textPrimary} />
              <View style={styles.notificationDot} />
            </View>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>AD</Text>
            </View>
          </View>
        }
      />

      <View style={styles.section}>
        <SectionTitle title="Overview" subtitle="Live snapshot of your institution" />
        <View style={styles.statsGrid}>
          {stats.map((stat) => (
            <View key={stat.id} style={styles.statsGridItem}>
              <StatsCard
                icon={stat.icon}
                label={stat.label}
                value={stat.value}
                iconColor={stat.iconColor}
                iconBackground={stat.iconBackground}
                trend={stat.trend}
                trendPositive={stat.trendPositive}
              />
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <SectionTitle title="Recent Activity" />
        <DashboardCard noPadding>
          {activities.map((activity, index) => (
            <View key={activity.id} style={styles.activityPadding}>
              <ActivityCard
                icon={activity.icon}
                title={activity.title}
                description={activity.description}
                time={activity.time}
                iconColor={activity.iconColor}
                iconBackground={activity.iconBackground}
                isLast={index === activities.length - 1}
              />
            </View>
          ))}
        </DashboardCard>
      </View>

      <View style={styles.section}>
        <SectionTitle title="Usage Summary" subtitle="Last 7 days" />
        <DashboardCard>
          <View style={styles.usageHeader}>
            <Text style={styles.usageTotal}>354 sessions</Text>
            <Text style={styles.usagePeriod}>This week</Text>
          </View>
          <PlaceholderChart data={USAGE_SUMMARY_DATA} />
        </DashboardCard>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: spacing.xxxl },
  section: { paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: radius.round,
    backgroundColor: colors.danger,
    borderWidth: 1.5,
    borderColor: colors.background,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.round,
    backgroundColor: colors.primaryBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...typography.bodyMedium, color: colors.white, fontSize: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statsGridItem: { width: '48%', marginBottom: spacing.md },
  activityPadding: { paddingHorizontal: spacing.md },
  usageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  usageTotal: { ...typography.h3, color: colors.textPrimary },
  usagePeriod: { ...typography.caption, color: colors.textSecondary },
});

export default DashboardScreen;
