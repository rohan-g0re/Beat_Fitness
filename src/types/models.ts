/**
 * App-level TypeScript interfaces and types
 */

export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  units: 'metric' | 'imperial';
  equipment: string[];
  created_at: string;
}

export interface Routine {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  days?: RoutineDay[];
}

export interface RoutineDay {
  id: string;
  routine_id: string;
  day_of_week: number; // 0=Sun, 1=Mon, ..., 6=Sat
  tags: string[];
  created_at: string;
  exercises?: RoutineExercise[];
}

export interface RoutineExercise {
  id: string;
  routine_day_id: string;
  name: string;
  target_sets: number | null;
  target_reps: number | null;
  target_weight: number | null;
  notes: string | null;
  sort_order: number;
}

export interface WorkoutSession {
  id: string;
  user_id: string;
  routine_id: string | null;
  routine_day_id: string | null;
  started_at: string;
  ended_at: string | null;
  total_duration_sec: number | null;
  strength_score: number | null;
  exercises?: WorkoutExercise[];
}

export interface WorkoutExercise {
  id: string;
  session_id: string;
  name: string;
  sort_order: number;
  sets?: WorkoutSet[];
}

export interface WorkoutSet {
  id: string;
  workout_exercise_id: string;
  set_number: number;
  reps: number;
  weight: number | null;
  rir: number | null; // Reps in Reserve
  completed_at: string;
}

export interface ExerciseTemplate {
  id: string;
  name: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: string[];
  defaultRepMin: number | null;
  defaultRepMax: number | null;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  movementPattern?: string;
}

export interface UserEntitlement {
  user_id: string;
  pro: boolean;
  max_routines: number;
  expires_at: string | null;
  updated_at: string;
}

// Stats & Analytics
export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalWorkouts: number;
}

export interface WorkoutStats {
  totalSets: number;
  totalReps: number;
  totalVolume: number;
  totalDuration: number;
  strengthScore: number;
}

export interface ActivityDay {
  date: string;
  sessionCount: number;
  hasWorkout: boolean;
}

// UI State Types
export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

