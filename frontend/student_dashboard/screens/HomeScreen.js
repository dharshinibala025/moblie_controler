import React from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Text } from 'react-native';
import { colors, borderRadius, shadows } from '../styles/theme';
import Header from '../components/Header';
import RestrictionStatusCard from '../components/RestrictionStatusCard';
import AppGridCard from '../components/AppGridCard';
import RecentActivityCard from '../components/RecentActivityCard';
import VectorIcon from '../components/VectorIcon';

export const HomeScreen = ({
  data,
  onNavigateTab,
  onOpenProfile,
  onViewActivityTimeline,
  onOpenRestrictionInfo,
  refreshing,
  onRefresh,
}) => {
  const unreadCount = data?.unreadNotificationCount ?? 0;

  return (
    <View style={styles.container}>
      {/* Header displaying Logo, Greeting, Student Name, Department, Profile Avatar */}
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
        {/* Section 1: Restriction Status Card (tappable → detail) */}
        <RestrictionStatusCard
          statusData={data?.restrictionStatus}
          onPress={onOpenRestrictionInfo}
        />

        {/* Section 2: Blocked Applications */}
        <AppGridCard blockedApps={data?.blockedApps || []} />

        {/* Section 3: Recent Activity */}
        <RecentActivityCard
          activities={data?.recentActivity || []}
          onViewAll={onViewActivityTimeline}
        />

        {/* Section 4: Notifications Quick Link */}
        <TouchableOpacity
          style={styles.notifCard}
          activeOpacity={0.7}
          onPress={() => onNavigateTab('notifications')}
        >
          <View style={styles.notifIconCircle}>
            <VectorIcon name="bell" size={22} color={colors.primary} />
          </View>
          <View style={styles.notifContent}>
            <Text style={styles.notifTitle}>Notifications</Text>
            <Text style={styles.notifSub}>
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                : 'No new notifications'}
            </Text>
          </View>
          {unreadCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          ) : null}
          <VectorIcon name="chevron-right" size={18} color={colors.textMuted} />
        </TouchableOpacity>
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
    paddingBottom: 100,
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.card,
    padding: 16,
    marginHorizontal: 20,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
    ...shadows.card,
  },
  notifIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifContent: {
    flex: 1,
  },
  notifTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  notifSub: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textMuted,
    marginTop: 2,
  },
  badge: {
    backgroundColor: colors.primary,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
});

export default HomeScreen;
