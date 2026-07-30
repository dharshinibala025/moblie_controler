import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  StatusBar,
} from 'react-native';
import VectorIcon from '../../student_dashboard/components/VectorIcon';
import { getStudentsForClass } from '../data/staffMockData';

const STATUSBAR_OFFSET = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 16;

export const StaffMonitorScreen = ({ staffData }) => {
  const [students, setStudents] = useState([]);

  useEffect(() => {
    if (staffData) {
      setStudents(getStudentsForClass(staffData.assignedClass));
    }
  }, [staffData]);

  const onlineCount = students.filter((s) => s.online).length;
  const offlineCount = students.filter((s) => !s.online).length;

  const getOnlineDot = (online) => ({
    backgroundColor: online ? '#10B981' : '#D1D5DB',
  });

  const getStatusStyle = (status) => {
    switch (status) {
      case 'active':
        return { bg: '#DCFCE7', text: '#16A34A', label: 'Active' };
      case 'blocked':
        return { bg: '#FEE2E2', text: '#DC2626', label: 'Blocked' };
      default:
        return { bg: '#F1F5F9', text: '#64748B', label: 'Offline' };
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titleText}>Monitor</Text>
        <Text style={styles.subtitleText}>
          {students.length} devices · {onlineCount} online · {offlineCount} offline
        </Text>
      </View>

      <View style={styles.liveIndicator}>
        <View style={styles.liveDot} />
        <Text style={styles.liveText}>Live</Text>
      </View>

      <ScrollView
        style={styles.listContainer}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {students.length === 0 ? (
          <View style={styles.emptyContainer}>
            <VectorIcon name="cellphone" size={40} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Devices</Text>
            <Text style={styles.emptySubtitle}>No devices to monitor in your class.</Text>
          </View>
        ) : (
          students.map((student) => {
            const statusStyle = getStatusStyle(student.status);

            return (
              <View key={student.id} style={styles.monitorCard}>
                <View style={styles.monitorHeader}>
                  <View style={styles.monitorLeft}>
                    <View style={[styles.onlineDot, getOnlineDot(student.online)]} />
                    <View>
                      <Text style={styles.monitorName}>{student.name}</Text>
                      <Text style={styles.monitorRoll}>{student.rollNo}</Text>
                    </View>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.statusPillText, { color: statusStyle.text }]}>
                      {statusStyle.label}
                    </Text>
                  </View>
                </View>

                <View style={styles.monitorDivider} />

                <View style={styles.monitorDetails}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>DEVICE</Text>
                    <Text style={styles.detailValue}>{student.device}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>STATUS</Text>
                    <Text style={styles.detailValue}>
                      {student.online ? 'Online' : 'Offline'}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>LAST SYNC</Text>
                    <Text style={styles.detailValue}>{student.lastSync}</Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: STATUSBAR_OFFSET,
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  titleText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  subtitleText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 2,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: 24,
    marginTop: 12,
    marginBottom: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  liveText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listContainer: {
    flex: 1,
    marginHorizontal: 24,
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  monitorCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    marginBottom: 10,
  },
  monitorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monitorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  monitorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  monitorRoll: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 1,
  },
  statusPill: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 999,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  monitorDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 10,
  },
  monitorDetails: {
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
});

export default StaffMonitorScreen;
