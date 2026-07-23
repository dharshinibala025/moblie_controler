import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  TouchableOpacity,
  Animated,
  StatusBar,
  SafeAreaView,
  Alert,
} from 'react-native';
import colors from '../styles/colors';
import typography from '../styles/typography';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import authService from '../../services/authService';

const ActivationScreen = ({ onBack, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [activationCode, setActivationCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [errors, setErrors] = useState({});
  const codeRefs = useRef([]);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }).start();
  }, []);

  const handleCheckEmail = async () => {
    if (!email.trim() || !email.endsWith('@ksrce.ac.in')) {
      setErrors({ email: 'Please enter a valid @ksrce.ac.in email' });
      return;
    }
    setLoading(true);
    try {
      const result = await authService.checkActivation(email);
      setStudentName(result.name);
      setStep(2);
      setErrors({});
    } catch (error) {
      Alert.alert('Error', error.message || 'Account not found or already activated');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (text, index) => {
    const newCode = [...activationCode];
    newCode[index] = text;
    setActivationCode(newCode);
    if (text && index < 5) {
      codeRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !activationCode[index] && index > 0) {
      codeRefs.current[index - 1]?.focus();
      const newCode = [...activationCode];
      newCode[index - 1] = '';
      setActivationCode(newCode);
    }
  };

  const handleActivate = async () => {
    const code = activationCode.join('');
    if (code.length !== 6) {
      Alert.alert('Error', 'Please enter the complete 6-digit activation code');
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setErrors({ newPassword: 'Password must be at least 8 characters' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }

    setLoading(true);
    try {
      const result = await authService.activateAccount(email, code, newPassword);
      if (result.token) {
        const userData = authService.parseToken(result.token);
        Alert.alert('Success', 'Account activated successfully!', [
          { text: 'OK', onPress: () => onSuccess({ token: result.token, user: userData }) },
        ]);
      }
    } catch (error) {
      Alert.alert('Activation Failed', error.message || 'Invalid code or code expired');
      setActivationCode(['', '', '', '', '', '']);
      codeRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <KeyboardAvoidingView behavior="padding" style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Animated.View style={[styles.animatedContainer, { opacity: fadeAnim }]}>
            <View style={styles.headerSection}>
              {onBack && (
                <TouchableOpacity activeOpacity={0.7} onPress={onBack} style={styles.backButton}>
                  <Text style={styles.backArrow}>←</Text>
                  <Text style={styles.backText}>Login</Text>
                </TouchableOpacity>
              )}
              <View style={styles.iconContainer}>
                <Text style={styles.iconEmoji}>🎓</Text>
              </View>
              <Text style={typography.headerTitle}>Activate Account</Text>
              <Text style={typography.headerSubtitle}>
                {step === 1 ? 'Enter your @ksrce.ac.in email to begin' : `Welcome ${studentName}! Set your password`}
              </Text>
            </View>

            <View style={styles.card}>
              {step === 1 ? (
                <>
                  <InputField
                    label="Student Email"
                    value={email}
                    onChangeText={(text) => { setEmail(text); setErrors({}); }}
                    placeholder="your.name@ksrce.ac.in"
                    iconType="email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    error={errors.email}
                  />
                  <PrimaryButton title="Verify Email" onPress={handleCheckEmail} loading={loading} />
                </>
              ) : (
                <>
                  <View style={styles.infoBox}>
                    <Text style={styles.infoText}>
                      Check your @ksrce.ac.in email for the 6-digit activation code sent by your administrator.
                    </Text>
                  </View>

                  <Text style={styles.label}>Activation Code</Text>
                  <View style={styles.codeContainer}>
                    {activationCode.map((digit, index) => (
                      <TextInput
                        key={index}
                        ref={(ref) => (codeRefs.current[index] = ref)}
                        style={[styles.codeInput, digit ? styles.codeInputFilled : null]}
                        value={digit}
                        onChangeText={(text) => handleCodeChange(text.slice(-1), index)}
                        onKeyPress={(e) => handleKeyPress(e, index)}
                        keyboardType="number-pad"
                        maxLength={1}
                      />
                    ))}
                  </View>

                  <InputField
                    label="New Password"
                    value={newPassword}
                    onChangeText={(text) => { setNewPassword(text); setErrors((p) => ({ ...p, newPassword: null })); }}
                    placeholder="Min 8 characters"
                    iconType="password"
                    isPassword={true}
                    error={errors.newPassword}
                  />

                  <InputField
                    label="Confirm Password"
                    value={confirmPassword}
                    onChangeText={(text) => { setConfirmPassword(text); setErrors((p) => ({ ...p, confirmPassword: null })); }}
                    placeholder="Re-enter password"
                    iconType="password"
                    isPassword={true}
                    error={errors.confirmPassword}
                  />

                  <PrimaryButton title="Activate & Login" onPress={handleActivate} loading={loading} />
                </>
              )}
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32, alignItems: 'center', justifyContent: 'center' },
  animatedContainer: { width: '100%', maxWidth: 440, alignItems: 'center' },
  headerSection: { alignItems: 'center', marginBottom: 20, width: '100%' },
  backButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.border },
  backArrow: { fontSize: 16, fontWeight: '700', color: colors.primary, marginRight: 4 },
  backText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  iconContainer: { width: 72, height: 72, borderRadius: 20, backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  iconEmoji: { fontSize: 36 },
  card: { width: '100%', backgroundColor: colors.card, borderRadius: 22, paddingHorizontal: 22, paddingVertical: 24, shadowColor: colors.shadowColor, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.07, shadowRadius: 20, elevation: 6, borderWidth: 1, borderColor: '#F1F5F9' },
  infoBox: { backgroundColor: '#EFF6FF', borderRadius: 12, padding: 14, marginBottom: 18, borderWidth: 1, borderColor: '#BFDBFE' },
  infoText: { fontSize: 13, color: colors.primary, lineHeight: 18 },
  label: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: 8, marginLeft: 4 },
  codeContainer: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 18 },
  codeInput: { width: 48, height: 56, borderRadius: 12, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.inputBg, textAlign: 'center', fontSize: 24, fontWeight: '700', color: colors.textPrimary },
  codeInputFilled: { borderColor: colors.primary, backgroundColor: '#EFF6FF' },
});

export default ActivationScreen;
