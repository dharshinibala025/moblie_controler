import React, { useState, useRef } from 'react';
import { View, StyleSheet, Animated, StatusBar, SafeAreaView } from 'react-native';
import StaffHomeScreen from './StaffHomeScreen';
import StaffNotificationsScreen from './StaffNotificationsScreen';
import StaffProfileScreen from './StaffProfileScreen';
import StaffBottomNavBar from '../components/StaffBottomNavBar';

export const StaffDashboardScreen = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'notifications' | 'profile'
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const handleTabChange = (newTab) => {
    if (newTab === activeTab) return;

    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    setActiveTab(newTab);
  };

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'home':
        return (
          <StaffHomeScreen
            onNavigateTab={handleTabChange}
          />
        );
      case 'notifications':
        return <StaffNotificationsScreen />;
      case 'profile':
        return (
          <StaffProfileScreen
            onLogout={onLogout}
          />
        );
      default:
        return (
          <StaffHomeScreen
            onNavigateTab={handleTabChange}
          />
        );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.container}>
        <Animated.View style={[styles.screenContainer, { opacity: fadeAnim }]}>
          {renderActiveScreen()}
        </Animated.View>

        <StaffBottomNavBar activeTab={activeTab} onSelectTab={handleTabChange} />
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
  },
  screenContainer: {
    flex: 1,
  },
});

export default StaffDashboardScreen;
