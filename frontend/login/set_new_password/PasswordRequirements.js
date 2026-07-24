import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CheckCircleIcon } from '../components/AuthIcons';

export const PasswordRequirements = ({ password = '' }) => {
  const requirements = [
    { label: 'Minimum 8 characters', satisfied: password.length >= 8 },
    { label: 'One uppercase letter', satisfied: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', satisfied: /[a-z]/.test(password) },
    { label: 'One number', satisfied: /[0-9]/.test(password) },
    { label: 'One special character', satisfied: /[^A-Za-z0-9]/.test(password) },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Password Requirements</Text>
      <View style={styles.list}>
        {requirements.map((req, index) => (
          <View key={index} style={styles.ruleRow}>
            <CheckCircleIcon size={16} satisfied={req.satisfied} />
            <Text
              style={[
                styles.ruleText,
                req.satisfied ? styles.ruleSatisfied : styles.ruleUnsatisfied,
              ]}
            >
              {req.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  list: {
    gap: 6,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ruleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  ruleSatisfied: {
    color: '#15803D',
  },
  ruleUnsatisfied: {
    color: '#64748B',
  },
});

export default PasswordRequirements;
