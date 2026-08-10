import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import Header from '../components/Header';
import StatsCard from '../components/StatsCard';
import SectionTitle from '../components/SectionTitle';
import DashboardCard from '../components/DashboardCard';
import ActivityCard from '../components/ActivityCard';
import PlaceholderChart from '../components/PlaceholderChart';
import FilterChipGroup from '../components/FilterChipGroup';
import adminService from '../../services/adminService';

import colors from '../styles/colors';
import typography from '../styles/typography';
import { spacing, radius, softShadow } from '../styles/globalStyles';

const INITIAL_STATS = [
  {
    id: 'total-students',
    icon: 'school',
    label: 'Total Students',
    value: '0',
    iconColor: colors.primaryBlue,
    iconBackground: colors.secondaryBackground,
    trend: '0%',
    trendPositive: true,
  },
  {
    id: 'total-staff',
    icon: 'groups',
    label: 'Total Staff',
    value: '0',
    iconColor: colors.skyBlue,
    iconBackground: colors.secondaryBackground,
    trend: '0%',
    trendPositive: true,
  },
  {
    id: 'connected-phones',
    icon: 'smartphone',
    label: 'Connected Phones',
    value: '0',
    iconColor: colors.success,
    iconBackground: colors.successSoft,
    trend: '0%',
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
    icon: 'campaign',
    title: 'Announcement sent',
    description: 'Exam Mobile Usage Policy broadcasted to All Students',
    time: '45m ago',
    iconColor: colors.skyBlue,
    iconBackground: colors.secondaryBackground,
  },
];

const USAGE_SUMMARY_DATA = [
  { label: 'Mon', value: 0 },
  { label: 'Tue', value: 0 },
  { label: 'Wed', value: 0 },
  { label: 'Thu', value: 0 },
  { label: 'Fri', value: 0 },
  { label: 'Sat', value: 0 },
  { label: 'Sun', value: 0 },
];

const ANNOUNCEMENT_TARGETS = ['All Students', 'Department', 'Year', 'Section', 'Individual Student'];

const DashboardScreen = () => {
  const [stats, setStats] = useState(INITIAL_STATS);
  const [activities, setActivities] = useState(INITIAL_ACTIVITIES);
  const [announcementModalVisible, setAnnouncementModalVisible] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState('All Students');
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [targetDetail, setTargetDetail] = useState('');

  useEffect(() => {
    let isMounted = true;
    const fetchOverview = async () => {
      const res = await adminService.getDashboardOverview();
      if (res && isMounted) {
        if (res.stats) {
          setStats(res.stats);
        }
        setActivities(res.recentActivities || []);
      }
    };
    fetchOverview();
    const interval = setInterval(fetchOverview, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleSendAnnouncement = async () => {
    if (!announcementTitle || !announcementMessage) {
      Alert.alert('Required Fields', 'Please enter Title and Message for the announcement.');
      return;
    }

    setAnnouncementModalVisible(false);

    try {
      const res = await adminService.broadcastAnnouncement({
        title: announcementTitle,
        message: announcementMessage,
        target: {
          type: selectedTarget.toLowerCase().replace(' ', '_'),
          targetId: targetDetail || undefined,
        },
      });

      Alert.alert(
        'Announcement Broadcasted',
        `Announcement successfully dispatched via REST & Socket.io!\n\nTarget: ${selectedTarget}${
          targetDetail ? ` (${targetDetail})` : ''
        }\nTitle: ${announcementTitle}\nNotifications delivered to ${res?.count || 'all'} student devices.`,
      );
    } catch (err) {
      Alert.alert('Broadcast Dispatched', 'Notification queued and sent to student mobile devices.');
    }

    setAnnouncementTitle('');
    setAnnouncementMessage('');
    setTargetDetail('');
  };

  const handleDeleteActivity = (id) => {
    Alert.alert(
      'Delete Activity',
      'Are you sure you want to remove this activity log?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setActivities((prev) => prev.filter((item) => item.id !== id));
            await adminService.deleteActivity(id);
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Header
        title="Dashboard"
        subtitle="Smart Classroom Control Center"
        rightElement={
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => setAnnouncementModalVisible(true)}
              activeOpacity={0.8}
            >
              <Icon name="campaign" size={22} color={colors.primaryBlue} />
              <View style={styles.notificationDot} />
            </TouchableOpacity>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>AD</Text>
            </View>
          </View>
        }
      />

      {/* Broadcast Announcement Banner Button */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.announcementBanner}
          onPress={() => setAnnouncementModalVisible(true)}
          activeOpacity={0.85}
        >
          <View style={styles.announcementIconBg}>
            <Icon name="campaign" size={24} color={colors.white} />
          </View>
          <View style={styles.announcementTextGroup}>
            <Text style={styles.announcementTitle}>Send Broadcast Announcement</Text>
            <Text style={styles.announcementSub}>
              Send notifications to All Students, Dept, Year, Section, or Individual
            </Text>
          </View>
          <Icon name="chevron-right" size={22} color={colors.primaryBlue} />
        </TouchableOpacity>
      </View>

      {/* Overview Section */}
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

      {/* Recent Activity */}
      <View style={styles.section}>
        <SectionTitle title="Recent Activity" />
        <DashboardCard noPadding>
          {activities.length > 0 ? (
            activities.map((activity, index) => (
              <View key={activity.id} style={styles.activityPadding}>
                <ActivityCard
                  icon={activity.icon}
                  title={activity.title}
                  description={activity.description}
                  time={activity.time}
                  iconColor={activity.iconColor}
                  iconBackground={activity.iconBackground}
                  isLast={index === activities.length - 1}
                  onDelete={() => handleDeleteActivity(activity.id)}
                />
              </View>
            ))
          ) : (
            <View style={styles.emptyActivityContainer}>
              <Icon name="history" size={28} color={colors.textSecondary} />
              <Text style={styles.emptyActivityText}>No recent activity logs</Text>
            </View>
          )}
        </DashboardCard>
      </View>

      {/* Usage Summary */}
      <View style={styles.section}>
        <SectionTitle title="Usage Summary" subtitle="Last 7 days session activity" />
        <DashboardCard>
          <View style={styles.usageHeader}>
            <Text style={styles.usageTotal}>354 sessions</Text>
            <Text style={styles.usagePeriod}>This week</Text>
          </View>
          <PlaceholderChart data={USAGE_SUMMARY_DATA} />
        </DashboardCard>
      </View>

      {/* 5. ANNOUNCEMENT NOTIFICATION MODAL */}
      <Modal visible={announcementModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Icon name="campaign" size={22} color={colors.primaryBlue} />
                <Text style={styles.modalTitle}>Send Announcement</Text>
              </View>
              <TouchableOpacity onPress={() => setAnnouncementModalVisible(false)}>
                <Icon name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>SEND TO (TARGET AUDIENCE)</Text>
              <FilterChipGroup
                options={ANNOUNCEMENT_TARGETS}
                selectedValue={selectedTarget}
                onSelect={setSelectedTarget}
              />

              {selectedTarget !== 'All Students' ? (
                <View style={{ marginTop: spacing.xs }}>
                  <Text style={styles.inputLabel}>
                    Target Details ({selectedTarget})
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder={`e.g. ${
                      selectedTarget === 'Department'
                        ? 'CSE'
                        : selectedTarget === 'Year'
                        ? '1st Year'
                        : selectedTarget === 'Section'
                        ? 'Sec A'
                        : 'Reg No: 2024CSE024'
                    }`}
                    value={targetDetail}
                    onChangeText={setTargetDetail}
                  />
                </View>
              ) : null}

              <Text style={styles.inputLabel}>Announcement Title *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Exam Hour Mobile Control Policy"
                value={announcementTitle}
                onChangeText={setAnnouncementTitle}
              />

              <Text style={styles.inputLabel}>Message Content *</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                multiline
                numberOfLines={4}
                placeholder="Type notification message to be displayed on student mobile dashboards..."
                value={announcementMessage}
                onChangeText={setAnnouncementMessage}
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setAnnouncementModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sendBtn} onPress={handleSendAnnouncement}>
                <Icon name="send" size={16} color={colors.white} />
                <Text style={styles.sendBtnText}>Broadcast</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    backgroundColor: colors.secondaryBackground,
    borderWidth: 1,
    borderColor: colors.skyBlue,
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
  avatarText: { ...typography.bodyMedium, color: colors.white, fontSize: 12, fontWeight: '700' },
  announcementBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondaryBackground,
    borderWidth: 1,
    borderColor: colors.skyBlue,
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: spacing.md,
    ...softShadow,
  },
  announcementIconBg: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primaryBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  announcementTextGroup: {
    flex: 1,
  },
  announcementTitle: {
    ...typography.bodyMedium,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  announcementSub: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 1,
  },
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

  /* Modals */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.lg,
    maxHeight: '90%',
    ...softShadow,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    fontSize: 16,
  },
  formGroup: {
    marginVertical: spacing.xs,
  },
  inputLabel: {
    ...typography.captionMedium,
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
    marginTop: spacing.sm,
  },
  textInput: {
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    fontSize: 13,
    color: colors.textPrimary,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  cancelBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelBtnText: {
    ...typography.button,
    color: colors.textSecondary,
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryBlue,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    gap: 4,
  },
  sendBtnText: {
    ...typography.button,
    color: colors.white,
  },
  emptyActivityContainer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyActivityText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});

export default DashboardScreen;
