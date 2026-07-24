import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
  SafeAreaView,
  Dimensions,
  Platform,
} from 'react-native';

const { width } = Dimensions.get('window');

export const GetStartedScreen = ({ onGetStarted }) => {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4,
    }).start();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <View style={styles.container}>
        {/* Top Header Section */}
        <View style={styles.topSection}>
          {/* Logo Badge - Perfectly Centered & Positioned Below Notch */}
          <View style={styles.logoWrapper}>
            <Image
              source={require('../assets/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          {/* App Title */}
          <Text style={styles.brandTitle}>
            Focus<Text style={styles.brandAccent}>Sync</Text>
          </Text>

          {/* Tagline */}
          <Text style={styles.tagline}>Stay Focused. Learn Better.</Text>
        </View>

        {/* Center Illustration Section */}
        <View style={styles.illustrationSection}>
          <Image
            source={require('../assets/school_illustration.png')}
            style={styles.illustrationImage}
            resizeMode="contain"
          />
        </View>

        {/* Bottom Details & Get Started Action */}
        <View style={styles.bottomSection}>
          <Text style={styles.systemSubtitle}>
            Smart Classroom Mobile{'\n'}Usage Control System
          </Text>

          {/* Animated Get Started Button */}
          <Animated.View
            style={[
              styles.buttonWrapper,
              { transform: [{ scale: buttonScale }] },
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={onGetStarted}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              style={styles.getStartedButton}
            >
              <Text style={styles.buttonText}>Get Started</Text>
              <View style={styles.arrowCircle}>
                <Text style={styles.arrowIcon}>→</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
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
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 16 : 24,
    paddingBottom: 32,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topSection: {
    alignItems: 'center',
    width: '100%',
    marginTop: 8,
  },
  logoWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 6,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  brandTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#1E3A8A',
    letterSpacing: -0.5,
  },
  brandAccent: {
    color: '#10B981',
  },
  tagline: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginTop: 4,
    letterSpacing: 0.2,
  },
  illustrationSection: {
    width: '100%',
    height: width * 0.58,
    maxHeight: 260,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
  },
  illustrationImage: {
    width: '100%',
    height: '100%',
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
  },
  systemSubtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonWrapper: {
    width: '100%',
    maxWidth: 380,
  },
  getStartedButton: {
    height: 56,
    borderRadius: 18,
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 6,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
    marginRight: 10,
  },
  arrowCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginTop: -2,
  },
});

export default GetStartedScreen;
