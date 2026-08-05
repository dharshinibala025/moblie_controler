import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

interface LandingScreenProps {
  onGetStarted: () => void;
}

const LandingScreen: React.FC<LandingScreenProps> = ({ onGetStarted }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.container}>
        
        {/* ─── Top Logo Section ──────────────────────────────────────────────── */}
        <View style={styles.topSection}>
          <View style={styles.logoBadge}>
            <Image
              source={require('../assets/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          {/* ─── App Brand Title & Subtitle ─────────────────────────────────── */}
          <Text style={styles.brandTitle}>
            <Text style={styles.titleFocus}>Focus</Text>
            <Text style={styles.titleSync}>Sync</Text>
          </Text>
          <Text style={styles.subtitle}>Stay Focused. Learn Better.</Text>
        </View>

        {/* ─── Center Hero Illustration ──────────────────────────────────────── */}
        <View style={styles.illustrationContainer}>
          <Image
            source={require('../assets/illustration.png')}
            style={styles.illustrationImage}
            resizeMode="contain"
          />
        </View>

        {/* ─── Bottom Footer & CTA Section ───────────────────────────────────── */}
        <View style={styles.bottomSection}>
          <Text style={styles.footerHeading}>
            Smart Classroom Mobile{'\n'}Usage Control System
          </Text>

          <TouchableOpacity
            style={styles.getStartedButton}
            onPress={onGetStarted}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>Get Started</Text>
            <View style={styles.arrowIconContainer}>
              <Text style={styles.arrowIcon}>→</Text>
            </View>
          </TouchableOpacity>
        </View>

      </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },
  topSection: {
    alignItems: 'center',
    marginTop: 16,
  },
  logoBadge: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 20,
  },
  logoImage: {
    width: 62,
    height: 62,
  },
  brandTitle: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  titleFocus: {
    color: '#1E3A8A', // Deep Navy Blue
  },
  titleSync: {
    color: '#10B981', // Vibrant Emerald Green
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 6,
    textAlign: 'center',
  },
  illustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  illustrationImage: {
    width: width * 0.78,
    height: width * 0.65,
    maxHeight: 250,
  },
  bottomSection: {
    alignItems: 'center',
    marginBottom: 12,
  },
  footerHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  getStartedButton: {
    backgroundColor: '#2563EB', // Primary Vibrant Blue
    width: '100%',
    height: 56,
    borderRadius: 28, // Pill shape
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  arrowIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  arrowIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: -2,
  },
});

export default LandingScreen;
