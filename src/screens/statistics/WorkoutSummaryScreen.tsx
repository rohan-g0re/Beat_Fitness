/**
 * WorkoutSummaryScreen - Display all completed workouts with details
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatisticsStackParamList } from '@types/navigation';
import { colors } from '@theme/colors';
import { spacing, borderRadius } from '@theme/spacing';
import {
  getWorkoutSessions,
  getWorkoutExercises,
  getWorkoutSets,
  getRoutine,
} from '@services/supabase';
import { WorkoutSession, WorkoutExercise, WorkoutSet, Routine } from '@types/models';
import { useCurrentUser } from '@hooks/useCurrentUser';

type Props = NativeStackScreenProps<StatisticsStackParamList, 'WorkoutSummary'>;

interface WorkoutSummary {
  session: WorkoutSession;
  routineName: string | null;
  exercises: Array<{
    exercise: WorkoutExercise;
    sets: WorkoutSet[];
    totalReps: number;
  }>;
}

const WORKOUTS_PER_PAGE = 5;

export const WorkoutSummaryScreen = () => {
  const { userId } = useCurrentUser();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [workouts, setWorkouts] = useState<WorkoutSummary[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const loadWorkouts = useCallback(
    async (currentOffset: number, append: boolean = false) => {
      if (!userId) return;

      try {
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }

        // Fetch workout sessions
        const { data: sessionsData, error: sessionsError } = await getWorkoutSessions(
          userId,
          WORKOUTS_PER_PAGE,
          currentOffset
        );

        if (sessionsError) {
          console.error('Error fetching workout sessions:', sessionsError);
          return;
        }

        if (!sessionsData || sessionsData.length === 0) {
          setHasMore(false);
          return;
        }

        const sessions = sessionsData as WorkoutSession[];
        const workoutSummaries: WorkoutSummary[] = [];

        // Process each session
        for (const session of sessions) {
          // Fetch routine name if routine_id exists
          let routineName: string | null = null;
          if (session.routine_id) {
            const { data: routineData } = await getRoutine(session.routine_id);
            if (routineData) {
              routineName = (routineData as Routine).name;
            }
          }

          // Fetch exercises for this session
          const { data: exercisesData } = await getWorkoutExercises(session.id);
          const exercisesWithSets: WorkoutSummary['exercises'] = [];

          if (exercisesData) {
            const exercises = exercisesData as WorkoutExercise[];

            // Fetch sets for each exercise
            for (const exercise of exercises) {
              const { data: setsData } = await getWorkoutSets(exercise.id);
              const sets = (setsData as WorkoutSet[]) || [];

              // Calculate total reps for this exercise
              const totalReps = sets.reduce((sum, set) => sum + set.reps, 0);

              exercisesWithSets.push({
                exercise,
                sets,
                totalReps,
              });
            }
          }

          workoutSummaries.push({
            session,
            routineName,
            exercises: exercisesWithSets,
          });
        }

        if (append) {
          setWorkouts((prev) => [...prev, ...workoutSummaries]);
        } else {
          setWorkouts(workoutSummaries);
        }

        // Check if there are more workouts to load
        if (sessions.length < WORKOUTS_PER_PAGE) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }
      } catch (error) {
        console.error('Error loading workouts:', error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [userId]
  );

  useEffect(() => {
    if (userId) {
      loadWorkouts(0, false);
      setOffset(0);
      setHasMore(true);
    }
  }, [userId, loadWorkouts]);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore && !loading) {
      const newOffset = offset + WORKOUTS_PER_PAGE;
      setOffset(newOffset);
      loadWorkouts(newOffset, true);
    }
  }, [loadingMore, hasMore, loading, offset, loadWorkouts]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setOffset(0);
    setHasMore(true);
    loadWorkouts(0, false).finally(() => setRefreshing(false));
  }, [loadWorkouts]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Check if same day
    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      })}`;
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    }
  };

  const getWorkoutName = (workout: WorkoutSummary): string => {
    if (workout.routineName) {
      return workout.routineName;
    }
    const date = new Date(workout.session.started_at);
    return `Workout - ${date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })}`;
  };

  const renderWorkoutCard = ({ item }: { item: WorkoutSummary }) => {
    return (
      <View style={styles.workoutCard}>
        <View style={styles.workoutHeader}>
          <View style={styles.workoutHeaderLeft}>
            <Text style={styles.workoutName}>{getWorkoutName(item)}</Text>
            <Text style={styles.workoutDate}>{formatDate(item.session.started_at)}</Text>
          </View>
        </View>

        {item.exercises.length === 0 ? (
          <Text style={styles.emptyExercises}>No exercises recorded</Text>
        ) : (
          <View style={styles.exercisesContainer}>
            {item.exercises.map((exerciseData, index) => (
              <View
                key={exerciseData.exercise.id}
                style={[
                  styles.exerciseRow,
                  index === item.exercises.length - 1 && styles.exerciseRowLast,
                ]}
              >
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{exerciseData.exercise.name}</Text>
                  <Text style={styles.exerciseStats}>
                    {exerciseData.sets.length} set{exerciseData.sets.length !== 1 ? 's' : ''} •{' '}
                    {exerciseData.totalReps} rep{exerciseData.totalReps !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary[500]} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No workouts found</Text>
        <Text style={styles.emptySubtext}>Complete a workout to see it here</Text>
      </View>
    );
  };

  if (loading && workouts.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={workouts}
        renderItem={renderWorkoutCard}
        keyExtractor={(item) => item.session.id}
        contentContainerStyle={styles.listContent}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary[500]}
          />
        }
      />
    </View>
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
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  workoutCard: {
    backgroundColor: colors.background.elevated,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  workoutHeaderLeft: {
    flex: 1,
  },
  workoutName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  workoutDate: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  exercisesContainer: {
    marginTop: spacing.sm,
  },
  exerciseRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  exerciseRowLast: {
    borderBottomWidth: 0,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: spacing.xs / 2,
  },
  exerciseStats: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  emptyExercises: {
    fontSize: 14,
    color: colors.text.secondary,
    fontStyle: 'italic',
    marginTop: spacing.sm,
  },
  footerLoader: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.text.secondary,
  },
});

