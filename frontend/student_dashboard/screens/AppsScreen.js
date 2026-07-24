import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput } from 'react-native';
import { colors, borderRadius, shadows } from '../styles/theme';
import AppGridCard from '../components/AppGridCard';
import VectorIcon from '../components/VectorIcon';

export const AppsScreen = ({ data }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBlocked = (data.blockedApps || []).filter(
    (a) => a.blocked && a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>Blocked Applications</Text>
        <Text style={styles.screenSubtitle}>
          Applications remotely restricted by Department Admin during class hours
        </Text>
      </View>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <VectorIcon name="info" size={16} color={colors.primary} />
        <Text style={styles.infoBannerText}>
          Restrictions are automatically enforced from 09:00 AM to 04:00 PM. Students have view-only access.
        </Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <VectorIcon name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search blocked application..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <Text style={styles.clearText} onPress={() => setSearchQuery('')}>
            Clear
          </Text>
        )}
      </View>

      <AppGridCard blockedApps={filteredBlocked} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 32,
  },
  screenHeader: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  screenSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },

  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 12,
    borderRadius: borderRadius.card,
    gap: 10,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  infoBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryDark,
    lineHeight: 16,
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginLeft: 8,
  },
  clearText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
});

export default AppsScreen;
