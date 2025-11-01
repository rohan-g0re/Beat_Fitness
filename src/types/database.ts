/**
 * Database types generated from Supabase schema
 * Run: npm run supabase:gen-types
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          display_name: string | null;
          units: string;
          equipment: Json;
          height: number | null;
          weight: number | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          display_name?: string | null;
          units?: string;
          equipment?: Json;
          height?: number | null;
          weight?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          display_name?: string | null;
          units?: string;
          equipment?: Json;
          height?: number | null;
          weight?: number | null;
          created_at?: string;
        };
      };
      routines: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          created_at?: string;
        };
      };
      routine_days: {
        Row: {
          id: string;
          routine_id: string;
          day_of_week: number;
          tags: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          routine_id: string;
          day_of_week: number;
          tags?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          routine_id?: string;
          day_of_week?: number;
          tags?: Json;
          created_at?: string;
        };
      };
      routine_exercises: {
        Row: {
          id: string;
          routine_day_id: string;
          name: string;
          target_sets: number | null;
          target_reps: number | null;
          target_weight: number | null;
          notes: string | null;
          sort_order: number;
        };
        Insert: {
          id?: string;
          routine_day_id: string;
          name: string;
          target_sets?: number | null;
          target_reps?: number | null;
          target_weight?: number | null;
          notes?: string | null;
          sort_order?: number;
        };
        Update: {
          id?: string;
          routine_day_id?: string;
          name?: string;
          target_sets?: number | null;
          target_reps?: number | null;
          target_weight?: number | null;
          notes?: string | null;
          sort_order?: number;
        };
      };
      workout_sessions: {
        Row: {
          id: string;
          user_id: string;
          routine_id: string | null;
          routine_day_id: string | null;
          started_at: string;
          ended_at: string | null;
          total_duration_sec: number | null;
          strength_score: number | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          routine_id?: string | null;
          routine_day_id?: string | null;
          started_at: string;
          ended_at?: string | null;
          total_duration_sec?: number | null;
          strength_score?: number | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          routine_id?: string | null;
          routine_day_id?: string | null;
          started_at?: string;
          ended_at?: string | null;
          total_duration_sec?: number | null;
          strength_score?: number | null;
        };
      };
      workout_exercises: {
        Row: {
          id: string;
          session_id: string;
          name: string;
          sort_order: number;
        };
        Insert: {
          id?: string;
          session_id: string;
          name: string;
          sort_order?: number;
        };
        Update: {
          id?: string;
          session_id?: string;
          name?: string;
          sort_order?: number;
        };
      };
      workout_sets: {
        Row: {
          id: string;
          workout_exercise_id: string;
          set_number: number;
          reps: number;
          weight: number | null;
          rir: number | null;
          completed_at: string;
        };
        Insert: {
          id?: string;
          workout_exercise_id: string;
          set_number: number;
          reps: number;
          weight?: number | null;
          rir?: number | null;
          completed_at: string;
        };
        Update: {
          id?: string;
          workout_exercise_id?: string;
          set_number?: number;
          reps?: number;
          weight?: number | null;
          rir?: number | null;
          completed_at?: string;
        };
      };
      user_entitlements: {
        Row: {
          user_id: string;
          pro: boolean;
          max_routines: number;
          expires_at: string | null;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          pro?: boolean;
          max_routines?: number;
          expires_at?: string | null;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          pro?: boolean;
          max_routines?: number;
          expires_at?: string | null;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

