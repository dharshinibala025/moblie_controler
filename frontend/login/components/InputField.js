import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import colors from '../styles/colors';
import typography from '../styles/typography';

/**
 * Custom SVG-like Vector Icons using React Native Views
 */
const MailIcon = ({ color }) => (
  <View style={iconStyles.iconContainer}>
    <View style={[iconStyles.mailBox, { borderColor: color }]}>
      <View style={[iconStyles.mailV, { borderBottomColor: color }]} />
    </View>
  </View>
);

const LockIcon = ({ color }) => (
  <View style={iconStyles.iconContainer}>
    <View style={[iconStyles.lockShackle, { borderColor: color }]} />
    <View style={[iconStyles.lockBody, { backgroundColor: color }]} />
  </View>
);

const EyeIcon = ({ visible, color }) => (
  <View style={iconStyles.iconContainer}>
    <View style={[iconStyles.eyeOuter, { borderColor: color }]}>
      <View style={[iconStyles.eyeInner, { backgroundColor: color }]} />
      {!visible && <View style={[iconStyles.eyeSlash, { backgroundColor: color }]} />}
    </View>
  </View>
);

export const InputField = ({
  label,
  value,
  onChangeText,
  placeholder,
  iconType, // 'email' | 'password'
  isPassword = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  error,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const iconColor = isFocused ? colors.primary : colors.textMuted;

  return (
    <View style={styles.container}>
      {label && <Text style={typography.inputLabel}>{label}</Text>}
      
      <View
        style={[
          styles.inputWrapper,
          isFocused && styles.inputWrapperFocused,
          error && styles.inputWrapperError,
        ]}
      >
        {/* Left Icon */}
        <View style={styles.leftIconWrapper}>
          {iconType === 'email' && <MailIcon color={iconColor} />}
          {iconType === 'password' && <LockIcon color={iconColor} />}
        </View>

        {/* Text Input */}
        <TextInput
          style={styles.textInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={isPassword && !passwordVisible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />

        {/* Right Password Toggle Icon */}
        {isPassword && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setPasswordVisible(!passwordVisible)}
            style={styles.rightIconWrapper}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <EyeIcon visible={passwordVisible} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 18,
    paddingHorizontal: 16,
    height: 56,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  inputWrapperFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.inputBgFocused,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  inputWrapperError: {
    borderColor: colors.error,
  },
  leftIconWrapper: {
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: 24,
  },
  rightIconWrapper: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '500',
    paddingVertical: 12,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
    marginLeft: 4,
  },
});

const iconStyles = StyleSheet.create({
  iconContainer: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mailBox: {
    width: 18,
    height: 13,
    borderWidth: 1.8,
    borderRadius: 3,
    justifyContent: 'flex-start',
    alignItems: 'center',
    overflow: 'hidden',
  },
  mailV: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderBottomWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderStyle: 'solid',
  },
  lockShackle: {
    width: 10,
    height: 9,
    borderWidth: 1.8,
    borderBottomWidth: 0,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    marginBottom: -1,
  },
  lockBody: {
    width: 16,
    height: 11,
    borderRadius: 3,
  },
  eyeOuter: {
    width: 18,
    height: 12,
    borderWidth: 1.8,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  eyeInner: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  eyeSlash: {
    position: 'absolute',
    width: 20,
    height: 2,
    transform: [{ rotate: '-45deg' }],
  },
});

export default InputField;
