import React, { useState, useRef } from 'react';
import { View, StyleSheet, Animated, StatusBar, SafeAreaView } from 'react-native';
import mockData from '../data/mockData';
import HomeScreen from './HomeScreen';
import AppsScreen from './AppsScreen';
import NotificationsScreen from './NotificationsScreen';
import ProfileScreen from './ProfileScreen';
import BottomNavBar from '../components/BottomNavBar';

export const StudentDashboardScreen = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'apps' | 'notifications' | 'profile'
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
          <HomeScreen
            data={mockData}
            onNavigateTab={handleTabChange}
            onOpenProfile={() => handleTabChange('profile')}
          />
        );
      case 'apps':
        return <AppsScreen data={mockData} />;
      case 'notifications':
        return <NotificationsScreen data={mockData} />;
      case 'profile':
        return (
          <ProfileScreen
            student={mockData.student}
            onLogout={onLogout}
          />
        );
      default:
        return (
          <HomeScreen
            data={mockData}
            onNavigateTab={handleTabChange}
            onOpenProfile={() => handleTabChange('profile')}
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

        <BottomNavBar activeTab={activeTab} onSelectTab={handleTabChange} />
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

export default StudentDashboardScreen;
