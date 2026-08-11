import React, { useState } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import GetStartedScreen from './frontend/welcome/screens/GetStartedScreen';
import LoginScreen from './frontend/login/screens/LoginScreen';
import SetNewPasswordScreen from './frontend/login/set_new_password/SetNewPasswordScreen';
import StudentDashboardScreen from './frontend/student_dashboard/screens/StudentDashboardScreen';
import StaffDashboardScreen from './frontend/staff_dashboard/screens/StaffDashboardScreen';
import AdminPanel from './frontend/admin_dashboard/AdminPanel';


function App() {
  const [currentScreen, setCurrentScreen] = useState('welcome');
  const [userRole, setUserRole] = useState('student');
  const [tempToken, setTempToken] = useState('');

  const handleLogout = () => {
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
    setUserRole(role);
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
            onPasswordUpdated={() => setCurrentScreen('login')}
          />
        )}
        {currentScreen === 'dashboard' && renderDashboard()}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
});

export default App;
