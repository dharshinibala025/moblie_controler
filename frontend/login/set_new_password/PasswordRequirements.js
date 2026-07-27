import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const PasswordRequirements = ({ password = '' }) => {
  const isLengthValid = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const satisfied = isLengthValid && hasUppercase && hasLowercase && hasNumber && hasSpecial;

  return (
    <View style={styles.container}>
      <Text
        style={[
          styles.hintText,
          satisfied ? styles.hintSuccess : password ? styles.hintWarning : styles.hintMuted,
        ]}
        numberOfLines={1}
      >
        {satisfied
          ? 'All password requirements met.'
          : 'Must be min. 8 characters with A-Z, a-z, 0-9 & special char.'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
    alignItems: 'center',
  },
  hintText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  hintMuted: {
    color: '#64748B',
  },
  hintWarning: {
    color: '#F97316',
  },
  hintSuccess: {
    color: '#15803D',
    fontWeight: '700',
  },
});

export default PasswordRequirements;
