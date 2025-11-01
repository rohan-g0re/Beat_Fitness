/**
 * Statistics Navigator - Statistics tab stack navigation
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatisticsStackParamList } from '@types/navigation';

// Import screens
import { StatsScreen } from '@screens/statistics/StatsScreen';
import { WorkoutSummaryScreen } from '@screens/statistics/WorkoutSummaryScreen';

const Stack = createNativeStackNavigator<StatisticsStackParamList>();

export const StatisticsNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#1C1C1E',
        },
        headerTintColor: '#FFFFFF',
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="StatsScreen"
        component={StatsScreen}
        options={{ title: 'Statistics' }}
      />
      <Stack.Screen
        name="WorkoutSummary"
        component={WorkoutSummaryScreen}
        options={{ title: 'Workout Summary' }}
      />
    </Stack.Navigator>
  );
};

