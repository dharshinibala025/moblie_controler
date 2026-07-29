import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

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

  const iconName = iconType === 'email' ? 'mail-outline' : 'lock-outline';
  const iconColor = isFocused ? '#2563EB' : '#94A3B8';

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View
        style={[
          styles.inputWrapper,
          isFocused && styles.inputWrapperFocused,
          error && styles.inputWrapperError,
        ]}
      >
        {/* Left Material Icon */}
        <View style={styles.leftIconWrapper}>
          <MaterialIcons name={iconName} size={20} color={iconColor} />
        </View>

        {/* Text Input */}
        <TextInput
          style={styles.textInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          secureTextEntry={isPassword && !passwordVisible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />

        {/* Right Password Visibility Toggle Icon */}
        {isPassword && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setPasswordVisible(!passwordVisible)}
            style={styles.rightIconWrapper}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons
              name={passwordVisible ? 'visibility-off' : 'visibility'}
              size={20}
              color="#94A3B8"
            />
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
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
  },
  inputWrapperFocused: {
    borderColor: '#2563EB',
    borderWidth: 1.5,
  },
  inputWrapperError: {
    borderColor: '#EF4444',
  },
  leftIconWrapper: {
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightIconWrapper: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
    paddingVertical: 10,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
    marginLeft: 2,
  },
});

export default InputField;
