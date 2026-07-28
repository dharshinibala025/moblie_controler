import React, { useState, useEffect } from 'react';
import { StatusBar, StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LandingScreen from './frontend/login/screens/LandingScreen';
import LoginScreen from './frontend/login/screens/LoginScreen';
import PasswordResetScreen from './frontend/login/screens/PasswordResetScreen';
import AdminDashboard from './frontend/screens/AdminDashboard';
import StaffDashboard from './frontend/screens/StaffDashboard';
import StudentDashboardScreen from './frontend/student_dashboard/screens/StudentDashboardScreen';
import SetNewPasswordScreen from './frontend/login/set_new_password/SetNewPasswordScreen';
import OfflineScreen from './frontend/screens/OfflineScreen';
import authService from './frontend/services/authService';

function App() {
  const [screen, setScreen] = useState('loading'); // 'loading' | 'offline' | 'landing' | 'login' | 'passwordReset' | 'dashboard'
  const [user, setUser] = useState(null);
  const [authData, setAuthData] = useState(null);

  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    setScreen('loading');
    try {
      // 1. Health Check API as per Architecture Diagram
      const isHealthy = await authService.healthCheck();
      if (!isHealthy) {
        setScreen('offline');
        return;
      }

      // Show Landing screen on app launch
      setScreen('landing');
    } catch (error) {
      setScreen('landing');
    }
  };

  const handleLoginSuccess = (data: any) => {
    if (data.screen === 'passwordReset' || data.mustChangePassword) {
      setAuthData(data);
      setScreen('passwordReset');
      return;
    }

    if (data.screen === 'dashboard' && data.user) {
      setUser(data.user);
      setAuthData(null);
      setScreen('dashboard');
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
    setAuthData(null);
    setScreen('landing');
  };

  const handleBackToLanding = () => {
    setAuthData(null);
    setScreen('landing');
  };

  const renderScreen = () => {
    switch (screen) {
      case 'loading':
        return (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>Initializing Smart Classroom...</Text>
          </View>
        );

      case 'offline':
        return <OfflineScreen onRetry={initApp} />;

      case 'landing':
        return <LandingScreen onGetStarted={() => setScreen('login')} />;

      case 'login':
        return <LoginScreen onLoginSuccess={handleLoginSuccess} onBack={handleBackToLanding} />;

      case 'passwordReset':
        return (
          <SetNewPasswordScreen
            tempToken={authData?.accessToken || authData?.tempToken || authData?.preToken}
            onPasswordUpdated={async () => {
              await authService.logout();
              setUser(null);
              setAuthData(null);
              setScreen('login');
            }}
          />
        );

      case 'dashboard':
        if (!user) {
          setScreen('login');
          return null;
        }
        switch (user.role) {
          case 'admin':
            return <AdminDashboard user={user} onLogout={handleLogout} />;
          case 'staff':
            return <StaffDashboard user={user} onLogout={handleLogout} />;
          case 'student':
            return <StudentDashboardScreen onLogout={handleLogout} />;
          default:
            return <LoginScreen onLoginSuccess={handleLoginSuccess} onBack={handleBackToLogin} />;
        }

      default:
        return <LoginScreen onLoginSuccess={handleLoginSuccess} onBack={handleBackToLogin} />;
    }
  };

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F8FAFC"
      />
      <View style={styles.container}>
        {renderScreen()}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
});

export default App;
