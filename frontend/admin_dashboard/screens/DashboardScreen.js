import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import Header from '../components/Header';
import StatsCard from '../components/StatsCard';
import SectionTitle from '../components/SectionTitle';
import DashboardCard from '../components/DashboardCard';
import ActivityCard from '../components/ActivityCard';
import PlaceholderChart from '../components/PlaceholderChart';

import colors from '../styles/colors';
import typography from '../styles/typography';
import { spacing, radius } from '../styles/globalStyles';

// ---------------------------------------------------------------------------
// Dummy data (no backend / no API calls)
// ---------------------------------------------------------------------------

const STATS_DATA = [
  {
    id: 'total-students',
    icon: 'school',
    label: 'Total Students',
    value: '1,248',
    iconColor: colors.primaryBlue,
    iconBackground: colors.secondaryBackground,
    trend: '+4.2%',
    trendPositive: true,
  },
  {
    id: 'total-staff',
    icon: 'groups',
    label: 'Total Staff',
    value: '86',
    iconColor: colors.skyBlue,
    iconBackground: colors.secondaryBackground,
    trend: '+1.1%',
    trendPositive: true,
  },
  {
    id: 'connected-phones',
    icon: 'smartphone',
    label: 'Connected Phones',
    value: '742',
    iconColor: colors.success,
    iconBackground: colors.successSoft,
    trend: '+8.6%',
    trendPositive: true,
  },
  {
    id: 'blocked-phones',
    icon: 'phonelink-erase',
    label: 'Blocked Phones',
    value: '19',
    iconColor: colors.danger,
    iconBackground: colors.dangerSoft,
    trend: '-2.3%',
    trendPositive: false,
  },
];

const RECENT_ACTIVITY = [
  {
    id: 'activity-1',
    icon: 'person-add',
    title: 'New student registered',
    description: 'Aarav Sharma joined Grade 10 - B',
    time: '2m ago',
    iconColor: colors.primaryBlue,
    iconBackground: colors.secondaryBackground,
  },
  {
    id: 'activity-2',
    icon: 'phonelink-erase',
    title: 'Device blocked',
    description: 'Unauthorized app detected on Device #482',
    time: '18m ago',
    iconColor: colors.danger,
    iconBackground: colors.dangerSoft,
  },
  {
    id: 'activity-3',
    icon: 'how-to-reg',
    title: 'Staff attendance updated',
    description: 'Priya Nair marked present',
    time: '46m ago',
    iconColor: colors.success,
    iconBackground: colors.successSoft,
  },
  {
    id: 'activity-4',
    icon: 'description',
    title: 'Monthly report generated',
    description: 'October attendance report is ready',
    time: '1h ago',
    iconColor: colors.skyBlue,
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
          {STATS_DATA.map((stat) => (
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
          {RECENT_ACTIVITY.map((activity, index) => (
            <View key={activity.id} style={styles.activityPadding}>
              <ActivityCard
                icon={activity.icon}
                title={activity.title}
                description={activity.description}
                time={activity.time}
                iconColor={activity.iconColor}
                iconBackground={activity.iconBackground}
                isLast={index === RECENT_ACTIVITY.length - 1}
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
