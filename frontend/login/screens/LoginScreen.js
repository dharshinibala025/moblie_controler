import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
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

export const LoginScreen = ({ onBack = () => {}, onLoginSuccess }) => {
  const [selectedRole, setSelectedRole] = useState('student'); // 'student' | 'staff' | 'admin'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(translateYAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const validate = () => {
    let valid = true;
    let newErrors = {};

    if (!email.trim()) {
      newErrors.email = selectedRole === 'student' ? 'Register No or Email is required' : 'Email or Employee ID is required';
      valid = false;
    }

    if (!password) {
      newErrors.password = 'Password is required';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSignIn = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const trimmedIdentifier = email.trim();
      const result = await authService.login(trimmedIdentifier, password);

      if (result.mustChangePassword) {
        authService.setPreToken(result.tempToken || result.preToken);
        onLoginSuccess({
          screen: 'passwordReset',
          tempToken: result.tempToken || result.preToken,
          user: result.user,
        });
        return;
      }

      if (result.success && (result.token || result.accessToken)) {
        const tokenToStore = result.accessToken || result.token;
        const userData = result.user || authService.parseToken(tokenToStore);
        onLoginSuccess({ screen: 'dashboard', token: tokenToStore, user: userData });
      }
    } catch (error) {
      const message = authService.getErrorMessage(error);
      Alert.alert('Authentication Failed', message, [{ text: 'OK' }]);
    } finally {
      setLoading(false);
    }
  };

  const getPlaceholder = () => {
    switch (selectedRole) {
      case 'student':
        return 'vvdharani57cse24_27@ksrce.ac.in or 221CS000';
      case 'staff':
        return 'staff1@ksrce.ac.in or STF001';
      case 'admin':
        return 'admin@ksrce.ac.in or ADM001';
      default:
        return 'your.name@ksrce.ac.in';
    }
  };

  const getInputLabel = () => {
    switch (selectedRole) {
      case 'student':
        return 'Register No / Institutional Email';
      case 'staff':
        return 'Employee ID / Staff Email';
      case 'admin':
        return 'Admin Email / Employee ID';
      default:
        return 'Email Address';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
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
            </View>

            <View style={styles.card}>
              {/* Role Selection Tabs */}
              <View style={styles.roleTabContainer}>
                <TouchableOpacity
                  style={[styles.roleTab, selectedRole === 'student' && styles.activeRoleTab]}
                  onPress={() => { setSelectedRole('student'); setErrors({}); }}
                >
                  <Text style={[styles.roleTabText, selectedRole === 'student' && styles.activeRoleTabText]}>Student</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.roleTab, selectedRole === 'staff' && styles.activeRoleTab]}
                  onPress={() => { setSelectedRole('staff'); setErrors({}); }}
                >
                  <Text style={[styles.roleTabText, selectedRole === 'staff' && styles.activeRoleTabText]}>Staff</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.roleTab, selectedRole === 'admin' && styles.activeRoleTab]}
                  onPress={() => { setSelectedRole('admin'); setErrors({}); }}
                >
                  <Text style={[styles.roleTabText, selectedRole === 'admin' && styles.activeRoleTabText]}>Admin</Text>
                </TouchableOpacity>
              </View>

              <Text style={typography.cardTitle}>
                {selectedRole === 'student' ? 'Student Sign In' : selectedRole === 'staff' ? 'Staff Portal Login' : 'Admin Developer Portal'}
              </Text>
              <Text style={typography.cardSubtitle}>Authenticate against institutional database</Text>

              <InputField
                label={getInputLabel()}
                value={email}
                onChangeText={(text) => { setEmail(text); if (errors.email) setErrors((prev) => ({ ...prev, email: null })); }}
                placeholder={getPlaceholder()}
                iconType="email"
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.email}
              />

              <InputField
                label="Password"
                value={password}
                onChangeText={(text) => { setPassword(text); if (errors.password) setErrors((prev) => ({ ...prev, password: null })); }}
                placeholder="Enter your password"
                iconType="password"
                isPassword={true}
                error={errors.password}
              />

              <PrimaryButton title={`Sign In as ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}`} onPress={handleSignIn} loading={loading} />
            </View>

            <View style={styles.footerSection}>
              <Text style={styles.footerText}>
                Smart Classroom Portal • Contact Admin: vvdharani57cse24_27@ksrce.ac.in
              </Text>
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
  headerSection: { alignItems: 'center', marginBottom: 20, width: '100%', position: 'relative' },
  backButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.border },
  backArrow: { fontSize: 16, fontWeight: '700', color: colors.primary, marginRight: 4 },
  backText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  logoBadgeContainer: { width: 68, height: 68, borderRadius: 20, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', marginBottom: 10, shadowColor: colors.shadowColor, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  logoImage: { width: 48, height: 48 },
  card: { width: '100%', backgroundColor: colors.card, borderRadius: 22, paddingHorizontal: 22, paddingVertical: 24, shadowColor: colors.shadowColor, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.07, shadowRadius: 20, elevation: 6, borderWidth: 1, borderColor: '#F1F5F9' },
  roleTabContainer: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 12, padding: 4, marginBottom: 20 },
  roleTab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  activeRoleTab: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  roleTabText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  activeRoleTabText: { color: colors.primary, fontWeight: '700' },
  footerSection: { marginTop: 24, alignItems: 'center', justifyContent: 'center' },
  footerText: { fontSize: 12, color: colors.textMuted, textAlign: 'center' },
});

export default LoginScreen;
