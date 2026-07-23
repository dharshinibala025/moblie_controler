import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import api from '../services/api';

const StaffDashboard = ({ user, onLogout }) => {
  const [liveData, setLiveData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      if (user?.classId) {
        const data = await api.get(`/staff/classes/${user.classId}/live`);
        setLiveData(data);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome, Staff</Text>
          <Text style={styles.classInfo}>Class: {user?.classId || 'N/A'}</Text>
        </View>
        <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Class Live Status</Text>
        {liveData ? (
          <View style={styles.liveCard}>
            <View style={styles.liveRow}>
              <Text style={styles.liveLabel}>Online Students</Text>
              <Text style={styles.liveValue}>{liveData.onlineCount || 0}</Text>
            </View>
            <View style={styles.liveRow}>
              <Text style={styles.liveLabel}>Total Students</Text>
              <Text style={styles.liveValue}>{liveData.totalStudents || 0}</Text>
            </View>
            <View style={styles.liveRow}>
              <Text style={styles.liveLabel}>Active Rule</Text>
              <Text style={styles.liveValue}>{liveData.activeRule ? 'Yes' : 'None'}</Text>
            </View>
          </View>
        ) : (
          <Text style={styles.emptyText}>Loading live status...</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity style={styles.actionBtn} onPress={() => Alert.alert('Coming Soon', 'Student activity view will be available soon.')}>
          <Text style={styles.actionText}>View Student Activity</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#059669',
  },
  greeting: { fontSize: 22, fontWeight: '700', color: '#FFFFFF' },
  classInfo: { fontSize: 13, color: '#D1FAE5', marginTop: 2 },
  logoutBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
  },
  logoutText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 12 },
  liveCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  liveRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  liveLabel: { fontSize: 14, color: '#64748B' },
  liveValue: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  emptyText: { color: '#94A3B8', textAlign: 'center', paddingVertical: 20 },
  actionBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  actionText: { fontSize: 15, fontWeight: '600', color: '#2563EB' },
});

export default StaffDashboard;
