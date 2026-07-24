import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  StatusBar,
  SafeAreaView,
  Alert,
} from 'react-native';
import colors from '../styles/colors';
import typography from '../styles/typography';
import PrimaryButton from '../components/PrimaryButton';
import authService from '../../services/authService';

const ConsentGateScreen = ({ preToken, userId, role, onSuccess, onBack }) => {
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleAccept = async () => {
    if (!accepted) {
      Alert.alert('Required', 'Please accept the terms and conditions to continue.');
      return;
    }

    setLoading(true);
    try {
      const result = await authService.acceptConsent('1.0', preToken);

      if (result.token) {
        const userData = authService.parseToken(result.token);
        onSuccess({ token: result.token, user: userData });
      }
    } catch (error) {
      const message = error.message || 'Failed to accept terms. Please try again.';
      Alert.alert('Error', message, [{ text: 'OK' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.animatedContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: translateYAnim }],
              },
            ]}
          >
            <View style={styles.headerSection}>
              {onBack && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={onBack}
                  style={styles.backButton}
                >
                  <Text style={styles.backArrow}>←</Text>
                  <Text style={styles.backText}>Login</Text>
                </TouchableOpacity>
              )}

              <View style={styles.iconContainer}>
                <Text style={styles.iconEmoji}>📋</Text>
              </View>
              
              <Text style={typography.headerTitle}>Terms & Conditions</Text>
              <Text style={typography.headerSubtitle}>
                Please review and accept to continue
              </Text>
            </View>

            <View style={styles.card}>
              <View style={styles.termsContainer}>
                <Text style={styles.termsTitle}>FocusSync Smart Classroom</Text>
                <Text style={styles.termsDate}>Effective Date: 1.0</Text>
                
                <Text style={styles.termsSection}>1. Acceptance of Terms</Text>
                <Text style={styles.termsText}>
                  By accessing and using the FocusSync Smart Classroom Mobile Usage Control System, 
                  you agree to be bound by these Terms and Conditions. This system is designed to 
                  help manage mobile device usage in educational environments.
                </Text>

                <Text style={styles.termsSection}>2. Purpose of the System</Text>
                <Text style={styles.termsText}>
                  FocusSync allows educational institutions to manage and monitor mobile device 
                  usage during class hours. This includes blocking certain applications, tracking 
                  usage patterns, and generating reports to improve classroom focus and productivity.
                </Text>

                <Text style={styles.termsSection}>3. Data Collection</Text>
                <Text style={styles.termsText}>
                  The system collects the following data: installed application information, 
                  application usage duration, device status, and login activity. This data is 
                  used solely for educational management purposes and is stored securely.
                </Text>

                <Text style={styles.termsSection}>4. Privacy</Text>
                <Text style={styles.termsText}>
                  Your data is protected and will only be accessible to authorized institutional 
                  administrators. We do not share personal data with third parties. All data 
                  transmission is encrypted using industry-standard protocols.
                </Text>

                <Text style={styles.termsSection}>5. User Responsibilities</Text>
                <Text style={styles.termsText}>
                  Users are responsible for maintaining the confidentiality of their login 
                  credentials. Any misuse of the system may result in account suspension. 
                  Users should report any security concerns immediately.
                </Text>

                <Text style={styles.termsSection}>6. Device Binding</Text>
                <Text style={styles.termsText}>
                  Each student account is bound to a single device. Attempting to log in from 
                  a different device may require administrator intervention. This policy ensures 
                  accurate monitoring and prevents unauthorized access.
                </Text>

                <Text style={styles.termsSection}>7. Contact</Text>
                <Text style={styles.termsText}>
                  For any questions regarding these terms, please contact your institution 
                  administrator or reach out to the support team at support@ksrce.ac.in.
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setAccepted(!accepted)}
                style={styles.checkboxRow}
              >
                <View
                  style={[
                    styles.checkbox,
                    accepted && styles.checkboxChecked,
                  ]}
                >
                  {accepted && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>
                  I have read and agree to the Terms and Conditions
                </Text>
              </TouchableOpacity>

              <PrimaryButton
                title="Accept & Continue"
                onPress={handleAccept}
                loading={loading}
                disabled={!accepted}
              />
            </View>
          </Animated.View>
        </ScrollView>
      </View>
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
  },
  animatedContainer: {
    width: '100%',
    maxWidth: 440,
    alignItems: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
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
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconEmoji: {
    fontSize: 36,
  },
  card: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: 22,
    paddingHorizontal: 22,
    paddingVertical: 24,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.07,
    shadowRadius: 20,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  termsContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: 300,
  },
  termsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  termsDate: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 16,
  },
  termsSection: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 12,
    marginBottom: 4,
  },
  termsText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    backgroundColor: colors.inputBg,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    marginTop: -2,
  },
  checkboxLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
});

export default ConsentGateScreen;
