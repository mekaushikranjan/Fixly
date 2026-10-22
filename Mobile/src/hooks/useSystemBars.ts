import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import * as NavigationBar from 'expo-navigation-bar';
import { setStatusBarStyle } from 'expo-status-bar';
import { Platform, StatusBar as RNStatusBar } from 'react-native';

/**
 * Ensures the status bar and bottom navigation bar are completely seamless
 * and translucent with NO separate fixed color bar on any screen.
 * The page color flows naturally behind the status bar and adapts when scrolled.
 *
 * @param _barColor - legacy param (ignored for status bar to enforce transparent edge-to-edge)
 * @param buttonStyle - icon color for status bar ('light' = white, 'dark' = dark)
 */
export function useSystemBars(_barColor?: string, buttonStyle: 'light' | 'dark' = 'light'): void {
  useFocusEffect(
    useCallback(() => {
      try {
        const isLight = buttonStyle === 'light';
        const barStyle = isLight ? 'light-content' : 'dark-content';

        // 1. Transparent & translucent Status Bar (Android only)
        if (Platform.OS === 'android') {
          if (typeof RNStatusBar.setTranslucent === 'function') {
            RNStatusBar.setTranslucent(true);
          }
          if (typeof RNStatusBar.setBackgroundColor === 'function') {
            RNStatusBar.setBackgroundColor('transparent', true);
          }
        }
        if (typeof RNStatusBar.setBarStyle === 'function') {
          RNStatusBar.setBarStyle(barStyle, true);
        }

        try {
          setStatusBarStyle(isLight ? 'light' : 'dark');
        } catch (_) {}

        // 2. Android Mobile Bottom Navigation Bar (Ensure Always Visible)
        if (Platform.OS === 'android') {
          const navBar = NavigationBar as any;
          // Modern expo-navigation-bar (v56+)
          if (typeof navBar?.setHidden === 'function') {
            navBar.setHidden(false);
          }
          if (typeof navBar?.setStyle === 'function') {
            navBar.setStyle('dark');
          }
          // Legacy & fallback methods
          if (typeof navBar?.setVisibilityAsync === 'function') {
            navBar.setVisibilityAsync('visible').catch?.(() => {});
          }
          if (typeof navBar?.setButtonStyleAsync === 'function') {
            navBar.setButtonStyleAsync('dark').catch?.(() => {});
          }
          if (typeof navBar?.setBackgroundColorAsync === 'function') {
            navBar.setBackgroundColorAsync('#00000000').catch?.(() => {});
          }
        }
      } catch (err) {
        // gracefully handle unsupported runtime environments
      }
    }, [buttonStyle])
  );
}
