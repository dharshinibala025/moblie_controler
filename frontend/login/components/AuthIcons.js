import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Professional Material Style Vector Badge Icons (No Emojis)
export const StudentIcon = ({ size = 18, color = '#2563EB', active = false }) => (
  <View style={[styles.badge, active && { backgroundColor: color }]}>
    <Text style={[styles.badgeLabel, active ? styles.textActive : { color }]}>STD</Text>
  </View>
);

export const StaffIcon = ({ size = 18, color = '#2563EB', active = false }) => (
  <View style={[styles.badge, active && { backgroundColor: color }]}>
    <Text style={[styles.badgeLabel, active ? styles.textActive : { color }]}>STF</Text>
  </View>
);

export const AdminIcon = ({ size = 18, color = '#2563EB', active = false }) => (
  <View style={[styles.badge, active && { backgroundColor: color }]}>
    <Text style={[styles.badgeLabel, active ? styles.textActive : { color }]}>ADM</Text>
  </View>
);

export const LockIcon = ({ size = 16, color = '#64748B' }) => (
  <View style={[styles.iconContainer, { width: size * 1.2, height: size * 1.2 }]}>
    <Text style={{ fontSize: size * 0.75, color, fontWeight: '800' }}>🔒</Text>
  </View>
);

export const EyeIcon = ({ size = 16, color = '#64748B' }) => (
  <Text style={{ fontSize: size, color, fontWeight: '700' }}>SHOW</Text>
);

export const EyeOffIcon = ({ size = 16, color = '#64748B' }) => (
  <Text style={{ fontSize: size, color, fontWeight: '700' }}>HIDE</Text>
);

export const InfoIcon = ({ size = 20, color = '#2563EB' }) => (
  <View style={[styles.infoCircle, { width: size * 1.2, height: size * 1.2, borderRadius: (size * 1.2) / 2, borderColor: color }]}>
    <Text style={[styles.infoText, { color, fontSize: size * 0.7 }]}>i</Text>
  </View>
);

export const SuccessCheckIcon = ({ size = 64, color = '#22C55E' }) => (
  <View style={[styles.successCircle, { width: size, height: size, borderRadius: size / 2, backgroundColor: '#DCFCE7', borderColor: color }]}>
    <Text style={[styles.checkText, { color, fontSize: size * 0.45 }]}>✓</Text>
  </View>
);

export const CheckCircleIcon = ({ size = 16, satisfied = false }) => (
  <View style={[styles.smallCheck, { width: size, height: size, borderRadius: size / 2, backgroundColor: satisfied ? '#22C55E' : '#CBD5E1' }]}>
    <Text style={[styles.smallCheckText, { color: satisfied ? '#FFFFFF' : '#64748B', fontSize: size * 0.65 }]}>
      ✓
    </Text>
  </View>
);

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  textActive: {
    color: '#FFFFFF',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCircle: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.8,
    backgroundColor: '#EFF6FF',
  },
  infoText: {
    fontWeight: '800',
    fontStyle: 'italic',
  },
  successCircle: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    marginVertical: 14,
  },
  checkText: {
    fontWeight: '900',
  },
  smallCheck: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  smallCheckText: {
    fontWeight: '800',
    marginTop: -1,
  },
});

export default {
  StudentIcon,
  StaffIcon,
  AdminIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  InfoIcon,
  SuccessCheckIcon,
  CheckCircleIcon,
};
