/**
 * StatsScreen - Workout statistics and aggregates
 * Reference: Figma Frame 1:13 Screen 3
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { colors } from '@theme/colors';
import { spacing, borderRadius } from '@theme/spacing';
import { typography } from '@theme/typography';
import { getWorkoutSessions, getWorkoutExercises, getWorkoutSets } from '@services/supabase';
import { calculateStreaks } from '@utils/streaks';
import { calculateTotalVolume, calculateTotalReps } from '@utils/fitness';
import { WorkoutSession, WorkoutSet } from '@types/models';
import { useCurrentUser } from '@hooks/useCurrentUser';

interface StatsData {
  totalWorkouts: number;
  totalSets: number;
  totalReps: number;
  totalVolume: number;
  totalDuration: number;
  currentStreak: number;
  longestStreak: number;
}

export const StatsScreen = () => {
  const { userId, initialized } = useCurrentUser();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatsData>({
    totalWorkouts: 0,
    totalSets: 0,
    totalReps: 0,
    totalVolume: 0,
    totalDuration: 0,
    currentStreak: 0,
    longestStreak: 0,
  });

  useEffect(() => {
    if (initialized) {
      loadStats();
    }
  }, [initialized]);

  const loadStats = async () => {
    try {
      setLoading(true);

      if (!userId) {
        console.log('No authenticated user');
        setLoading(false);
        return;
      }

      // Fetch all sessions
      const { data: sessionsData } = await getWorkoutSessions(userId, 1000);
      
      if (!sessionsData) {
        setLoading(false);
        return;
      }

      const sessions = sessionsData as WorkoutSession[];
      const completedSessions = sessions.filter(s => s.ended_at);

      // Calculate streaks
      const { currentStreak, longestStreak } = calculateStreaks(sessions);

      // Calculate aggregates
      let totalSets = 0;
      let allSets: WorkoutSet[] = [];
      let totalDuration = 0;

      for (const session of completedSessions) {
        // Add duration
        if (session.total_duration_sec) {
          totalDuration += session.total_duration_sec;
        }

        // Fetch exercises for session
        const { data: exercisesData } = await getWorkoutExercises(session.id);
        if (exercisesData) {
          for (const exercise of exercisesData) {
            // Fetch sets for exercise
            const { data: setsData } = await getWorkoutSets(exercise.id);
            if (setsData) {
              const sets = setsData as WorkoutSet[];
              totalSets += sets.length;
              allSets.push(...sets);
            }
          }
        }
      }

      const totalReps = calculateTotalReps(allSets);
      const totalVolume = calculateTotalVolume(allSets);

      setStats({
        totalWorkouts: completedSessions.length,
        totalSets,
        totalReps,
        totalVolume: Math.round(totalVolume),
        totalDuration: Math.round(totalDuration / 60), // Convert to minutes
        currentStreak,
        longestStreak,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const renderStatCard = (label: string, value: string | number, color: string, icon?: string) => (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color }]}>
        {typeof value === 'number' ? formatNumber(value) : value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Statistics</Text>
      <Text style={styles.subtitle}>Your workout performance at a glance</Text>

      {/* Main Stats Grid */}
      <View style={styles.statsGrid}>
        {renderStatCard('Workouts', stats.totalWorkouts, colors.primary[500])}
        {renderStatCard('Total Sets', stats.totalSets, colors.accent[500])}
      </View>

      <View style={styles.statsGrid}>
        {renderStatCard('Total Reps', stats.totalReps, colors.success.main)}
        {renderStatCard('Volume (kg)', stats.totalVolume, colors.volume)}
      </View>

      <View style={styles.statsGrid}>
        {renderStatCard('Duration (min)', stats.totalDuration, colors.duration)}
        {renderStatCard('Current Streak', stats.currentStreak, colors.streak)}
      </View>

      {/* Large Streak Card */}
      <View style={styles.largeCard}>
        <Text style={styles.largeCardLabel}>Longest Streak</Text>
        <Text style={[styles.largeCardValue, { color: colors.streak }]}>
          {stats.longestStreak} days
        </Text>
        <Text style={styles.largeCardSubtext}>
          Keep up the great work! 🔥
        </Text>
      </View>

      {/* Placeholder for future charts */}
      <View style={styles.chartPlaceholder}>
        <Text style={styles.chartPlaceholderText}>
          📊 Strength Score Chart
        </Text>
        <Text style={styles.chartPlaceholderSubtext}>
          Coming soon
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.dark,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background.dark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: spacing.md,
  },
  title: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.background.elevated,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  statValue: {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  largeCard: {
    backgroundColor: colors.background.elevated,
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  largeCardLabel: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  largeCardValue: {
    fontSize: typography.fontSize['5xl'],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.sm,
  },
  largeCardSubtext: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  chartPlaceholder: {
    backgroundColor: colors.background.elevated,
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  chartPlaceholderText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  chartPlaceholderSubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
});
