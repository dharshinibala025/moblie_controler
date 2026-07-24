import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const PasswordStrengthMeter = ({ password = '' }) => {
  const calculateStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', color: '#E2E8F0' };

    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)) score++;

    if (score === 1) return { score: 1, label: 'Weak', color: '#EF4444' };
    if (score === 2) return { score: 2, label: 'Medium', color: '#F97316' };
    if (score === 3) return { score: 3, label: 'Strong', color: '#22C55E' };

    return { score: 1, label: 'Weak', color: '#EF4444' };
  };

  const { score, label, color } = calculateStrength(password);

  if (!password) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Password Strength</Text>
        <Text style={[styles.strengthLabel, { color }]}>{label}</Text>
      </View>

      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            {
              width: score === 1 ? '33%' : score === 2 ? '66%' : '100%',
              backgroundColor: color,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
  track: {
    height: 5,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
});

export default PasswordStrengthMeter;
