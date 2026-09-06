import React, { useState, useEffect, Component, ReactNode } from 'react';
import { StatusBar, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import GetStartedScreen from './frontend/welcome/screens/GetStartedScreen';
import LoginScreen from './frontend/login/screens/LoginScreen';
import SetNewPasswordScreen from './frontend/login/set_new_password/SetNewPasswordScreen';
import StudentDashboardScreen from './frontend/student_dashboard/screens/StudentDashboardScreen';
import StaffDashboardScreen from './frontend/staff_dashboard/screens/StaffDashboardScreen';
import AdminPanel from './frontend/admin_dashboard/AdminPanel';
import syncService from './frontend/services/syncService';
import authService from './frontend/services/authService';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Unhandled FocusSync Exception:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>FocusSync Application Restored</Text>
          <Text style={styles.errorSubtitle}>
            An unexpected error occurred. Click below to return to safety.
          </Text>
          <TouchableOpacity style={styles.resetButton} onPress={this.handleReset}>
            <Text style={styles.resetButtonText}>Reload Screen</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

function App() {
  const [currentScreen, setCurrentScreen] = useState('welcome');
  const [userRole, setUserRole] = useState('student');
  const [tempToken, setTempToken] = useState('');
  const [loggedInUser, setLoggedInUser] = useState<any>(null);

  useEffect(() => {
    return () => syncService.stopPeriodicSync();
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (_) {
      // tokens are cleared inside authService.logout
    }
    syncService.stopPeriodicSync();
    syncService.stopRealtimeListener();
    setLoggedInUser(null);
    setUserRole('student');
    setCurrentScreen('login');
  };

  const handleLoginSuccess = (user: any) => {
    if (user?.mustChangePassword) {
      setTempToken(user?.accessToken || user?.tempToken || '');
      setCurrentScreen('set_password');
      return;
    }
    const role = typeof user === 'string' ? user : (user?.role || 'student');
    setLoggedInUser(user);
    setUserRole(role);
    syncService.startPeriodicSync();
    setCurrentScreen('dashboard');
  };

  const renderDashboard = () => {
    switch (userRole) {
      case 'staff':
        return <StaffDashboardScreen onLogout={handleLogout} />;
      case 'admin':
        return <AdminPanel onLogout={handleLogout} />;
      case 'student':
      default:
        return <StudentDashboardScreen onLogout={handleLogout} />;
    }
  };

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={currentScreen === 'welcome' || currentScreen === 'set_password' ? '#FFFFFF' : '#F8FAFC'}
        />
        <View style={styles.container}>
          {currentScreen === 'welcome' && (
            <GetStartedScreen onGetStarted={() => setCurrentScreen('login')} />
          )}
          {currentScreen === 'login' && (
            <LoginScreen
              onBack={() => setCurrentScreen('welcome')}
              onLoginSuccess={handleLoginSuccess}
            />
          )}
          {currentScreen === 'set_password' && (
            <SetNewPasswordScreen
              tempToken={tempToken}
              onPasswordUpdated={(user?: any) => {
                if (user && user.role) {
                  const role = user.role || 'student';
                  setLoggedInUser(user);
                  setUserRole(role);
                  syncService.startPeriodicSync();
                  setCurrentScreen('dashboard');
                } else {
                  setCurrentScreen('login');
                }
              }}
            />
          )}
          {currentScreen === 'dashboard' && renderDashboard()}
        </View>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
  },
  resetButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default App;
