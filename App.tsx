import React, { useState } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import GetStartedScreen from './frontend/welcome/screens/GetStartedScreen';
import LoginScreen from './frontend/login/screens/LoginScreen';
import SetNewPasswordScreen from './frontend/login/set_new_password/SetNewPasswordScreen';
import StudentDashboardScreen from './frontend/student_dashboard/screens/StudentDashboardScreen';
import AdminPanel from './frontend/admin_dashboard/AdminPanel';
import StaffDashboardScreen from './frontend/staff_dashboard/screens/StaffDashboardScreen';

type Screen = 'welcome' | 'login' | 'set_password' | 'dashboard';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');
  const [userRole, setUserRole] = useState<string | null>(null);

  const handleLogout = () => {
    setUserRole(null);
    setCurrentScreen('login');
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
            onLoginSuccess={(user: any) => {
              setUserRole(user?.role || 'student');
              setCurrentScreen('dashboard');
            }}
          />
        )}
        {currentScreen === 'set_password' && (
          <SetNewPasswordScreen
            onPasswordUpdated={() => setCurrentScreen('dashboard')}
          />
        )}
        {currentScreen === 'dashboard' && (
          <>
            {userRole === 'admin' ? (
              <AdminPanel onLogout={handleLogout} />
            ) : userRole === 'staff' ? (
              <StaffDashboardScreen onLogout={handleLogout} />
            ) : (
              <StudentDashboardScreen onLogout={handleLogout} />
            )}
          </>
        )}
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
