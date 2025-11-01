/**
 * Workout Store - Active session state and timer management
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkoutSession, WorkoutExercise, WorkoutSet } from '@types/models';

interface ActiveWorkout {
  sessionId: string;
  routineId?: string;
  routineDayId?: string;
  startedAt: string;
  exercises: Array<{
    id: string;
    name: string;
    sortOrder: number;
    targetSets?: number | null;
    targetReps?: number | null;
    targetWeight?: number | null;
    sets: Array<{
      id: string;
      setNumber: number;
      reps: number;
      weight?: number | null;
      rir?: number | null;
      completedAt: string;
    }>;
    isDone: boolean;
  }>;
  currentExerciseId: string | null;
  isPaused: boolean;
  pausedAt: string | null;
}

interface WorkoutState {
  activeSession: ActiveWorkout | null;
  isKeepAwake: boolean;

  // Actions
  startWorkout: (
    sessionId: string,
    routineId?: string,
    dayId?: string,
    exercises?: ActiveWorkout['exercises']
  ) => void;
  endWorkout: () => void;
  pauseWorkout: () => void;
  resumeWorkout: () => void;
  setCurrentExercise: (exerciseId: string | null) => void;
  addSet: (exerciseId: string, set: ActiveWorkout['exercises'][0]['sets'][0]) => void;
  toggleExerciseDone: (exerciseId: string) => void;
  updateExercises: (exercises: ActiveWorkout['exercises']) => void;
  clearWorkout: () => void;
}

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set, get) => ({
      activeSession: null,
      isKeepAwake: false,

      startWorkout: (sessionId, routineId, dayId, exercises = []) => {
        set({
          activeSession: {
            sessionId,
            routineId,
            routineDayId: dayId,
            startedAt: new Date().toISOString(),
            currentExerciseId: exercises[0]?.id || null,
            exercises,
            isPaused: false,
            pausedAt: null,
          },
          isKeepAwake: true,
        });
      },

      endWorkout: () => {
        set({
          activeSession: null,
          isKeepAwake: false,
        });
      },

      pauseWorkout: () => {
        const { activeSession } = get();
        if (activeSession) {
          set({
            activeSession: {
              ...activeSession,
              isPaused: true,
              pausedAt: new Date().toISOString(),
            },
          });
        }
      },

      resumeWorkout: () => {
        const { activeSession } = get();
        if (activeSession) {
          set({
            activeSession: {
              ...activeSession,
              isPaused: false,
              pausedAt: null,
            },
          });
        }
      },

      setCurrentExercise: exerciseId => {
        const { activeSession } = get();
        if (activeSession) {
          set({
            activeSession: {
              ...activeSession,
              currentExerciseId: exerciseId,
            },
          });
        }
      },

      addSet: (exerciseId, newSet) => {
        const { activeSession } = get();
        if (!activeSession) return;

        const exercises = activeSession.exercises.map(ex => {
          if (ex.id === exerciseId) {
            return {
              ...ex,
              sets: [...(ex.sets || []), newSet],
            };
          }
          return ex;
        });

        set({
          activeSession: {
            ...activeSession,
            exercises,
          },
        });
      },

      toggleExerciseDone: exerciseId => {
        const { activeSession } = get();
        if (!activeSession) return;

        const exercises = activeSession.exercises.map(ex => {
          if (ex.id === exerciseId) {
            return {
              ...ex,
              isDone: !ex.isDone,
            };
          }
          return ex;
        });

        set({
          activeSession: {
            ...activeSession,
            exercises,
          },
        });
      },

      updateExercises: exercises => {
        const { activeSession } = get();
        if (activeSession) {
          set({
            activeSession: {
              ...activeSession,
              exercises,
            },
          });
        }
      },

      clearWorkout: () => {
        set({
          activeSession: null,
          isKeepAwake: false,
        });
      },
    }),
    {
      name: 'workout-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        activeSession: state.activeSession,
      }),
    }
  )
);

