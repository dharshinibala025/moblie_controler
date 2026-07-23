import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';

const StudentDashboard = ({ user }) => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome, {user?.name || 'Student'}</Text>
          <Text style={styles.classInfo}>Class: {user?.classId || 'N/A'} | ID: {user?.studentId || 'N/A'}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Device Status</Text>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, styles.statusOnline]} />
          <Text style={styles.statusText}>Device Monitoring Active</Text>
        </View>
        <Text style={styles.statusNote}>Your device is being monitored during class hours as per institutional policy.</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What You Can Do</Text>

        <View style={styles.actionCard}>
          <Text style={styles.actionIcon}>📱</Text>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>App Scan</Text>
            <Text style={styles.actionDesc}>Your installed apps are scanned automatically for compliance</Text>
          </View>
        </View>

        <View style={styles.actionCard}>
          <Text style={styles.actionIcon}>📊</Text>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Usage Tracking</Text>
            <Text style={styles.actionDesc}>App usage is monitored during class hours</Text>
          </View>
        </View>

        <View style={styles.actionCard}>
          <Text style={styles.actionIcon}>📋</Text>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Class Rules</Text>
            <Text style={styles.actionDesc}>View current classroom restrictions set by your teacher</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>Need Help?</Text>
          <Text style={styles.contactText}>
            Contact your institution Administrator for any account issues, password reset, or access concerns.
          </Text>
          <Text style={styles.contactEmail}>admin@ksrce.ac.in</Text>
        </View>
      </View>

      <View style={styles.footerSpace} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, paddingTop: 50, backgroundColor: '#7C3AED',
  },
  greeting: { fontSize: 22, fontWeight: '700', color: '#FFFFFF' },
  classInfo: { fontSize: 13, color: '#DDD6FE', marginTop: 2 },
  card: {
    margin: 16, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20,
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 12 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusOnline: { backgroundColor: '#10B981' },
  statusText: { fontSize: 14, color: '#065F46', fontWeight: '600' },
  statusNote: { fontSize: 12, color: '#64748B', marginTop: 8, lineHeight: 16 },
  section: { padding: 16, paddingTop: 0 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 12 },
  actionCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 14,
    padding: 16, marginBottom: 10,
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2, gap: 14,
  },
  actionIcon: { fontSize: 28 },
  actionContent: { flex: 1 },
  actionTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  actionDesc: { fontSize: 12, color: '#64748B', marginTop: 2 },
  contactCard: {
    backgroundColor: '#F0F9FF', borderRadius: 14, padding: 18, borderWidth: 1, borderColor: '#BAE6FD',
  },
  contactTitle: { fontSize: 15, fontWeight: '700', color: '#0369A1', marginBottom: 6 },
  contactText: { fontSize: 13, color: '#0C4A6E', lineHeight: 18, marginBottom: 8 },
  contactEmail: { fontSize: 13, fontWeight: '700', color: '#0284C7' },
  footerSpace: { height: 40 },
});

export default StudentDashboard;
