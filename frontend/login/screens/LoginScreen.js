import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
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

export const LoginScreen = ({ onBack, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(translateYAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();
  }, []);

  const validate = () => {
    let valid = true;
    let newErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Email address is required';
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
      valid = false;
    }

    if (!password) {
      newErrors.password = 'Password is required';
      valid = false;
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSignIn = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await authService.login(email, password);

      if (result.needsActivation) {
        onLoginSuccess({ screen: 'activation', email });
        return;
      }

      if (result.mustChangePassword) {
        authService.setPreToken(result.preToken);
        onLoginSuccess({ screen: 'passwordReset', preToken: result.preToken, userId: result.userId, role: result.role });
        return;
      }

      if (result.requiresConsent) {
        authService.setPreToken(result.preToken);
        onLoginSuccess({ screen: 'consent', preToken: result.preToken, userId: result.userId, role: result.role });
        return;
      }

      if (result.success && result.token) {
        const userData = authService.parseToken(result.token);
        onLoginSuccess({ screen: 'dashboard', token: result.token, user: userData });
      }
    } catch (error) {
      const message = authService.getErrorMessage(error);
      Alert.alert('Login Failed', message, [{ text: 'OK' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <KeyboardAvoidingView behavior="padding" style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Animated.View style={[styles.animatedContainer, { opacity: fadeAnim, transform: [{ translateY: translateYAnim }] }]}>
            <View style={styles.headerSection}>
              {onBack && (
                <TouchableOpacity activeOpacity={0.7} onPress={onBack} style={styles.backButton}>
                  <Text style={styles.backArrow}>←</Text>
                  <Text style={styles.backText}>Welcome</Text>
                </TouchableOpacity>
              )}
              <View style={styles.logoBadgeContainer}>
                <Image source={require('../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
              </View>
              <Text style={typography.headerTitle}>FocusSync</Text>
              <Text style={typography.headerSubtitle}>Smart Classroom Mobile Usage Control</Text>
              <View style={styles.illustrationWrapper}>
                <Image source={require('../assets/illustration.png')} style={styles.illustrationImage} resizeMode="contain" />
              </View>
            </View>

            <View style={styles.card}>
              <Text style={typography.cardTitle}>Welcome Back</Text>
              <Text style={typography.cardSubtitle}>Sign in to your account</Text>

              <InputField
                label="Email Address"
                value={email}
                onChangeText={(text) => { setEmail(text); if (errors.email) setErrors((prev) => ({ ...prev, email: null })); }}
                placeholder="your.name@ksrce.ac.in"
                iconType="email"
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.email}
              />

              <InputField
                label="Password"
                value={password}
                onChangeText={(text) => { setPassword(text); if (errors.password) setErrors((prev) => ({ ...prev, password: null })); }}
                placeholder="••••••••••••"
                iconType="password"
                isPassword={true}
                error={errors.password}
              />

              <PrimaryButton title="Sign In" onPress={handleSignIn} loading={loading} />

              <TouchableOpacity style={styles.activateLink} onPress={() => onLoginSuccess({ screen: 'activation' })}>
                <Text style={styles.activateLinkText}>New Student? Activate your account here</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footerSection}>
              <Text style={styles.footerText}>
                Need help? Contact your Administrator
              </Text>
            </View>
          </View>
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
  headerSection: { alignItems: 'center', marginBottom: 20, width: '100%', position: 'relative' },
  backButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.border },
  backArrow: { fontSize: 16, fontWeight: '700', color: colors.primary, marginRight: 4 },
  backText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  logoBadgeContainer: { width: 68, height: 68, borderRadius: 20, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', marginBottom: 10, shadowColor: colors.shadowColor, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  logoImage: { width: 48, height: 48 },
  illustrationWrapper: { width: '100%', height: 140, marginTop: 12, justifyContent: 'center', alignItems: 'center' },
  illustrationImage: { width: '90%', height: '100%' },
  card: { width: '100%', backgroundColor: colors.card, borderRadius: 22, paddingHorizontal: 22, paddingVertical: 24, shadowColor: colors.shadowColor, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.07, shadowRadius: 20, elevation: 6, borderWidth: 1, borderColor: '#F1F5F9' },
  activateLink: { alignItems: 'center', marginTop: 14 },
  activateLinkText: { fontSize: 13, fontWeight: '600', color: colors.primary },
  footerSection: { marginTop: 24, alignItems: 'center', justifyContent: 'center' },
  footerText: { fontSize: 13, color: colors.textMuted },
});

export default LoginScreen;
