/**
 * Statistics Computation Utilities
 * Processes nested workout data to compute comprehensive statistics
 */

import {
  AllTimeStats,
  PeriodComparison,
  PeriodStats,
  PersonalRecord,
  MuscleGroupStat,
  StrengthTrendPoint,
  ComputedStatistics,
} from '@/types/statistics';
import { WorkoutSession, WorkoutExercise, WorkoutSet } from '@/types/models';
import { calculateStreaks } from './streaks';
import exerciseTemplates from '@data/exerciseTemplates.json';

// Type for nested workout data from getWorkoutStats()
interface NestedWorkoutSession extends WorkoutSession {
  workout_exercises?: Array<
    WorkoutExercise & {
      workout_sets?: WorkoutSet[];
    }
  >;
}

/**
 * Create exercise name to muscle groups lookup map
 */
const createExerciseMuscleMap = (): Map<string, string[]> => {
  const map = new Map<string, string[]>();
  exerciseTemplates.forEach((template: any) => {
    map.set(template.name.toLowerCase(), template.primaryMuscles || []);
  });
  return map;
};

/**
 * Compute all-time statistics from workout sessions
 */
export const computeAllTimeStats = (sessions: NestedWorkoutSession[]): AllTimeStats => {
  const completedSessions = sessions.filter(s => s.ended_at);

  let totalSets = 0;
  let totalReps = 0;
  let totalVolume = 0;
  let totalDuration = 0;
  let totalRirCount = 0;
  let totalRirSum = 0;

  completedSessions.forEach(session => {
    // Add duration
    if (session.total_duration_sec) {
      totalDuration += session.total_duration_sec;
    }

    // Process exercises and sets
    session.workout_exercises?.forEach(exercise => {
      exercise.workout_sets?.forEach(set => {
        totalSets++;
        totalReps += set.reps || 0;
        totalVolume += (set.weight || 0) * (set.reps || 0);

        if (set.rir !== null && set.rir !== undefined) {
          totalRirSum += set.rir;
          totalRirCount++;
        }
      });
    });
  });

  const totalWorkouts = completedSessions.length;
  const avgDuration = totalWorkouts > 0 ? totalDuration / totalWorkouts / 60 : 0;
  const avgSetsPerWorkout = totalWorkouts > 0 ? totalSets / totalWorkouts : 0;
  const avgVolumePerWorkout = totalWorkouts > 0 ? totalVolume / totalWorkouts : 0;
  const avgRepsPerSet = totalSets > 0 ? totalReps / totalSets : 0;
  const avgRir = totalRirCount > 0 ? totalRirSum / totalRirCount : null;

  return {
    totalWorkouts,
    totalSets,
    totalReps,
    totalVolume: Math.round(totalVolume),
    totalDuration: Math.round(totalDuration / 60), // Convert to minutes
    avgDuration: Math.round(avgDuration * 10) / 10,
    avgSetsPerWorkout: Math.round(avgSetsPerWorkout * 10) / 10,
    avgVolumePerWorkout: Math.round(avgVolumePerWorkout),
    avgRepsPerSet: Math.round(avgRepsPerSet * 10) / 10,
    avgRir: avgRir !== null ? Math.round(avgRir * 10) / 10 : null,
  };
};

/**
 * Compute statistics for a specific period
 */
const computePeriodStats = (
  sessions: NestedWorkoutSession[],
  startDate: Date,
  endDate: Date
): PeriodStats => {
  const filteredSessions = sessions.filter(s => {
    if (!s.ended_at) return false;
    const sessionDate = new Date(s.started_at);
    return sessionDate >= startDate && sessionDate < endDate;
  });

  let sets = 0;
  let reps = 0;
  let volume = 0;
  let duration = 0;

  filteredSessions.forEach(session => {
    if (session.total_duration_sec) {
      duration += session.total_duration_sec;
    }

    session.workout_exercises?.forEach(exercise => {
      exercise.workout_sets?.forEach(set => {
        sets++;
        reps += set.reps || 0;
        volume += (set.weight || 0) * (set.reps || 0);
      });
    });
  });

  return {
    workouts: filteredSessions.length,
    sets,
    reps,
    volume: Math.round(volume),
    duration: Math.round(duration / 60), // Convert to minutes
  };
};

/**
 * Compute period comparison (this week vs last week)
 */
export const computePeriodComparison = (
  sessions: NestedWorkoutSession[],
  days: number = 7
): PeriodComparison => {
  const now = new Date();
  const currentPeriodStart = new Date(now);
  currentPeriodStart.setDate(now.getDate() - days);

  const previousPeriodStart = new Date(now);
  previousPeriodStart.setDate(now.getDate() - days * 2);

  const currentStats = computePeriodStats(sessions, currentPeriodStart, now);
  const previousStats = computePeriodStats(sessions, previousPeriodStart, currentPeriodStart);

  // Calculate percentage changes
  const calculateChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  return {
    current: currentStats,
    previous: previousStats,
    changes: {
      workouts: calculateChange(currentStats.workouts, previousStats.workouts),
      volume: calculateChange(currentStats.volume, previousStats.volume),
      duration: calculateChange(currentStats.duration, previousStats.duration),
    },
  };
};

/**
 * Compute personal records per exercise
 */
export const computePersonalRecords = (
  sessions: NestedWorkoutSession[],
  limit: number = 10
): PersonalRecord[] => {
  const exerciseRecords = new Map<
    string,
    {
      maxWeight: number;
      maxReps: number;
      maxVolume: number;
      achievedAt: string;
    }
  >();

  sessions.forEach(session => {
    if (!session.ended_at) return;

    session.workout_exercises?.forEach(exercise => {
      const exerciseName = exercise.name;

      exercise.workout_sets?.forEach(set => {
        const weight = set.weight || 0;
        const reps = set.reps || 0;
        const volume = weight * reps;

        const existing = exerciseRecords.get(exerciseName);

        if (!existing || volume > existing.maxVolume) {
          exerciseRecords.set(exerciseName, {
            maxWeight: weight,
            maxReps: reps,
            maxVolume: volume,
            achievedAt: set.completed_at,
          });
        } else {
          // Update if we have a better weight or reps
          if (weight > existing.maxWeight) {
            exerciseRecords.set(exerciseName, {
              ...existing,
              maxWeight: weight,
            });
          }
          if (reps > existing.maxReps) {
            exerciseRecords.set(exerciseName, {
              ...existing,
              maxReps: reps,
            });
          }
        }
      });
    });
  });

  // Convert to array and sort by max volume
  const records: PersonalRecord[] = Array.from(exerciseRecords.entries())
    .map(([exerciseName, record]) => ({
      exerciseName,
      maxWeight: record.maxWeight,
      maxReps: record.maxReps,
      maxVolume: record.maxVolume,
      achievedAt: record.achievedAt,
    }))
    .sort((a, b) => b.maxVolume - a.maxVolume)
    .slice(0, limit);

  return records;
};

/**
 * Compute muscle group breakdown
 */
export const computeMuscleGroupBreakdown = (
  sessions: NestedWorkoutSession[]
): MuscleGroupStat[] => {
  const exerciseMuscleMap = createExerciseMuscleMap();
  const muscleGroupStats = new Map<string, { volume: number; sets: number; reps: number }>();

  let totalVolume = 0;

  sessions.forEach(session => {
    if (!session.ended_at) return;

    session.workout_exercises?.forEach(exercise => {
      const exerciseName = exercise.name.toLowerCase();
      const muscleGroups = exerciseMuscleMap.get(exerciseName) || ['Other'];

      exercise.workout_sets?.forEach(set => {
        const weight = set.weight || 0;
        const reps = set.reps || 0;
        const volume = weight * reps;

        totalVolume += volume;

        // Attribute to each primary muscle group
        muscleGroups.forEach(muscleGroup => {
          const existing = muscleGroupStats.get(muscleGroup) || {
            volume: 0,
            sets: 0,
            reps: 0,
          };

          muscleGroupStats.set(muscleGroup, {
            volume: existing.volume + volume,
            sets: existing.sets + 1,
            reps: existing.reps + reps,
          });
        });
      });
    });
  });

  // Convert to array and calculate percentages
  const muscleGroupArray: MuscleGroupStat[] = Array.from(muscleGroupStats.entries())
    .map(([muscleGroup, stats]) => ({
      muscleGroup,
      volume: Math.round(stats.volume),
      sets: stats.sets,
      reps: stats.reps,
      percentage: totalVolume > 0 ? Math.round((stats.volume / totalVolume) * 100) : 0,
    }))
    .sort((a, b) => b.volume - a.volume);

  return muscleGroupArray;
};

/**
 * Prepare strength score trend data for charting
 */
export const prepareStrengthTrendData = (
  sessions: NestedWorkoutSession[],
  limit: number = 15
): StrengthTrendPoint[] => {
  const completedSessions = sessions
    .filter(s => s.ended_at && s.strength_score !== null)
    .sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime())
    .slice(-limit); // Get last N sessions

  return completedSessions.map((session, index) => ({
    date: new Date(session.started_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    strengthScore: session.strength_score || 0,
    workoutNumber: index + 1,
  }));
};

/**
 * Main function to compute all statistics
 */
export const computeAllStatistics = (
  sessions: NestedWorkoutSession[]
): ComputedStatistics => {
  return {
    allTime: computeAllTimeStats(sessions),
    thisWeekVsLastWeek: computePeriodComparison(sessions, 7),
    personalRecords: computePersonalRecords(sessions, 10),
    muscleGroups: computeMuscleGroupBreakdown(sessions),
    strengthTrend: prepareStrengthTrendData(sessions, 15),
  };
};

