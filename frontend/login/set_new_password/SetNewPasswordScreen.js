import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
  TextInput,
  Alert,
} from 'react-native';
import colors from '../styles/colors';
import { LockIcon, EyeIcon, EyeOffIcon, InfoIcon, SuccessCheckIcon } from '../components/AuthIcons';
import PasswordStrengthMeter from './PasswordStrengthMeter';
import PasswordRequirements from './PasswordRequirements';
import authService from '../../services/authService';

export const SetNewPasswordScreen = ({ onPasswordUpdated, tempToken }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Validate requirements
  const isLengthValid = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);

  const allRulesSatisfied =
    isLengthValid && hasUppercase && hasLowercase && hasNumber && hasSpecial;

  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const canSubmit = allRulesSatisfied && passwordsMatch && !loading;

  // Inline Validation Message
  const validationMessage = useMemo(() => {
    if (!newPassword && !confirmPassword) return null;
    if (newPassword && !isLengthValid) return 'Password is too short (min. 8 characters).';
    if (newPassword && !allRulesSatisfied) return 'Password does not meet all security requirements below.';
    if (confirmPassword && !passwordsMatch) return 'Passwords do not match.';
    if (passwordsMatch && allRulesSatisfied) return 'All requirements met.';
    return null;
  }, [newPassword, confirmPassword, isLengthValid, allRulesSatisfied, passwordsMatch]);

  const handleUpdatePassword = async () => {
    if (!canSubmit) return;

    setLoading(true);
    try {
      await authService.changePasswordWithTempToken(tempToken, newPassword);
      setIsSuccess(true);
    } catch (err) {
      const msg = err?.message || 'Password update failed. Please try again.';
      if (err?.status === 401) {
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please log in again.',
          [{ text: 'OK', onPress: () => onPasswordUpdated && onPasswordUpdated() }]
        );
      } else {
        Alert.alert('Error', msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (onPasswordUpdated) {
      onPasswordUpdated();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formContainer}>
            {/* Header Section with Logo Badge */}
            <View style={styles.headerSection}>
              <View style={styles.logoBadgeContainer}>
                <Image
                  source={require('../assets/logo.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>

              <Text style={styles.headerTitle}>
                {isSuccess ? 'FocusSync' : 'Create Your Password'}
              </Text>
              <Text style={styles.headerDescription}>
                {isSuccess
                  ? 'Account Security & Access Control'
                  : 'For security reasons, you must create a new password before continuing.'}
              </Text>
            </View>

            {isSuccess ? (
              /* Success View State Card */
              <View style={styles.successCard}>
                <View style={styles.successIconBadge}>
                  <SuccessCheckIcon size={52} color="#22C55E" />
                </View>

                <Text style={styles.successTitle}>Password Updated Successfully</Text>

                <Text style={styles.successMessage}>
                  Your password has been updated successfully. You can now continue to the Department Mobile Controller.
                </Text>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleContinue}
                  style={styles.primaryButton}
                >
                  <Text style={styles.primaryButtonText}>Continue</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* Set New Password Form View */
              <View style={styles.formSection}>
                {/* Security Information Card */}
                <View style={styles.infoCard}>
                  <View style={styles.infoCardHeader}>
                    <InfoIcon size={18} color="#2563EB" />
                    <Text style={styles.infoCardTitle}>First-Time Account Setup</Text>
                  </View>
                  <Text style={styles.infoCardContent}>
                    You are currently signed in using a temporary password provided by the Department Administrator. Please create a new password that only you know.
                  </Text>
                </View>

                {/* Password Form Card */}
                <View style={styles.card}>
                  {/* New Password Input */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>New Password</Text>
                    <View style={styles.inputWrapper}>
                      <LockIcon size={18} color="#64748B" />
                      <TextInput
                        style={styles.textInput}
                        placeholder="Enter new password"
                        placeholderTextColor="#94A3B8"
                        secureTextEntry={!showNewPassword}
                        value={newPassword}
                        onChangeText={setNewPassword}
                        autoCapitalize="none"
                      />
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => setShowNewPassword(!showNewPassword)}
                        style={styles.eyeToggle}
                      >
                        {showNewPassword ? (
                          <EyeOffIcon size={16} color="#2563EB" />
                        ) : (
                          <EyeIcon size={16} color="#64748B" />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Password Strength Indicator */}
                  <PasswordStrengthMeter password={newPassword} />

                  {/* Confirm Password Input */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Confirm Password</Text>
                    <View style={styles.inputWrapper}>
                      <LockIcon size={18} color="#64748B" />
                      <TextInput
                        style={styles.textInput}
                        placeholder="Re-enter new password"
                        placeholderTextColor="#94A3B8"
                        secureTextEntry={!showConfirmPassword}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        autoCapitalize="none"
                      />
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={styles.eyeToggle}
                      >
                        {showConfirmPassword ? (
                          <EyeOffIcon size={16} color="#2563EB" />
                        ) : (
                          <EyeIcon size={16} color="#64748B" />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Password Requirements Checklist */}
                  <PasswordRequirements password={newPassword} />

                  {/* Inline Validation Message */}
                  {validationMessage && (
                    <View
                      style={[
                        styles.validationBadge,
                        allRulesSatisfied && passwordsMatch
                          ? styles.validationSuccess
                          : styles.validationError,
                      ]}
                    >
                      <Text
                        style={[
                          styles.validationText,
                          allRulesSatisfied && passwordsMatch
                            ? styles.textSuccess
                            : styles.textError,
                        ]}
                      >
                        {validationMessage}
                      </Text>
                    </View>
                  )}

                  {/* Update Password Primary Button */}
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={handleUpdatePassword}
                    disabled={!canSubmit}
                    style={[
                      styles.primaryButton,
                      !canSubmit && styles.buttonDisabled,
                    ]}
                  >
                    {loading ? (
                      <View style={styles.loadingRow}>
                        <ActivityIndicator size="small" color="#FFFFFF" />
                        <Text style={styles.primaryButtonText}>Updating Password...</Text>
                      </View>
                    ) : (
                      <Text style={styles.primaryButtonText}>Update Password</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Footer Section */}
            <View style={styles.footerSection}>
              <Text style={styles.footerText}>
                FocusSync System • Department Controller
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  formContainer: {
    width: '100%',
    maxWidth: 440,
  },

  // Header Section
  headerSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoBadgeContainer: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 6,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  headerDescription: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },

  // Info Card
  infoCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  infoCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  infoCardContent: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3B82F6',
    lineHeight: 18,
  },

  // Floating Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },

  // Form Inputs
  inputGroup: {
    marginVertical: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16, // 16px radius
    borderWidth: 1,
    borderColor: '#CBD5E1',
    height: 52,
    paddingHorizontal: 14,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginLeft: 8,
  },
  eyeToggle: {
    padding: 6,
  },

  // Inline Validation Badges
  validationBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  validationError: {
    backgroundColor: '#FEE2E2',
  },
  validationSuccess: {
    backgroundColor: '#DCFCE7',
  },
  validationText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  textError: {
    color: '#EF4444',
  },
  textSuccess: {
    color: '#15803D',
  },

  // Primary Button
  primaryButton: {
    width: '100%',
    backgroundColor: '#2563EB',
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  formSection: {
    width: '100%',
  },

  // Success View State Card
  successCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 22,
    paddingVertical: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 5,
  },
  successIconBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },

  // Footer Section
  footerSection: {
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
  },
});

export default SetNewPasswordScreen;
