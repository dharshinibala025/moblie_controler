import React, { useState } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import GetStartedScreen from './frontend/welcome/screens/GetStartedScreen';
import LoginScreen from './frontend/login/screens/LoginScreen';
import SetNewPasswordScreen from './frontend/login/set_new_password/SetNewPasswordScreen';
import StudentDashboardScreen from './frontend/student_dashboard/screens/StudentDashboardScreen';
import StaffDashboardScreen from './frontend/staff_dashboard/screens/StaffDashboardScreen';

type Screen = 'welcome' | 'login' | 'set_password' | 'student_dashboard' | 'staff_dashboard';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');
  const [selectedRole, setSelectedRole] = useState<string>('student');

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
            onLoginSuccess={(data: { role: string; email: string }) => {
              setSelectedRole(data.role);
              setCurrentScreen('set_password');
            }}
          />
        )}
        {currentScreen === 'set_password' && (
          <SetNewPasswordScreen
            onPasswordUpdated={() => {
              setCurrentScreen(selectedRole === 'staff' ? 'staff_dashboard' : 'student_dashboard');
            }}
          />
        )}
        {currentScreen === 'student_dashboard' && (
          <StudentDashboardScreen onLogout={() => setCurrentScreen('login')} />
        )}
        {currentScreen === 'staff_dashboard' && (
          <StaffDashboardScreen onLogout={() => setCurrentScreen('login')} />
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
