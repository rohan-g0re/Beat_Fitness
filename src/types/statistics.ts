/**
 * Statistics Type Definitions
 */

export interface AllTimeStats {
  totalWorkouts: number;
  totalSets: number;
  totalReps: number;
  totalVolume: number;
  totalDuration: number; // in minutes
  avgDuration: number; // in minutes
  avgSetsPerWorkout: number;
  avgVolumePerWorkout: number;
  avgRepsPerSet: number;
  avgRir: number | null;
}

export interface PeriodStats {
  workouts: number;
  sets: number;
  volume: number;
  duration: number; // in minutes
  reps: number;
}

export interface PeriodComparison {
  current: PeriodStats;
  previous: PeriodStats;
  changes: {
    workouts: number; // percentage
    volume: number; // percentage
    duration: number; // percentage
  };
}

export interface PersonalRecord {
  exerciseName: string;
  maxWeight: number;
  maxReps: number;
  maxVolume: number; // single set volume (weight × reps)
  achievedAt: string;
}

export interface MuscleGroupStat {
  muscleGroup: string;
  volume: number;
  sets: number;
  reps: number;
  percentage: number; // percentage of total volume
}

export interface StrengthTrendPoint {
  date: string;
  strengthScore: number;
  workoutNumber: number;
}

export interface ComputedStatistics {
  allTime: AllTimeStats;
  thisWeekVsLastWeek: PeriodComparison;
  personalRecords: PersonalRecord[];
  muscleGroups: MuscleGroupStat[];
  strengthTrend: StrengthTrendPoint[];
}

