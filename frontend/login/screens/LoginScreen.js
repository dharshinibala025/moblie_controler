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
import RoleSelector from '../components/RoleSelector';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';

export const LoginScreen = ({ onBack, onLoginSuccess }) => {
  // State variables
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
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

  const handleSignIn = () => {
    if (validate()) {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        if (onLoginSuccess) {
          onLoginSuccess({ role, email });
        } else {
          Alert.alert(
            'Login Successful',
            `Welcome to FocusSync!\nRole: ${role.toUpperCase()}\nEmail: ${email}`,
            [{ text: 'OK' }]
          );
        }
      }, 1000);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.animatedContainer}>
            {/* Header Section with Single College Logo */}
            <View style={styles.headerSection}>
              {onBack && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={onBack}
                  style={styles.backButton}
                >
                  <Text style={styles.backArrow}>←</Text>
                  <Text style={styles.backText}>Welcome</Text>
                </TouchableOpacity>
              )}

              {/* Single Logo Display */}
              <View style={styles.logoBadgeContainer}>
                <Image
                  source={require('../assets/logo.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
              
              <Text style={typography.headerTitle}>FocusSync</Text>
            </View>

            {/* Floating White Login Card */}
            <View style={styles.card}>
              <Text style={typography.cardTitle}>Welcome Back</Text>
              <Text style={typography.cardSubtitle}>Sign in to your account</Text>

              {/* Compact Role Selection (Student, Staff, Admin) */}
              <RoleSelector selectedRole={role} onSelectRole={setRole} />

              {/* Input Fields */}
              <InputField
                label="Email Address"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
                }}
                placeholder="enter.your.email@college.edu"
                iconType="email"
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.email}
              />

              <InputField
                label="Password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
                }}
                placeholder="••••••••••••"
                iconType="password"
                isPassword={true}
                error={errors.password}
              />

              {/* Remember Me Checkbox */}
              <View style={styles.optionsRow}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setRememberMe(!rememberMe)}
                  style={styles.rememberMeContainer}
                >
                  <View
                    style={[
                      styles.checkbox,
                      rememberMe && styles.checkboxChecked,
                    ]}
                  >
                    {rememberMe && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.rememberMeText}>Remember Me</Text>
                </TouchableOpacity>
              </View>

              {/* Sign In Button */}
              <PrimaryButton
                title="Sign In"
                onPress={handleSignIn}
                loading={loading}
              />
            </View>

            {/* Clean Footer */}
            <View style={styles.footerSection}>
              <Text style={typography.footerText}>
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
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  animatedContainer: {
    width: '100%',
    maxWidth: 440,
    alignItems: 'center',
  },

  // Header Section
  headerSection: {
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
    position: 'relative',
  },
  backButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
  },
  backArrow: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    marginRight: 4,
  },
  backText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },

  // Single Logo Badge Container
  logoBadgeContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: colors.shadowColor,
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

  // Card Container
  card: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: 22,
    paddingHorizontal: 22,
    paddingVertical: 20,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },

  // Options Row
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    paddingHorizontal: 2,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.8,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: colors.inputBg,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    marginTop: -2,
  },
  rememberMeText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },

  // Footer Section
  footerSection: {
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default LoginScreen;
