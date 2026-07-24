import React, { useState, useEffect } from 'react';
import { StatusBar, StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LoginScreen from './frontend/login/screens/LoginScreen';
import PasswordResetScreen from './frontend/login/screens/PasswordResetScreen';
import AdminDashboard from './frontend/screens/AdminDashboard';
import StaffDashboard from './frontend/screens/StaffDashboard';
import StudentDashboard from './frontend/screens/StudentDashboard';
import OfflineScreen from './frontend/screens/OfflineScreen';
import authService from './frontend/services/authService';

function App() {
  const [screen, setScreen] = useState('loading'); // 'loading' | 'offline' | 'login' | 'passwordReset' | 'dashboard'
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

      // 2. Session Restore Flow via Token & Storage
      const session = await authService.getSession();
      if (session && session.token && session.user) {
        setUser(session.user);
        setScreen('dashboard');
      } else {
        setScreen('login');
      }
    } catch (error) {
      setScreen('login');
    }
  };

  const handleLoginSuccess = (data) => {
    if (data.screen === 'passwordReset') {
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
    setScreen('login');
  };

  const handleBackToLogin = () => {
    setAuthData(null);
    setScreen('login');
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

      case 'login':
        return <LoginScreen onLoginSuccess={handleLoginSuccess} />;

      case 'passwordReset':
        return (
          <PasswordResetScreen
            preToken={authData?.tempToken || authData?.preToken}
            userId={authData?.user?._id || authData?.userId}
            role={authData?.user?.role || authData?.role}
            onSuccess={handleLoginSuccess}
            onBack={handleBackToLogin}
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
            return <StudentDashboard user={user} />;
          default:
            return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
        }

      default:
        return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
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
