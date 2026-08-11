import React, { useRef } from 'react';
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';

/**
 * Enterprise Primary Button
 * - Full width
 * - Height: 56px
 * - Border Radius: 14px
 * - Solid Primary Blue #2563EB (No gradient)
 * - Smooth press spring animation
 */
export const PrimaryButton = ({ title, onPress, loading = false, disabled = false }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.buttonWrapper,
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={[
          styles.button,
          disabled && styles.buttonDisabled,
        ]}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Signing In...' : title}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  buttonWrapper: {
    width: '100%',
    marginVertical: 14,
  },
  button: {
    height: 56,
    borderRadius: 14,
    backgroundColor: '#2563EB', // Primary Blue
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    backgroundColor: '#94A3B8',
  },
});

export default PrimaryButton;
