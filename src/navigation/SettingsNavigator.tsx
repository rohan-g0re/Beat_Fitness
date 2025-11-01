/**
 * Settings Navigator - Stack navigation for settings screens
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SettingsStackParamList } from '@types/navigation';
import { SettingsScreen } from '@screens/settings/SettingsScreen';
import { AccountInformationScreen } from '@screens/settings/AccountInformationScreen';
import { FAQsScreen } from '@screens/settings/FAQsScreen';

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export const SettingsNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#000000',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen
        name="SettingsMenu"
        component={SettingsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="AccountInformation"
        component={AccountInformationScreen}
        options={{
          title: 'Account Information',
        }}
      />
      <Stack.Screen
        name="FAQs"
        component={FAQsScreen}
        options={{
          title: 'FAQs',
        }}
      />
    </Stack.Navigator>
  );
};

