/**
 * React Navigation type definitions
 */

import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

export type AuthStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  Onboarding: undefined;
};

export type MainTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList>;
  Workouts: NavigatorScreenParams<WorkoutsStackParamList>;
  Statistics: undefined;
  Settings: undefined;
};

export type HomeStackParamList = {
  HomeScreen: undefined;
  SessionDetail: { sessionId: string };
  DayDetail: { routineId: string; dayId: string; isToday?: boolean };
};

export type WorkoutsStackParamList = {
  RoutinesList: undefined;
  RoutineDetail: { routineId: string };
  DayDetail: { routineId: string; dayId: string; isToday?: boolean };
  ActiveWorkout: { routineId?: string; dayId?: string };
};

// Type declarations for navigation props
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

