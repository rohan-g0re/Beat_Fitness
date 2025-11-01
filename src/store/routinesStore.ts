/**
 * Routines Store - Normalized cache of routines, days, and exercises
 */

import { create } from 'zustand';
import { Routine, RoutineDay, RoutineExercise } from '@types/models';

interface RoutinesState {
  routines: Record<string, Routine>;
  days: Record<string, RoutineDay>;
  exercises: Record<string, RoutineExercise>;
  isLoading: boolean;
  error: string | null;

  // Actions
  setRoutines: (routines: Routine[]) => void;
  addRoutine: (routine: Routine) => void;
  updateRoutine: (id: string, updates: Partial<Routine>) => void;
  removeRoutine: (id: string) => void;

  setDays: (days: RoutineDay[]) => void;
  addDay: (day: RoutineDay) => void;
  updateDay: (id: string, updates: Partial<RoutineDay>) => void;
  removeDay: (id: string) => void;

  setExercises: (exercises: RoutineExercise[]) => void;
  addExercise: (exercise: RoutineExercise) => void;
  updateExercise: (id: string, updates: Partial<RoutineExercise>) => void;
  removeExercise: (id: string) => void;

  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearCache: () => void;

  // Selectors
  getRoutineById: (id: string) => Routine | null;
  getDaysByRoutineId: (routineId: string) => RoutineDay[];
  getExercisesByDayId: (dayId: string) => RoutineExercise[];
}

const normalize = <T extends { id: string }>(items: T[]): Record<string, T> => {
  return items.reduce(
    (acc, item) => {
      acc[item.id] = item;
      return acc;
    },
    {} as Record<string, T>
  );
};

export const useRoutinesStore = create<RoutinesState>((set, get) => ({
  routines: {},
  days: {},
  exercises: {},
  isLoading: false,
  error: null,

  setRoutines: routines => {
    set({ routines: normalize(routines) });
  },

  addRoutine: routine => {
    set(state => ({
      routines: { ...state.routines, [routine.id]: routine },
    }));
  },

  updateRoutine: (id, updates) => {
    set(state => ({
      routines: {
        ...state.routines,
        [id]: { ...state.routines[id], ...updates },
      },
    }));
  },

  removeRoutine: id => {
    set(state => {
      const { [id]: removed, ...rest } = state.routines;
      return { routines: rest };
    });
  },

  setDays: days => {
    set({ days: normalize(days) });
  },

  addDay: day => {
    set(state => ({
      days: { ...state.days, [day.id]: day },
    }));
  },

  updateDay: (id, updates) => {
    set(state => ({
      days: {
        ...state.days,
        [id]: { ...state.days[id], ...updates },
      },
    }));
  },

  removeDay: id => {
    set(state => {
      const { [id]: removed, ...rest } = state.days;
      return { days: rest };
    });
  },

  setExercises: exercises => {
    set({ exercises: normalize(exercises) });
  },

  addExercise: exercise => {
    set(state => ({
      exercises: { ...state.exercises, [exercise.id]: exercise },
    }));
  },

  updateExercise: (id, updates) => {
    set(state => ({
      exercises: {
        ...state.exercises,
        [id]: { ...state.exercises[id], ...updates },
      },
    }));
  },

  removeExercise: id => {
    set(state => {
      const { [id]: removed, ...rest } = state.exercises;
      return { exercises: rest };
    });
  },

  setLoading: isLoading => set({ isLoading }),

  setError: error => set({ error }),

  clearCache: () => set({ routines: {}, days: {}, exercises: {} }),

  // Selectors
  getRoutineById: id => get().routines[id] || null,

  getDaysByRoutineId: routineId => {
    return Object.values(get().days).filter(day => day.routine_id === routineId);
  },

  getExercisesByDayId: dayId => {
    return Object.values(get().exercises)
      .filter(ex => ex.routine_day_id === dayId)
      .sort((a, b) => a.sort_order - b.sort_order);
  },
}));

