/**
 * Home Navigator - Home tab stack navigation
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeStackParamList } from '@types/navigation';

// Import screens
import { HomeScreen } from '@screens/home/HomeScreen';
import { SessionDetailScreen } from '@screens/home/SessionDetailScreen';
import { DayDetailScreen } from '@screens/workouts/DayDetailScreen';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export const HomeNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="HomeScreen"
        component={HomeScreen}
      />
      <Stack.Screen
        name="SessionDetail"
        component={SessionDetailScreen}
        options={{ title: 'Workout Details' }}
      />
      <Stack.Screen
        name="DayDetail"
        component={DayDetailScreen}
        options={{ title: "Today's Workout" }}
      />
    </Stack.Navigator>
  );
};

