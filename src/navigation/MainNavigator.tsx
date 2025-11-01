/**
 * Main Navigator - Bottom tabs navigation
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '@types/navigation';
import { Ionicons } from '@expo/vector-icons';

// Import navigators and screens
import { HomeNavigator } from './HomeNavigator';
import { WorkoutNavigator } from './WorkoutNavigator';
import { SettingsNavigator } from './SettingsNavigator';
import { StatsScreen } from '@screens/statistics/StatsScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1C1C1E',
          borderTopColor: '#2C2C2E',
        },
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: '#6E6E6E',
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeNavigator}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Workouts"
        component={WorkoutNavigator}
        options={{
          tabBarLabel: 'Workouts',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="barbell-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Statistics"
        component={StatsScreen}
        options={{
          tabBarLabel: 'Stats',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsNavigator}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

