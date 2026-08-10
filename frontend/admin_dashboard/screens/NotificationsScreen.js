import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Header from '../components/Header';
import SectionTitle from '../components/SectionTitle';
import SearchBar from '../components/SearchBar';
import FilterChipGroup from '../components/FilterChipGroup';
import SelectDropdown from '../components/SelectDropdown';

import colors from '../styles/colors';
import typography from '../styles/typography';
import { spacing, radius, softShadow } from '../styles/globalStyles';
import adminService from '../../services/adminService';

const ANNOUNCEMENT_TARGETS = ['All Students', 'Department', 'Year', 'Section', 'Individual Student'];

const NotificationsScreen = ({ onBack }) => {
  const [notifications, setNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');

  // Announcement Modal State
  const [announcementModalVisible, setAnnouncementModalVisible] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState('All Students');
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [targetDetail, setTargetDetail] = useState('');

  // Detail Modal State
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const loadNotifications = async () => {
    try {
      const data = await adminService.getAdminNotifications();
      setNotifications(data || []);
    } catch (err) {
      try {
        const staffService = require('../../services/staffService').default;
        const staffData = await staffService.fetchStaffNotifications();
        setNotifications(staffData || []);
      } catch (staffErr) {
        console.warn('Failed to load staff notifications:', staffErr);
      }
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const filteredList = notifications.filter((item) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      (item.title || '').toLowerCase().includes(q) ||
      (item.message || '').toLowerCase().includes(q) ||
      (item.target || '').toLowerCase().includes(q);

    if (filterType === 'Broadcasts') return matchesSearch && item.type === 'Broadcast';
    if (filterType === 'Alerts') return matchesSearch && (item.type === 'System Alert' || item.type === 'Device Warning');
    return matchesSearch;
  });

  const handleSendAnnouncement = async () => {
    if (!announcementTitle || !announcementMessage) {
      Alert.alert('Required Fields', 'Please enter Title and Message for the broadcast.');
      return;
    }

    try {
      await adminService.broadcastAnnouncement({
        title: announcementTitle,
        message: announcementMessage,
        target: {
          type: selectedTarget.toLowerCase().replace(' ', '_'),
          targetId: targetDetail || undefined,
        },
      });
      Alert.alert('Broadcast Sent', 'Notification dispatched to student devices.');
      setAnnouncementTitle('');
      setAnnouncementMessage('');
      setTargetDetail('');
      setAnnouncementModalVisible(false);
      loadNotifications();
    } catch (err) {
      Alert.alert('Error', 'Failed to dispatch broadcast: ' + err.message);
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Notification', 'Remove this notification record?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setNotifications((prev) => prev.filter((n) => n.id !== id));
          try {
            await adminService.deleteAdminNotification(id);
          } catch (err) {
            console.warn('Failed to delete notification:', err.message);
          }
        },
      },
    ]);
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await adminService.markAllNotificationsRead();
    } catch (err) {
      console.warn('Failed to mark notifications read:', err.message);
    }
  };

  return (
    <View style={styles.flex}>
      <Header
        title="Notifications"
        subtitle="Broadcast announcements & system log alerts"
        rightElement={
          <View style={styles.headerRight}>
            {onBack ? (
              <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.8}>
                <Icon name="arrow-back" size={18} color={colors.primaryBlue} />
                <Text style={styles.backBtnText}>Dashboard</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        }
      />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >


        <View style={styles.section}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search notifications by title or target"
          />
        </View>

        <View style={styles.filterRow}>
          <FilterChipGroup
            options={['All', 'Broadcasts', 'Alerts']}
            selectedValue={filterType}
            onSelect={setFilterType}
          />
        </View>

        {/* Notifications List */}
        <View style={styles.section}>
          <SectionTitle
            title={`All Notifications (${filteredList.length})`}
            subtitle="Recent broadcast dispatches and automated alerts"
          />

          {filteredList.length === 0 ? (
            <Text style={styles.emptyText}>No notifications found.</Text>
          ) : (
            filteredList.map((item) => (
              <View
                key={item.id}
                style={[styles.notifCard, !item.isRead && styles.unreadCard]}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.iconBox, { backgroundColor: item.iconBg }]}>
                    <Icon name={item.icon} size={20} color={item.iconColor} />
                  </View>
                  <View style={styles.cardHeaderInfo}>
                    <View style={styles.titleRow}>
                      <Text style={styles.notifTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      {!item.isRead ? <View style={styles.unreadDot} /> : null}
                    </View>
                    <Text style={styles.notifMeta}>
                      Target: {item.target} &middot; {item.time}
                    </Text>
                  </View>
                </View>

                <Text style={styles.notifMessage} numberOfLines={2}>
                  {item.message}
                </Text>

                <View style={styles.cardFooter}>
                  <View style={styles.deliveryBadge}>
                    <Icon name="check-circle" size={13} color={colors.success} />
                    <Text style={styles.deliveryText}>
                      Delivered ({item.deliveredCount})
                    </Text>
                  </View>

                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => {
                        setSelectedItem(item);
                        setDetailModalVisible(true);
                      }}
                      activeOpacity={0.7}
                    >
                      <Icon name="visibility" size={14} color={colors.primaryBlue} />
                      <Text style={[styles.actionBtnText, { color: colors.primaryBlue }]}>
                        View
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionBtn, styles.deleteBtn]}
                      onPress={() => handleDelete(item.id)}
                      activeOpacity={0.7}
                    >
                      <Icon name="delete-outline" size={14} color={colors.danger} />
                      <Text style={[styles.actionBtnText, { color: colors.danger }]}>
                        Delete
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Broadcast Modal */}
      {announcementModalVisible ? (
        <Modal
          visible={announcementModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setAnnouncementModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setAnnouncementModalVisible(false)}
          >
            <TouchableOpacity style={styles.modalContent} activeOpacity={1}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Broadcast Announcement</Text>
                <TouchableOpacity onPress={() => setAnnouncementModalVisible(false)}>
                  <Icon name="close" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <SelectDropdown
                label="Target Audience"
                value={selectedTarget}
                options={ANNOUNCEMENT_TARGETS}
                onSelect={setSelectedTarget}
                icon="people"
              />

              {selectedTarget !== 'All Students' ? (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    Target Details (e.g. CSE / 1st Year / Sec A)
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={targetDetail}
                    onChangeText={setTargetDetail}
                    placeholder="Enter section or student ID"
                  />
                </View>
              ) : null}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Title</Text>
                <TextInput
                  style={styles.input}
                  value={announcementTitle}
                  onChangeText={setAnnouncementTitle}
                  placeholder="e.g. Exam Mobile Restriction Notice"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Message</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={announcementMessage}
                  onChangeText={setAnnouncementMessage}
                  placeholder="Write your broadcast announcement message here..."
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setAnnouncementModalVisible(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.sendBtn}
                  onPress={handleSendAnnouncement}
                >
                  <Icon name="send" size={16} color={colors.white} />
                  <Text style={styles.sendBtnText}>Dispatch Broadcast</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      ) : null}

      {/* Details View Modal */}
      {detailModalVisible && selectedItem ? (
        <Modal
          visible={detailModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setDetailModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setDetailModalVisible(false)}
          >
            <TouchableOpacity style={styles.modalContent} activeOpacity={1}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Notification Details</Text>
                <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                  <Icon name="close" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.detailHeaderBox}>
                <View style={[styles.iconBox, { backgroundColor: selectedItem.iconBg }]}>
                  <Icon name={selectedItem.icon} size={22} color={selectedItem.iconColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailTitle}>{selectedItem.title}</Text>
                  <Text style={styles.detailMeta}>
                    Type: {selectedItem.type} &middot; {selectedItem.time}
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Target Audience:</Text>
                <Text style={styles.detailVal}>{selectedItem.target}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Delivery Status:</Text>
                <Text style={styles.detailVal}>
                  Delivered to {selectedItem.deliveredCount} device(s)
                </Text>
              </View>

              <View style={styles.detailMsgBox}>
                <Text style={styles.detailMsgLabel}>Message Content:</Text>
                <Text style={styles.detailMsgText}>{selectedItem.message}</Text>
              </View>

              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setDetailModalVisible(false)}
              >
                <Text style={styles.closeBtnText}>Close</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: spacing.xxxl },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: radius.md,
    gap: 4,
  },
  backBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryBlue,
  },
  section: { paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  broadcastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryBlue,
    borderRadius: radius.xl,
    padding: spacing.md,
    ...softShadow,
  },
  broadcastBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  broadcastBannerText: { flex: 1 },
  broadcastBannerTitle: { ...typography.bodyMedium, color: colors.white, fontWeight: '700' },
  broadcastBannerSubtitle: { ...typography.caption, color: '#DBEAFE', marginTop: 2 },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  markReadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  markReadText: { fontSize: 11, fontWeight: '600', color: colors.primaryBlue },
  emptyText: { ...typography.body, color: colors.textMuted, marginTop: spacing.md },
  notifCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...softShadow,
  },
  unreadCard: {
    borderColor: '#BFDBFE',
    backgroundColor: '#F8FAFC',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  cardHeaderInfo: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  notifTitle: { ...typography.bodyMedium, fontWeight: '700', color: colors.textPrimary, flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primaryBlue, marginLeft: 6 },
  notifMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 1 },
  notifMessage: { ...typography.caption, color: colors.textMuted, marginVertical: spacing.xs, lineHeight: 18 },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  deliveryBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  deliveryText: { fontSize: 11, fontWeight: '600', color: colors.success },
  cardActions: { flexDirection: 'row', gap: spacing.xs },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    gap: 4,
  },
  deleteBtn: { borderColor: '#FCA5A5', backgroundColor: colors.dangerSoft },
  actionBtnText: { fontSize: 11, fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.lg,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  modalTitle: { ...typography.h2, color: colors.textPrimary },
  inputGroup: { marginTop: spacing.md },
  inputLabel: { ...typography.captionMedium, color: colors.textSecondary, marginBottom: 4 },
  input: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: colors.textPrimary,
  },
  textArea: { height: 90, textAlignVertical: 'top' },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  cancelBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  cancelBtnText: { ...typography.button, color: colors.textSecondary },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryBlue,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    gap: 6,
  },
  sendBtnText: { ...typography.button, color: colors.white },
  detailHeaderBox: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  detailTitle: { ...typography.bodyMedium, fontWeight: '700', color: colors.textPrimary },
  detailMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  detailRow: { flexDirection: 'row', marginVertical: 4 },
  detailLabel: { width: 120, fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  detailVal: { flex: 1, fontSize: 12, color: colors.textPrimary, fontWeight: '500' },
  detailMsgBox: {
    marginTop: spacing.md,
    backgroundColor: colors.secondaryBackground,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  detailMsgLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, marginBottom: 4 },
  detailMsgText: { fontSize: 13, color: colors.textPrimary, lineHeight: 19 },
  closeBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.primaryBlue,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  closeBtnText: { ...typography.button, color: colors.white },
});

export default NotificationsScreen;
