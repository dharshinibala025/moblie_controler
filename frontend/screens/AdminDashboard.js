import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import colors from '../login/styles/colors';
import api from '../services/api';

const AdminDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [stats, setStats] = useState({ students: 0, staff: 0, pending: 0 });
  const [rules, setRules] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: '', email: '', studentId: '', classId: '' });
  const [newStaff, setNewStaff] = useState({ name: '', email: '', employeeId: '', classId: '', password: '' });
  const [createdActivation, setCreatedActivation] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      const [usersData, pendingData, rulesData] = await Promise.all([
        api.get('/admin/users?limit=100'),
        api.get('/admin/users/pending'),
        api.get('/admin/rules'),
      ]);
      setUsers(usersData.users || []);
      setPendingUsers(pendingData.users || []);
      setRules(rulesData || []);

      const students = (usersData.users || []).filter((u) => u.role === 'student');
      const staff = (usersData.users || []).filter((u) => u.role === 'staff');
      setStats({
        students: students.length,
        staff: staff.length,
        pending: (pendingData.users || []).length,
      });
    } catch (error) {
      console.error('Fetch error:', error);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleAddStudent = async () => {
    if (!newStudent.name || !newStudent.email || !newStudent.studentId || !newStudent.classId) {
      Alert.alert('Error', 'All fields are required');
      return;
    }
    if (!newStudent.email.endsWith('@ksrce.ac.in')) {
      Alert.alert('Error', 'Email must be @ksrce.ac.in');
      return;
    }
    setLoading(true);
    try {
      const result = await api.post('/admin/users/student', newStudent);
      setCreatedActivation({ email: newStudent.email, code: result.activationCode, name: newStudent.name });
      setNewStudent({ name: '', email: '', studentId: '', classId: '' });
      setShowAddStudent(false);
      await fetchData();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to create student');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async () => {
    if (!newStaff.name || !newStaff.email || !newStaff.employeeId || !newStaff.classId || !newStaff.password) {
      Alert.alert('Error', 'All fields are required');
      return;
    }
    setLoading(true);
    try {
      await api.post('/admin/users/staff', newStaff);
      Alert.alert('Success', `Staff account created for ${newStaff.email}`);
      setNewStaff({ name: '', email: '', employeeId: '', classId: '', password: '' });
      setShowAddStaff(false);
      await fetchData();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to create staff');
    } finally {
      setLoading(false);
    }
  };

  const handleForceOffline = async (userId, userName) => {
    Alert.alert('Force Offline', `Force ${userName} offline?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Force Offline', style: 'destructive', onPress: async () => {
        try {
          await api.post(`/admin/users/${userId}/force-offline`);
          Alert.alert('Done', `${userName} has been forced offline`);
          await fetchData();
        } catch (error) {
          Alert.alert('Error', error.message);
        }
      }},
    ]);
  };

  const handleSuspend = async (userId, userName, currentStatus) => {
    const action = currentStatus === 'suspended' ? 'Unsuspend' : 'Suspend';
    Alert.alert(action, `${action} ${userName}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: action, style: currentStatus === 'suspended' ? 'default' : 'destructive', onPress: async () => {
        try {
          await api.post(`/admin/users/${userId}/suspend`);
          await fetchData();
        } catch (error) {
          Alert.alert('Error', error.message);
        }
      }},
    ]);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'suspended': return '#EF4444';
      case 'pending_activation': return '#F59E0B';
      default: return '#94A3B8';
    }
  };

  const renderOverview = () => (
    <>
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderLeftColor: '#7C3AED' }]}>
          <Text style={styles.statNumber}>{stats.students}</Text>
          <Text style={styles.statLabel}>Students</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: '#059669' }]}>
          <Text style={styles.statNumber}>{stats.staff}</Text>
          <Text style={styles.statLabel}>Staff</Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: '#F59E0B' }]}>
          <Text style={styles.statNumber}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Active Rules</Text>
        {rules.length === 0 ? (
          <Text style={styles.emptyText}>No rules configured yet</Text>
        ) : (
          rules.map((rule, index) => (
            <View key={rule._id || index} style={styles.ruleCard}>
              <View style={styles.ruleHeader}>
                <Text style={styles.ruleTitle}>Class: {rule.targetClassId}</Text>
                <View style={[styles.statusBadge, rule.status === 'active' ? styles.activeBadge : styles.inactiveBadge]}>
                  <Text style={styles.statusText}>{rule.status}</Text>
                </View>
              </View>
              <Text style={styles.ruleDetail}>Blocked: {rule.blockedApps?.length || 0} apps</Text>
            </View>
          ))
        )}
      </View>
    </>
  );

  const renderUsers = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>All Users</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddStudent(true)}>
            <Text style={styles.addBtnText}>+ Student</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.addBtn, styles.addBtnStaff]} onPress={() => setShowAddStaff(true)}>
            <Text style={styles.addBtnText}>+ Staff</Text>
          </TouchableOpacity>
        </View>
      </View>

      {pendingUsers.length > 0 && (
        <View style={styles.pendingSection}>
          <Text style={styles.pendingTitle}>Pending Activation ({pendingUsers.length})</Text>
          {pendingUsers.map((u) => (
            <View key={u._id} style={[styles.userCard, styles.pendingCard]}>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{u.name}</Text>
                <Text style={styles.userEmail}>{u.email}</Text>
                <Text style={styles.userId}>ID: {u.studentId}</Text>
              </View>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(u.status) }]} />
            </View>
          ))}
        </View>
      )}

      {users.filter((u) => u.role !== 'admin').map((u) => (
        <View key={u._id} style={styles.userCard}>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{u.name}</Text>
            <Text style={styles.userEmail}>{u.email}</Text>
            <View style={styles.userMeta}>
              <Text style={styles.userRole}>{u.role}</Text>
              <Text style={[styles.userStatus, { color: getStatusColor(u.status) }]}>{u.status}</Text>
            </View>
          </View>
          <View style={styles.userActions}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => handleForceOffline(u._id, u.name)}>
              <Text style={styles.actionBtnText}>Offline</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, u.status === 'suspended' ? styles.reactivateBtn : styles.suspendBtn]} onPress={() => handleSuspend(u._id, u.name, u.status)}>
              <Text style={[styles.actionBtnText, { color: u.status === 'suspended' ? '#10B981' : '#EF4444' }]}>
                {u.status === 'suspended' ? 'Activate' : 'Suspend'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Admin Dashboard</Text>
          <Text style={styles.email}>{user?.email || 'admin@ksrce.ac.in'}</Text>
        </View>
        <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tab, activeTab === 'overview' && styles.tabActive]} onPress={() => setActiveTab('overview')}>
          <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>Overview</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'users' && styles.tabActive]} onPress={() => setActiveTab('users')}>
          <Text style={[styles.tabText, activeTab === 'users' && styles.tabTextActive]}>Users</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'overview' ? renderOverview() : renderUsers()}

      {/* Add Student Modal */}
      <Modal visible={showAddStudent} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Student</Text>
            <TextInput style={styles.input} placeholder="Full Name" value={newStudent.name} onChangeText={(t) => setNewStudent({ ...newStudent, name: t })} />
            <TextInput style={styles.input} placeholder="email@ksrce.ac.in" value={newStudent.email} onChangeText={(t) => setNewStudent({ ...newStudent, email: t })} keyboardType="email-address" autoCapitalize="none" />
            <TextInput style={styles.input} placeholder="Student ID (e.g., STU001)" value={newStudent.studentId} onChangeText={(t) => setNewStudent({ ...newStudent, studentId: t })} />
            <TextInput style={styles.input} placeholder="Class ID (e.g., C101)" value={newStudent.classId} onChangeText={(t) => setNewStudent({ ...newStudent, classId: t })} />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddStudent(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleAddStudent} disabled={loading}>
                <Text style={styles.confirmBtnText}>{loading ? 'Creating...' : 'Create Student'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Staff Modal */}
      <Modal visible={showAddStaff} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Staff</Text>
            <TextInput style={styles.input} placeholder="Full Name" value={newStaff.name} onChangeText={(t) => setNewStaff({ ...newStaff, name: t })} />
            <TextInput style={styles.input} placeholder="email@ksrce.ac.in" value={newStaff.email} onChangeText={(t) => setNewStaff({ ...newStaff, email: t })} keyboardType="email-address" autoCapitalize="none" />
            <TextInput style={styles.input} placeholder="Employee ID (e.g., EMP001)" value={newStaff.employeeId} onChangeText={(t) => setNewStaff({ ...newStaff, employeeId: t })} />
            <TextInput style={styles.input} placeholder="Class ID (e.g., C101)" value={newStaff.classId} onChangeText={(t) => setNewStaff({ ...newStaff, classId: t })} />
            <TextInput style={styles.input} placeholder="Password (min 8 chars)" value={newStaff.password} onChangeText={(t) => setNewStaff({ ...newStaff, password: t })} secureTextEntry />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddStaff(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleAddStaff} disabled={loading}>
                <Text style={styles.confirmBtnText}>{loading ? 'Creating...' : 'Create Staff'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Activation Code Display */}
      <Modal visible={!!createdActivation} transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Student Created!</Text>
            <View style={styles.activationBox}>
              <Text style={styles.activationLabel}>Activation Code for {createdActivation?.name}:</Text>
              <Text style={styles.activationCode}>{createdActivation?.code}</Text>
              <Text style={styles.activationEmail}>Sent to: {createdActivation?.email}</Text>
            </View>
            <TouchableOpacity style={styles.confirmBtn} onPress={() => setCreatedActivation(null)}>
              <Text style={styles.confirmBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: '#2563EB' },
  greeting: { fontSize: 22, fontWeight: '700', color: '#FFFFFF' },
  email: { fontSize: 13, color: '#BFDBFE', marginTop: 2 },
  logoutBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8 },
  logoutText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  tabBar: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 3, borderBottomColor: '#2563EB' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  tabTextActive: { color: '#2563EB' },
  statsRow: { flexDirection: 'row', padding: 16, gap: 12 },
  statCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, alignItems: 'center', borderLeftWidth: 4, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  statNumber: { fontSize: 28, fontWeight: '800', color: '#2563EB' },
  statLabel: { fontSize: 12, color: '#64748B', marginTop: 4, fontWeight: '600' },
  section: { padding: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  buttonRow: { flexDirection: 'row', gap: 8 },
  addBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#7C3AED', borderRadius: 8 },
  addBtnStaff: { backgroundColor: '#059669' },
  addBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 13 },
  emptyText: { color: '#94A3B8', textAlign: 'center', paddingVertical: 20 },
  ruleCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, marginBottom: 10, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  ruleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ruleTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  activeBadge: { backgroundColor: '#D1FAE5' },
  inactiveBadge: { backgroundColor: '#F1F5F9' },
  statusText: { fontSize: 11, fontWeight: '600', color: '#065F46' },
  ruleDetail: { fontSize: 13, color: '#64748B', marginTop: 6 },
  pendingSection: { marginBottom: 16, padding: 12, backgroundColor: '#FFFBEB', borderRadius: 12, borderWidth: 1, borderColor: '#FDE68A' },
  pendingTitle: { fontSize: 14, fontWeight: '700', color: '#92400E', marginBottom: 8 },
  userCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, marginBottom: 8, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  pendingCard: { borderWidth: 1, borderColor: '#FDE68A' },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  userEmail: { fontSize: 12, color: '#64748B', marginTop: 2 },
  userId: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  userMeta: { flexDirection: 'row', gap: 8, marginTop: 4 },
  userRole: { fontSize: 11, fontWeight: '600', color: '#64748B', textTransform: 'uppercase', backgroundColor: '#F1F5F9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  userStatus: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  userActions: { flexDirection: 'row', gap: 6 },
  actionBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, backgroundColor: '#F1F5F9' },
  actionBtnText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  suspendBtn: { backgroundColor: '#FEF2F2' },
  reactivateBtn: { backgroundColor: '#ECFDF5' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 12, fontSize: 14, marginBottom: 10, backgroundColor: '#F8FAFC' },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  confirmBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: '#2563EB' },
  confirmBtnText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  activationBox: { backgroundColor: '#EFF6FF', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#BFDBFE' },
  activationLabel: { fontSize: 13, color: '#1E40AF', marginBottom: 8 },
  activationCode: { fontSize: 32, fontWeight: '800', color: '#1E40AF', letterSpacing: 6 },
  activationEmail: { fontSize: 12, color: '#64748B', marginTop: 8 },
});

export default AdminDashboard;
