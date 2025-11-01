/**
 * HomeScreen - Activity calendar, streaks, Today's workout
 * Reference: Figma Frame 1:13 (calendar) + Frame 1:2 (today card)
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '@/types/navigation';
import { Card } from '@components/Card';
import { ScreenHeader } from '@components/ScreenHeader';
import { colors } from '@theme/colors';
import { spacing, borderRadius } from '@theme/spacing';
import { typography } from '@theme/typography';
import { useRoutinesStore } from '@store/routinesStore';
import { getWorkoutSessions, getRoutines, getRoutineDays } from '@services/supabase';
import { calculateStreaks, getWorkoutDatesForMonth, toLocalDateString } from '@utils/streaks';
import { WorkoutSession, Routine, RoutineDay } from '@/types/models';
import { useCurrentUser } from '@hooks/useCurrentUser';

type NavigationProp = NativeStackNavigationProp<HomeStackParamList>;

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const HomeScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { userId, initialized } = useCurrentUser();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [todayRoutine, setTodayRoutine] = useState<{ routine: Routine; day: RoutineDay } | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { currentStreak, longestStreak } = calculateStreaks(sessions);

  useEffect(() => {
    if (initialized) {
      loadData();
    }
  }, [initialized]);

  useFocusEffect(
    React.useCallback(() => {
      if (userId) {
        loadData();
      }
    }, [userId])
  );

  const loadData = async () => {
    try {
      setLoading(true);
      
      if (!userId) {
        console.log('No authenticated user');
        setLoading(false);
        return;
      }
      
      // Fetch sessions and routines
      const [sessionsRes, routinesRes] = await Promise.all([
        getWorkoutSessions(userId),
        getRoutines(userId),
      ]);

      if (sessionsRes.data) {
        setSessions(sessionsRes.data as WorkoutSession[]);
      }

      if (routinesRes.data) {
        const routinesData = routinesRes.data as Routine[];
        setRoutines(routinesData);

        // Get today's workout (first routine, current day of week)
        if (routinesData.length > 0) {
          const firstRoutine = routinesData[0];
          const daysRes = await getRoutineDays(firstRoutine.id);
          
          if (daysRes.data && daysRes.data.length > 0) {
            const today = new Date().getDay(); // 0 = Sunday
            const todayDay = (daysRes.data as RoutineDay[]).find(d => d.day_of_week === today);
            
            if (todayDay) {
              setTodayRoutine({ routine: firstRoutine, day: todayDay });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setLoading(false);
    }
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const workoutDates = getWorkoutDatesForMonth(year, month, sessions);
    const workoutDatesSet = new Set(workoutDates);

    const weeks: (number | null)[][] = [];
    let week: (number | null)[] = new Array(7).fill(null);
    
    // Fill first week
    for (let i = firstDay; i < 7; i++) {
      week[i] = i - firstDay + 1;
    }
    weeks.push([...week]);

    // Fill remaining weeks
    let day = 7 - firstDay + 1;
    while (day <= daysInMonth) {
      week = new Array(7).fill(null);
      for (let i = 0; i < 7 && day <= daysInMonth; i++) {
        week[i] = day;
        day++;
      }
      weeks.push([...week]);
    }

    return (
      <View style={styles.calendarContainer}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
            <Text style={styles.navArrow}>‹</Text>
          </TouchableOpacity>
          
          <Text style={styles.monthTitle}>
            {MONTH_NAMES[month]}, {year}
          </Text>
          
          <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
            <Text style={styles.navArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.weekDays}>
          {DAYS.map((day, index) => (
            <View key={index} style={styles.weekDayCell}>
              <Text style={styles.weekDayText}>{day}</Text>
            </View>
          ))}
        </View>

        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.week}>
            {week.map((day, dayIndex) => {
              if (day === null) {
                return <View key={dayIndex} style={styles.dayCell} />;
              }

              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const hasWorkout = workoutDatesSet.has(dateStr);
              const isToday = dateStr === toLocalDateString(new Date().toISOString());

              return (
                <View key={dayIndex} style={styles.dayCell}>
                  <View style={[styles.dayCircle, isToday && styles.todayCircle]}>
                    <Text style={[styles.dayText, isToday && styles.todayText]}>
                      {day}
                    </Text>
                  </View>
                  {hasWorkout && <View style={styles.workoutDot} />}
                </View>
              );
            })}
          </View>
        ))}
      </View>
    );
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
      <ScreenHeader title="Home" />

      {/* Streaks Section */}
      <View style={styles.streaksContainer}>
        <View style={styles.streakCard}>
          <Text style={styles.streakValue}>{currentStreak}</Text>
          <Text style={styles.streakLabel}>Current Streak</Text>
        </View>
        <View style={styles.streakCard}>
          <Text style={styles.streakValue}>{longestStreak}</Text>
          <Text style={styles.streakLabel}>Longest Streak</Text>
        </View>
      </View>

      {/* Calendar */}
      {renderCalendar()}

      {/* Today's Workout Card */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Today's Workout</Text>
        
        {todayRoutine ? (
          <Card
            title={todayRoutine.routine.name}
            subtitle={`${todayRoutine.day.tags.join(', ')}`}
            tags={todayRoutine.day.tags}
            variant="workout"
            onPress={() => {
              navigation.navigate('DayDetail', {
                routineId: todayRoutine.routine.id,
                dayId: todayRoutine.day.id,
                isToday: true,
              });
            }}
          />
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No workout scheduled for today</Text>
            <Text style={styles.emptySubtext}>
              Create a routine to get started
            </Text>
          </View>
        )}
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
    paddingHorizontal: 32,
    paddingTop: 24,
    paddingBottom: 32,
  },
  streaksContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  streakCard: {
    flex: 1,
    backgroundColor: '#1C1C1E',
    padding: spacing.md,
    borderRadius: 4,
    alignItems: 'center',
  },
  streakValue: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -1,
    color: '#FFFFFF',
    marginBottom: spacing.xs,
  },
  streakLabel: {
    fontSize: 14,
    color: '#8E8E93',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  calendarContainer: {
    backgroundColor: '#1C1C1E',
    borderRadius: 4,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  navButton: {
    padding: 8,
    minWidth: 40,
    alignItems: 'center',
  },
  navArrow: {
    fontSize: 28,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 0,
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  weekDays: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  weekDayText: {
    fontSize: 14,
    fontWeight: typography.fontWeight.medium,
    color: '#8E8E93',
  },
  week: {
    flexDirection: 'row',
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayCircle: {
    backgroundColor: '#3A3A3C',
  },
  dayText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  todayText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  workoutDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.success.main,
  },
  sectionContainer: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: spacing.md,
  },
  emptyCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 4,
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
});
