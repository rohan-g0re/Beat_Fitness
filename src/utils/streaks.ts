/**
 * Streak Computation - Timezone-aware workout streaks
 */

import { WorkoutSession, StreakData } from '@types/models';

/**
 * Convert ISO timestamp to local date string (YYYY-MM-DD)
 */
export const toLocalDateString = (isoTimestamp: string): string => {
  const date = new Date(isoTimestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Get unique workout days from sessions
 * Returns set of date strings (YYYY-MM-DD)
 */
export const getWorkoutDays = (sessions: WorkoutSession[]): Set<string> => {
  const workoutDays = new Set<string>();

  sessions.forEach(session => {
    if (session.ended_at) {
      // Use ended_at to determine the workout day
      const dateStr = toLocalDateString(session.ended_at);
      workoutDays.add(dateStr);
    }
  });

  return workoutDays;
};

/**
 * Calculate current and longest streaks from workout sessions
 */
export const calculateStreaks = (sessions: WorkoutSession[]): StreakData => {
  const workoutDays = getWorkoutDays(sessions);
  
  if (workoutDays.size === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalWorkouts: 0,
    };
  }

  // Sort dates chronologically
  const sortedDates = Array.from(workoutDays).sort();
  const today = toLocalDateString(new Date().toISOString());

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  // Build a complete date range from first workout to today
  const firstDate = new Date(sortedDates[0]);
  const todayDate = new Date(today);
  const dateSet = new Set(sortedDates);

  // Calculate current streak (working backwards from today)
  let checkDate = new Date(today);
  let foundToday = dateSet.has(today);
  let foundYesterday = false;

  // Check yesterday
  const yesterday = new Date(checkDate);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = toLocalDateString(yesterday.toISOString());
  foundYesterday = dateSet.has(yesterdayStr);

  if (foundToday || foundYesterday) {
    // Start counting from today or yesterday
    let streakDate = foundToday ? new Date(today) : new Date(yesterdayStr);
    
    while (true) {
      const dateStr = toLocalDateString(streakDate.toISOString());
      if (dateSet.has(dateStr)) {
        currentStreak++;
        streakDate.setDate(streakDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  // Calculate longest streak
  tempStreak = 0;
  let prevDate: Date | null = null;

  sortedDates.forEach(dateStr => {
    const currentDate = new Date(dateStr);

    if (prevDate === null) {
      tempStreak = 1;
    } else {
      const dayDiff = Math.floor(
        (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (dayDiff === 1) {
        // Consecutive day
        tempStreak++;
      } else {
        // Streak broken
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }

    prevDate = currentDate;
  });

  longestStreak = Math.max(longestStreak, tempStreak);

  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
    totalWorkouts: sessions.filter(s => s.ended_at).length,
  };
};

/**
 * Check if a specific date has a workout
 */
export const hasWorkoutOnDate = (date: string, sessions: WorkoutSession[]): boolean => {
  const workoutDays = getWorkoutDays(sessions);
  return workoutDays.has(date);
};

/**
 * Get workout count for a specific date
 */
export const getWorkoutCountForDate = (date: string, sessions: WorkoutSession[]): number => {
  return sessions.filter(session => {
    if (!session.ended_at) return false;
    return toLocalDateString(session.ended_at) === date;
  }).length;
};

/**
 * Get all workout dates for a specific month
 */
export const getWorkoutDatesForMonth = (
  year: number,
  month: number,
  sessions: WorkoutSession[]
): string[] => {
  const workoutDays = getWorkoutDays(sessions);
  const monthStr = String(month + 1).padStart(2, '0');
  const prefix = `${year}-${monthStr}`;

  return Array.from(workoutDays).filter(date => date.startsWith(prefix));
};

/**
 * Calculate weekly workout frequency
 */
export const getWeeklyFrequency = (sessions: WorkoutSession[], weeks: number = 4): number => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - weeks * 7);
  const cutoffStr = toLocalDateString(cutoffDate.toISOString());

  const recentWorkouts = sessions.filter(session => {
    if (!session.ended_at) return false;
    const dateStr = toLocalDateString(session.ended_at);
    return dateStr >= cutoffStr;
  });

  const workoutDays = getWorkoutDays(recentWorkouts);
  return workoutDays.size / weeks;
};

