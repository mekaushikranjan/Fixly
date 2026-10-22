import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import JobFeedScreen from '../screens/worker/JobFeedScreen';
import ActiveTaskScreen from '../screens/worker/ActiveTaskScreen';
import { WorkerJobsStackParamList } from '../types';

const Stack = createNativeStackNavigator<WorkerJobsStackParamList>();

export default function WorkerJobsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="JobFeedList" component={JobFeedScreen} />
      <Stack.Screen name="JobDetail" component={ActiveTaskScreen} />
    </Stack.Navigator>
  );
}
