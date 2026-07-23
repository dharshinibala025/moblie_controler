import React, { useState } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import GetStartedScreen from './frontend/welcome/screens/GetStartedScreen';
import LoginScreen from './frontend/login/screens/LoginScreen';

function App() {
  const [currentScreen, setCurrentScreen] = useState('welcome'); // 'welcome' | 'login'

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={currentScreen === 'welcome' ? '#FFFFFF' : '#F8FAFC'}
      />
      <View style={styles.container}>
        {currentScreen === 'welcome' ? (
          <GetStartedScreen onGetStarted={() => setCurrentScreen('login')} />
        ) : (
          <LoginScreen onBack={() => setCurrentScreen('welcome')} />
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
