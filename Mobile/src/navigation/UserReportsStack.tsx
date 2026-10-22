import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MyReportsScreen from '../screens/user/MyReportsScreen';
import TrackingScreen from '../screens/user/TrackingScreen';
import { UserReportsStackParamList } from '../types';

const Stack = createNativeStackNavigator<UserReportsStackParamList>();

export default function UserReportsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MyReportsList" component={MyReportsScreen} />
      <Stack.Screen name="Tracking" component={TrackingScreen} />
    </Stack.Navigator>
  );
}
