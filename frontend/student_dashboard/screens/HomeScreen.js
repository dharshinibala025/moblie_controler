import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { colors } from '../styles/theme';
import Header from '../components/Header';
import RestrictionStatusCard from '../components/RestrictionStatusCard';
import AppGridCard from '../components/AppGridCard';
import RecentActivityCard from '../components/RecentActivityCard';
import NotificationsCard from '../components/NotificationsCard';

export const HomeScreen = ({ data, onNavigateTab, onOpenProfile }) => {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  return (
    <View style={styles.container}>
      {/* Header displaying Logo, Greeting, Student Name, Department, Profile Avatar */}
      <Header
        student={data.student}
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
        {/* Section 1: Restriction Status Card (Main Card) */}
        <RestrictionStatusCard statusData={data.restrictionStatus} />

        {/* Section 2: Blocked Applications */}
        <AppGridCard blockedApps={data.blockedApps} />

        {/* Section 3: Recent Activity */}
        <RecentActivityCard activities={data.recentActivity} />

        {/* Section 4: Notifications */}
        <NotificationsCard
          notifications={data.notifications}
          onViewAll={() => onNavigateTab('notifications')}
        />
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
    paddingTop: 4,
    paddingBottom: 28,
  },
});

export default HomeScreen;
