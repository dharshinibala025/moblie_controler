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
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import InputField from '../../login/components/InputField';
import PrimaryButton from '../../login/components/PrimaryButton';

export const StaffLoginScreen = ({ onBack, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

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
    if (validate()) {
      setLoading(true);
      try {
        const authService = require('../../services/authService').default;
        const result = await authService.login(email, password, 'staff');
        setLoading(false);

        if (onLoginSuccess) {
          onLoginSuccess({
            role: 'staff',
            email: result.user?.email || email,
            mustChangePassword: result.mustChangePassword || false,
            accessToken: result.accessToken || result.tempToken,
            user: result.user,
          });
        }
      } catch (err) {
        setLoading(false);
        Alert.alert(
          'Authentication Error',
          err.message || 'Invalid Staff credentials. Please check your email and password.',
        );
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={[styles.contentWrapper, { opacity: fadeAnim }]}>
            {/* Back Button (Top Left) */}
            {onBack && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={onBack}
                style={styles.backButton}
              >
                <MaterialIcons name="arrow-back" size={20} color="#2563EB" />
                <Text style={styles.backText}>Welcome</Text>
              </TouchableOpacity>
            )}

            {/* Header Section */}
            <View style={styles.headerSection}>
              <View style={styles.logoWrapper}>
                <Image
                  source={require('../../login/assets/logo.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>

              <Text style={styles.appNameText}>FocusSync</Text>
              <Text style={styles.appSubtext}>Staff Mobile Controller</Text>
            </View>

            <View style={styles.divider} />

            {/* Welcome Text */}
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeTitle}>Staff Portal</Text>
              <Text style={styles.welcomeSubtitle}>
                Sign in to manage your assigned students.
              </Text>
            </View>

            {/* Login Form Fields & Action */}
            <View style={styles.sectionContainer}>
              <InputField
                label="Staff Email Address"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
                }}
                placeholder="staff.name@college.edu"
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
                  activeOpacity={0.8}
                  onPress={() => setRememberMe(!rememberMe)}
                  style={styles.rememberMeContainer}
                >
                  <View
                    style={[
                      styles.checkbox,
                      rememberMe && styles.checkboxChecked,
                    ]}
                  >
                    {rememberMe && (
                      <MaterialIcons name="check" size={14} color="#FFFFFF" />
                    )}
                  </View>
                  <Text style={styles.rememberMeText}>Remember Me</Text>
                </TouchableOpacity>
              </View>

              {/* Primary Blue Sign In Button */}
              <PrimaryButton
                title="Staff Sign In"
                onPress={handleSignIn}
                loading={loading}
              />
            </View>

            <View style={styles.divider} />

            {/* Clean Footer Section */}
            <View style={styles.footerSection}>
              <Text style={styles.footerLine}>FocusSync System</Text>
              <Text style={styles.footerLine}>Staff Module</Text>
              <Text style={styles.footerLine}>Version 1.0</Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    justifyContent: 'center',
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  backText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 8,
  },
  logoWrapper: {
    width: 68,
    height: 68,
    marginBottom: 12,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  appNameText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 2,
  },
  appSubtext: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  welcomeSection: {
    marginVertical: 10,
    alignItems: 'flex-start',
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  sectionContainer: {
    marginVertical: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  rememberMeText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4B5563',
  },
  footerSection: {
    marginTop: 8,
    alignItems: 'center',
  },
  footerLine: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94A3B8',
    lineHeight: 16,
    textAlign: 'center',
  },
});

export default StaffLoginScreen;
