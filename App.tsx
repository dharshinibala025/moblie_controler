import React, { useState } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import GetStartedScreen from './frontend/welcome/screens/GetStartedScreen';
import LoginScreen from './frontend/login/screens/LoginScreen';
import SetNewPasswordScreen from './frontend/login/set_new_password/SetNewPasswordScreen';
import StudentDashboardScreen from './frontend/student_dashboard/screens/StudentDashboardScreen';

type Screen = 'welcome' | 'login' | 'set_password' | 'dashboard';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');

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
            onLoginSuccess={() => setCurrentScreen('set_password')}
          />
        )}
        {currentScreen === 'set_password' && (
          <SetNewPasswordScreen
            onPasswordUpdated={() => setCurrentScreen('dashboard')}
          />
        )}
        {currentScreen === 'dashboard' && (
          <StudentDashboardScreen onLogout={() => setCurrentScreen('login')} />
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
