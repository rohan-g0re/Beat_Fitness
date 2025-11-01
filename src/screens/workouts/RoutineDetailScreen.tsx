/**
 * RoutineDetailScreen - Display Mon-Sun day cards for a routine
 * Reference: Figma Frame 1:19 Screen 2
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { WorkoutsStackParamList } from '@types/navigation';
import { Card } from '@components/Card';
import { colors } from '@theme/colors';
import { spacing } from '@theme/spacing';
import { typography } from '@theme/typography';
import { getRoutine, getRoutineDays, getRoutineExercises, upsertRoutineDay } from '@services/supabase';
import { Routine, RoutineDay } from '@types/models';

type Props = NativeStackScreenProps<WorkoutsStackParamList, 'RoutineDetail'>;

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const RoutineDetailScreen = ({ route, navigation }: Props) => {
  const { routineId } = route.params;
  const [loading, setLoading] = useState(true);
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [days, setDays] = useState<RoutineDay[]>([]);
  const [exerciseCounts, setExerciseCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    loadRoutineData();
  }, [routineId]);

  const loadRoutineData = async () => {
    try {
      setLoading(true);

      // Fetch routine details
      const routineRes = await getRoutine(routineId);
      if (routineRes.data) {
        const routineData = routineRes.data as Routine;
        setRoutine(routineData);
        navigation.setOptions({
          title: routineData.name,
        });
      }

      // Fetch days
      const daysRes = await getRoutineDays(routineId);
      if (daysRes.data) {
        const daysData = (daysRes.data as RoutineDay[]).sort(
          (a, b) => a.dayOfWeek - b.dayOfWeek
        );
        setDays(daysData);

        // Count exercises for each day
        const counts: Record<string, number> = {};
        for (const day of daysData) {
          const exercisesRes = await getRoutineExercises(day.id);
          counts[day.id] = exercisesRes.data?.length || 0;
        }
        setExerciseCounts(counts);
      }
    } catch (error) {
      console.error('Error loading routine data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDayAndNavigate = async (dayOfWeek: number) => {
    try {
      // Create routine day with empty tags (DB default) if it doesn't exist
      const { data, error } = await upsertRoutineDay({
        routine_id: routineId,
        day_of_week: dayOfWeek,
        // tags omitted -> DB default '[]'
      } as any);

      if (error) {
        console.error('Error creating routine day:', error);
        return;
      }

      if (data) {
        // Refresh local days list and counts
        await loadRoutineData();
        // Navigate to newly created day
        navigation.navigate('DayDetail', {
          routineId,
          dayId: (data as any).id,
        });
      }
    } catch (e) {
      console.error('Error creating routine day:', e);
    }
  };

  // Create full week array with placeholders for missing days
  const getFullWeek = () => {
    const fullWeek: (RoutineDay | null)[] = [];
    for (let i = 0; i < 7; i++) {
      const day = days.find(d => d.dayOfWeek === i);
      fullWeek.push(day || null);
    }
    return fullWeek;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.subtitle}>Select a day to view or edit exercises</Text>

      {getFullWeek().map((day, index) => {
        if (!day) {
          // Empty day slot → Create on tap, then navigate
          return (
            <Card
              key={`empty-${index}`}
              title={DAY_NAMES[index]}
              subtitle="Rest day"
              variant="day"
              onPress={() => createDayAndNavigate(index)}
            />
          );
        }

        const exerciseCount = exerciseCounts[day.id] || 0;

        return (
          <Card
            key={day.id}
            title={DAY_NAMES[day.dayOfWeek]}
            subtitle={
              exerciseCount > 0
                ? `${exerciseCount} exercise${exerciseCount !== 1 ? 's' : ''}`
                : 'No exercises yet'
            }
            tags={day.tags}
            variant="day"
            onPress={() => {
              navigation.navigate('DayDetail', {
                routineId,
                dayId: day.id,
              });
            }}
          />
        );
      })}
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
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
});
