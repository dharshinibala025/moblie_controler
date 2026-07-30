import React, { useState } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import GetStartedScreen from './frontend/welcome/screens/GetStartedScreen';
import LoginScreen from './frontend/login/screens/LoginScreen';
import SetNewPasswordScreen from './frontend/login/set_new_password/SetNewPasswordScreen';
import StudentDashboardScreen from './frontend/student_dashboard/screens/StudentDashboardScreen';
import StaffDashboardScreen from './frontend/staff_dashboard/screens/StaffDashboardScreen';
import AdminPanel from './frontend/admin_dashboard/AdminPanel';
import { getStaffProfile } from './frontend/staff_dashboard/data/staffMockData';

type Screen = 'welcome' | 'login' | 'set_password' | 'dashboard';
type Role = 'student' | 'staff' | 'admin';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');
  const [userRole, setUserRole] = useState<Role>('student');
  const [staffData, setStaffData] = useState(null);

  const handleLoginSuccess = (result: { role: Role; email?: string }) => {
    setUserRole(result.role);
    if (result.role === 'staff') {
      setStaffData(getStaffProfile(result.email));
    } else {
      setStaffData(null);
    }
    setCurrentScreen('dashboard');
  };

  const renderDashboard = () => {
    switch (userRole) {
      case 'staff':
        return <StaffDashboardScreen staffData={staffData} onLogout={() => setCurrentScreen('login')} />;
      case 'admin':
        return <AdminPanel onLogout={() => setCurrentScreen('login')} />;
      case 'student':
      default:
        return <StudentDashboardScreen onLogout={() => setCurrentScreen('login')} />;
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
            onPasswordUpdated={() => setCurrentScreen('dashboard')}
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
