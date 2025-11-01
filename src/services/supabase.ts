/**
 * Supabase client initialization and database queries
 */

import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Database } from '../types/database';
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || '';
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Missing Supabase environment variables. Please ensure .env file exists with:\n' +
    'EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co\n' +
    'EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key'
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ==================== Auth ====================

export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signUpWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  return { user, error };
};

// ==================== Profiles ====================

export const getProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return { data, error };
};

export const upsertProfile = async (profile: Database['public']['Tables']['profiles']['Insert']) => {
  const { data, error } = await supabase.from('profiles').upsert(profile).select().single();
  return { data, error };
};

export const updateProfile = async (
  userId: string,
  updates: Database['public']['Tables']['profiles']['Update']
) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  return { data, error };
};

// ==================== Routines ====================

export const getRoutines = async (userId: string) => {
  const { data, error } = await supabase
    .from('routines')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return { data, error };
};

export const getRoutine = async (routineId: string) => {
  const { data, error } = await supabase
    .from('routines')
    .select('*')
    .eq('id', routineId)
    .single();
  return { data, error };
};

export const createRoutine = async (routine: Database['public']['Tables']['routines']['Insert']) => {
  const { data, error } = await supabase.from('routines').insert(routine).select().single();
  return { data, error };
};

export const updateRoutine = async (
  routineId: string,
  updates: Database['public']['Tables']['routines']['Update']
) => {
  const { data, error } = await supabase
    .from('routines')
    .update(updates)
    .eq('id', routineId)
    .select()
    .single();
  return { data, error };
};

export const deleteRoutine = async (routineId: string) => {
  const { error } = await supabase.from('routines').delete().eq('id', routineId);
  return { error };
};

// ==================== Routine Days ====================

export const getRoutineDays = async (routineId: string) => {
  const { data, error } = await supabase
    .from('routine_days')
    .select('*')
    .eq('routine_id', routineId)
    .order('day_of_week', { ascending: true });
  return { data, error };
};

export const upsertRoutineDay = async (
  day: Database['public']['Tables']['routine_days']['Insert']
) => {
  const { data, error } = await supabase
    .from('routine_days')
    .upsert(day, { onConflict: 'routine_id,day_of_week' })
    .select()
    .single();
  return { data, error };
};

// ==================== Routine Exercises ====================

export const getRoutineExercises = async (dayId: string) => {
  const { data, error } = await supabase
    .from('routine_exercises')
    .select('*')
    .eq('routine_day_id', dayId)
    .order('sort_order', { ascending: true });
  return { data, error };
};

export const createRoutineExercise = async (
  exercise: Database['public']['Tables']['routine_exercises']['Insert']
) => {
  const { data, error } = await supabase
    .from('routine_exercises')
    .insert(exercise)
    .select()
    .single();
  return { data, error };
};

export const updateRoutineExercise = async (
  exerciseId: string,
  updates: Database['public']['Tables']['routine_exercises']['Update']
) => {
  const { data, error } = await supabase
    .from('routine_exercises')
    .update(updates)
    .eq('id', exerciseId)
    .select()
    .single();
  return { data, error };
};

export const deleteRoutineExercise = async (exerciseId: string) => {
  const { error } = await supabase.from('routine_exercises').delete().eq('id', exerciseId);
  return { error };
};

// ==================== Workout Sessions ====================

export const createWorkoutSession = async (
  session: Database['public']['Tables']['workout_sessions']['Insert']
) => {
  const { data, error } = await supabase
    .from('workout_sessions')
    .insert(session)
    .select()
    .single();
  return { data, error };
};

export const endWorkoutSession = async (
  sessionId: string,
  endedAt: string,
  durationSec: number,
  strengthScore?: number
) => {
  const { data, error } = await supabase
    .from('workout_sessions')
    .update({
      ended_at: endedAt,
      total_duration_sec: durationSec,
      strength_score: strengthScore || null,
    })
    .eq('id', sessionId)
    .select()
    .single();
  return { data, error };
};

export const getWorkoutSessions = async (userId: string, limit = 50, offset = 0) => {
  const { data, error } = await supabase
    .from('workout_sessions')
    .select('*')
    .eq('user_id', userId)
    .not('ended_at', 'is', null)
    .order('started_at', { ascending: false })
    .range(offset, offset + limit - 1);
  return { data, error };
};

export const getWorkoutSessionById = async (sessionId: string) => {
  const { data, error } = await supabase
    .from('workout_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();
  return { data, error };
};

// ==================== Workout Exercises ====================

export const createWorkoutExercise = async (
  exercise: Database['public']['Tables']['workout_exercises']['Insert']
) => {
  const { data, error } = await supabase
    .from('workout_exercises')
    .insert(exercise)
    .select()
    .single();
  return { data, error };
};

export const getWorkoutExercises = async (sessionId: string) => {
  const { data, error } = await supabase
    .from('workout_exercises')
    .select('*')
    .eq('session_id', sessionId)
    .order('sort_order', { ascending: true });
  return { data, error };
};

// ==================== Workout Sets ====================

export const createWorkoutSet = async (
  set: Database['public']['Tables']['workout_sets']['Insert']
) => {
  const { data, error } = await supabase.from('workout_sets').insert(set).select().single();
  return { data, error };
};

export const getWorkoutSets = async (exerciseId: string) => {
  const { data, error } = await supabase
    .from('workout_sets')
    .select('*')
    .eq('workout_exercise_id', exerciseId)
    .order('set_number', { ascending: true });
  return { data, error };
};

// ==================== User Entitlements ====================

export const getUserEntitlement = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_entitlements')
    .select('*')
    .eq('user_id', userId)
    .single();
  return { data, error };
};

// ==================== Stats & Analytics ====================

export const getWorkoutStats = async (userId: string, startDate?: string, endDate?: string) => {
  let query = supabase
    .from('workout_sessions')
    .select('*, workout_exercises(*, workout_sets(*))')
    .eq('user_id', userId)
    .not('ended_at', 'is', null);

  if (startDate) {
    query = query.gte('started_at', startDate);
  }
  if (endDate) {
    query = query.lte('started_at', endDate);
  }

  const { data, error } = await query.order('started_at', { ascending: false });
  return { data, error };
};

export const getActivityDays = async (userId: string, year: number, month: number) => {
  const startDate = new Date(year, month, 1).toISOString();
  const endDate = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

  const { data, error } = await supabase
    .from('workout_sessions')
    .select('started_at, ended_at')
    .eq('user_id', userId)
    .not('ended_at', 'is', null)
    .gte('started_at', startDate)
    .lte('started_at', endDate)
    .order('started_at', { ascending: true });

  return { data, error };
};

