import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

import Header from '../components/Header';
import SectionTitle from '../components/SectionTitle';
import DashboardCard from '../components/DashboardCard';
import SettingsRow from '../components/SettingsRow';

import colors from '../styles/colors';
import typography from '../styles/typography';
import { spacing, radius } from '../styles/globalStyles';

const SettingsScreen = ({ onLogout }) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  const handleRowPress = (rowId) => {
    if (rowId === 'logout' && onLogout) {
      onLogout();
    }
  };

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Header title="Settings" subtitle="Manage your admin preferences" />

      <View style={styles.section}>
        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>AD</Text>
          </View>
          <Text style={styles.profileName}>Admin</Text>
          <Text style={styles.profileEmail}>admin@ksrce.edu.in</Text>
        </View>
      </View>

      <View style={styles.section}>
        <SectionTitle title="Account" />
        <DashboardCard noPadding>
          <SettingsRow
            icon="person-outline"
            label="Profile"
            subtitle="Name, photo, and contact details"
            onPress={() => handleRowPress('profile')}
          />
          <SettingsRow
            icon="lock-outline"
            label="Security"
            subtitle="Password and login activity"
            onPress={() => handleRowPress('security')}
            isLast
          />
        </DashboardCard>
      </View>

      <View style={styles.section}>
        <SectionTitle title="Preferences" />
        <DashboardCard noPadding>
          <SettingsRow
            icon="notifications-none"
            label="Notifications"
            subtitle="Push alerts for activity and reports"
            type="switch"
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
          />
          <SettingsRow
            icon="dark-mode"
            label="Dark Mode"
            subtitle="Currently unavailable in this build"
            type="switch"
            value={darkModeEnabled}
            onValueChange={setDarkModeEnabled}
          />
          <SettingsRow
            icon="language"
            label="Language"
            subtitle="English (US)"
            onPress={() => handleRowPress('language')}
            isLast
          />
        </DashboardCard>
      </View>

      <View style={styles.section}>
        <SectionTitle title="Support" />
        <DashboardCard noPadding>
          <SettingsRow
            icon="help-outline"
            label="Help Center"
            subtitle="FAQs and support articles"
            onPress={() => handleRowPress('help')}
          />
          <SettingsRow
            icon="info-outline"
            label="About"
            subtitle="App version and legal information"
            onPress={() => handleRowPress('about')}
          />
          <SettingsRow
            icon="logout"
            label="Log Out"
            danger
            onPress={() => handleRowPress('logout')}
            isLast
          />
        </DashboardCard>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: spacing.xxxl },
  section: { paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  profileCard: {
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xl,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: radius.round,
    backgroundColor: colors.primaryBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  profileAvatarText: { ...typography.h3, color: colors.white },
  profileName: { ...typography.h3, color: colors.textPrimary },
  profileEmail: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
});

export default SettingsScreen;
