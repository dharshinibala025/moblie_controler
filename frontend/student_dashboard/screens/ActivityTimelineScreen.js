import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
  StatusBar,
} from 'react-native';
import { colors, shadows, borderRadius } from '../styles/theme';
import VectorIcon from '../components/VectorIcon';

const STATUSBAR_OFFSET = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 16;

export const ActivityTimelineScreen = ({ activities = [], onBack, onRefresh, refreshing }) => {
  const formatTime = (timeStr) => timeStr || '';

  const getActivityStyle = (type) => {
    const isBlocked = type === 'blocked';
    return {
      iconName: isBlocked ? 'lock' : 'lock-open',
      iconColor: isBlocked ? colors.blocked : colors.active,
      iconBg: isBlocked ? colors.blockedLight : colors.activeLight,
    };
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
    >
      {/* Back Navigation Header */}
      <View style={styles.screenHeader}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <VectorIcon name="chevron-left" size={22} color={colors.primary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Activity Timeline</Text>
        <Text style={styles.screenSubtitle}>
          Full history of restriction events on your device
        </Text>
      </View>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <VectorIcon name="clock-outline" size={16} color={colors.primary} />
        <Text style={styles.infoBannerText}>
          Showing all recent app usage and restriction events recorded on your device.
        </Text>
      </View>

      {activities.length === 0 ? (
        <View style={styles.emptyCard}>
          <VectorIcon name="clock-outline" size={36} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No Activity Yet</Text>
          <Text style={styles.emptyText}>
            Activity events will appear here once your device starts syncing usage data.
          </Text>
        </View>
      ) : (
        <View style={styles.card}>
          {activities.map((item, index) => {
            const { iconName, iconColor, iconBg } = getActivityStyle(item.type);

            return (
              <React.Fragment key={item.id || index}>
                {index > 0 && <View style={styles.divider} />}
                <View style={styles.activityRow}>
                  {/* Timeline connector */}
                  <View style={styles.timelineConnector}>
                    <View style={[styles.iconWrapper, { backgroundColor: iconBg }]}>
                      <VectorIcon name={iconName} size={18} color={iconColor} />
                    </View>
                    {index < activities.length - 1 && (
                      <View style={styles.connectorLine} />
                    )}
                  </View>

                  {/* Event content */}
                  <View style={styles.eventContent}>
                    <View style={styles.eventHeader}>
                      <Text style={styles.eventTitle}>{item.title}</Text>
                      <Text style={styles.eventTime}>{formatTime(item.time)}</Text>
                    </View>
                    <Text style={styles.eventDetails}>{item.details}</Text>
                    <View style={[styles.typePill, { backgroundColor: iconBg }]}>
                      <Text style={[styles.typePillText, { color: iconColor }]}>
                        {item.type === 'blocked' ? 'Blocked Attempt' : 'App Usage'}
                      </Text>
                    </View>
                  </View>
                </View>
              </React.Fragment>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingTop: STATUSBAR_OFFSET,
    paddingBottom: 40,
  },
  screenHeader: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    gap: 4,
  },
  backText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.card,
    padding: 16,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
  },
  activityRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    gap: 12,
  },
  timelineConnector: {
    alignItems: 'center',
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectorLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.borderLight,
    marginTop: 4,
  },
  eventContent: {
    flex: 1,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  eventTime: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    marginLeft: 8,
  },
  eventDetails: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  typePill: {
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  typePillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.card,
    padding: 32,
    alignItems: 'center',
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default ActivityTimelineScreen;
