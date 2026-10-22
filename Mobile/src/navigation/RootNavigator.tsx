import React, { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from '../screens/shared/SplashScreen';
import LandingScreen from '../screens/user/LandingScreen';
import LoginScreen from '../screens/user/LoginScreen';
import UserTabs from './UserTabs';
import WorkerTabs from './WorkerTabs';
import NotificationsScreen from '../screens/user/NotificationsScreen';
import ProfileDetailsScreen from '../screens/user/ProfileDetailsScreen';
import WorkerProfileDetailsScreen from '../screens/worker/WorkerProfileDetailsScreen';
import TrackingScreen from '../screens/user/TrackingScreen';
import PrivacyPolicyScreen from '../screens/user/PrivacyPolicyScreen';
import TermsOfUseScreen from '../screens/user/TermsOfUseScreen';
import BugReportScreen from '../screens/user/BugReportScreen';
import FeedbackScreen from '../screens/user/FeedbackScreen';
import ForgotPasswordScreen from '../screens/user/ForgotPasswordScreen';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../types';
import { mobileApi, syncCachedApiData } from '../lib/api';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { isAuthed, role, isLoading, token } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [isInitialDataLoading, setIsInitialDataLoading] = useState(false);

  useEffect(() => {
    if (isLoading) return undefined;
    if (!isAuthed || !token) {
      setIsInitialDataLoading(false);
      return undefined;
    }

    let active = true;
    setIsInitialDataLoading(true);
    const initialRequests = role === 'worker'
      ? [
          mobileApi.getAvailableJobs(token),
          mobileApi.getWorkerPerformance(token),
          mobileApi.getCurrentWorker(token),
        ]
      : [
          mobileApi.getIssues(token),
          mobileApi.getUnreadNotificationCount(token),
          mobileApi.getAppConfig(),
        ];

    void Promise.allSettled(initialRequests).finally(() => {
      if (active) setIsInitialDataLoading(false);
    });

    return () => {
      active = false;
    };
  }, [isAuthed, isLoading, role, token]);

  useEffect(() => {
    if (!token) return undefined;
    const syncIfActive = () => {
      if (AppState.currentState === 'active') void syncCachedApiData(token);
    };
    const interval = setInterval(syncIfActive, 60_000);
    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') syncIfActive();
    });
    return () => {
      clearInterval(interval);
      appStateSubscription.remove();
    };
  }, [token]);

  if (showSplash) {
    return (
      <SplashScreen
        isDataLoading={isLoading || isInitialDataLoading}
        onFinish={() => setShowSplash(false)}
      />
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthed ? (
        <>
          <Stack.Screen name="Landing" component={LandingScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </>
      ) : role === 'worker' ? (
        <>
          <Stack.Screen name="WorkerApp" component={WorkerTabs} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="WorkerProfileDetails" component={WorkerProfileDetailsScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="UserApp" component={UserTabs} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="ProfileDetails" component={ProfileDetailsScreen} />
          <Stack.Screen name="Tracking" component={TrackingScreen} />
          <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
          <Stack.Screen name="TermsOfUse" component={TermsOfUseScreen} />
          <Stack.Screen name="BugReport" component={BugReportScreen} />
          <Stack.Screen name="Feedback" component={FeedbackScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
