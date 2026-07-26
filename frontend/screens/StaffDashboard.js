import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';

/**
 * StaffDashboard — Placeholder
 * Staff portal is managed via the web dashboard.
 * This screen informs the staff they should use the web interface.
 */
const StaffDashboard = ({ user, onLogout }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.container}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>👨‍🏫</Text>
        </View>
        <Text style={styles.title}>Staff Portal</Text>
        <Text style={styles.subtitle}>
          Welcome, {user?.name || 'Staff Member'}.{'\n'}
          The Staff Dashboard is accessible via the web portal.{'\n'}
          This mobile app is intended for student use.
        </Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Role</Text>
          <Text style={styles.infoValue}>Staff / HOD</Text>
          <View style={styles.divider} />
          <Text style={styles.infoLabel}>Employee ID</Text>
          <Text style={styles.infoValue}>{user?.employeeId || 'N/A'}</Text>
          <View style={styles.divider} />
          <Text style={styles.infoLabel}>Institution</Text>
          <Text style={styles.infoValue}>{user?.institutionId || 'KSRCE'}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout} activeOpacity={0.8}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
    backgroundColor: '#FFFFFF',
  },
  badge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  badgeText: {
    fontSize: 36,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  infoCard: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 28,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginBottom: 12,
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 16,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default StaffDashboard;
