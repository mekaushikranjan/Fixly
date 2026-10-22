import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';
import RootNavigator from './src/navigation/RootNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { AlertProvider } from './src/context/AlertContext';

export default function App() {
  useEffect(() => {
    if (Platform.OS === 'android') {
      try {
        const navBar = NavigationBar as any;
        if (typeof navBar?.setHidden === 'function') {
          navBar.setHidden(false);
        }
        if (typeof navBar?.setStyle === 'function') {
          navBar.setStyle('dark');
        }
        if (typeof navBar?.setVisibilityAsync === 'function') {
          navBar.setVisibilityAsync('visible').catch?.(() => {});
        }
        if (typeof navBar?.setButtonStyleAsync === 'function') {
          navBar.setButtonStyleAsync('dark').catch?.(() => {});
        }
        if (typeof navBar?.setBackgroundColorAsync === 'function') {
          navBar.setBackgroundColorAsync('#00000000').catch?.(() => {});
        }
      } catch (_) {}
    }
  }, []);

  return (
    <SafeAreaProvider>
      {Platform.OS === 'android' && (
        <NavigationBar.NavigationBar hidden={false} style="dark" />
      )}
      <AuthProvider>
        <AlertProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </AlertProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
