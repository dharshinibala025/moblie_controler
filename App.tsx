import React, { useState, useEffect } from 'react';
import { StatusBar, StyleSheet, View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import GetStartedScreen from './frontend/welcome/screens/GetStartedScreen';
import LoginScreen from './frontend/login/screens/LoginScreen';
import ActivationScreen from './frontend/login/screens/ActivationScreen';
import PasswordResetScreen from './frontend/login/screens/PasswordResetScreen';
import ConsentGateScreen from './frontend/login/screens/ConsentGateScreen';
import AdminDashboard from './frontend/screens/AdminDashboard';
import StaffDashboard from './frontend/screens/StaffDashboard';
import StudentDashboard from './frontend/screens/StudentDashboard';
import authService from './frontend/services/authService';

function App() {
  const [screen, setScreen] = useState('loading');
  const [user, setUser] = useState(null);
  const [authData, setAuthData] = useState(null);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const session = await authService.getSession();
      if (session && session.token && session.user) {
        setUser(session.user);
        setScreen('dashboard');
      } else {
        setScreen('welcome');
      }
    } catch (error) {
      setScreen('welcome');
    }
  };

  const handleLoginSuccess = (data) => {
    if (data.screen === 'activation') {
      setAuthData(data);
      setScreen('activation');
      return;
    }

    if (data.screen === 'passwordReset') {
      setAuthData(data);
      setScreen('passwordReset');
      return;
    }

    if (data.screen === 'consent') {
      setAuthData(data);
      setScreen('consent');
      return;
    }

    if (data.screen === 'dashboard' && data.token && data.user) {
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
          </View>
        );

      case 'welcome':
        return <GetStartedScreen onGetStarted={() => setScreen('login')} />;

      case 'login':
        return (
          <LoginScreen
            onBack={() => setScreen('welcome')}
            onLoginSuccess={handleLoginSuccess}
          />
        );

      case 'activation':
        return (
          <ActivationScreen
            initialEmail={authData?.email}
            onBack={handleBackToLogin}
            onSuccess={handleLoginSuccess}
          />
        );

      case 'passwordReset':
        return (
          <PasswordResetScreen
            preToken={authData?.preToken}
            userId={authData?.userId}
            role={authData?.role}
            onSuccess={handleLoginSuccess}
            onBack={handleBackToLogin}
          />
        );

      case 'consent':
        return (
          <ConsentGateScreen
            preToken={authData?.preToken}
            userId={authData?.userId}
            role={authData?.role}
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
            return <LoginScreen onBack={() => setScreen('welcome')} onLoginSuccess={handleLoginSuccess} />;
        }

      default:
        return <GetStartedScreen onGetStarted={() => setScreen('login')} />;
    }
  };

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={screen === 'welcome' ? '#FFFFFF' : '#F8FAFC'}
      />
      <View style={styles.container}>
        {renderScreen()}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
});

export default App;
