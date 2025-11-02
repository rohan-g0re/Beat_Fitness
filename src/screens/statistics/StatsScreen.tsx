/**
 * StatsScreen - Enhanced workout statistics and aggregates
 * Optimized with single-query data fetching and client-side computation
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatisticsStackParamList } from '@/types/navigation';
import { colors } from '@theme/colors';
import { spacing } from '@theme/spacing';
import { getWorkoutStats } from '@services/supabase';
import { calculateStreaks } from '@utils/streaks';
import { computeAllStatistics } from '@utils/statistics';
import { ComputedStatistics } from '@/types/statistics';
import { useCurrentUser } from '@hooks/useCurrentUser';
import { ScreenHeader } from '@components/ScreenHeader';
import { BarChart } from '@components/charts/BarChart';
import { LineChart } from '@components/charts/LineChart';
import { Ionicons } from '@expo/vector-icons';

type NavigationProp = NativeStackNavigationProp<StatisticsStackParamList>;

export const StatsScreen = () => {
  const { userId, initialized } = useCurrentUser();
  const navigation = useNavigation<NavigationProp>();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ComputedStatistics | null>(null);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);

  useEffect(() => {
    if (initialized) {
      loadStats();
    }
  }, [initialized]);

  useFocusEffect(
    React.useCallback(() => {
      if (userId) {
        loadStats();
      }
    }, [userId])
  );

  const loadStats = async () => {
    try {
      setLoading(true);

      if (!userId) {
        console.log('No authenticated user');
        setLoading(false);
        return;
      }

      // Single optimized query - fetches all data with nested relationships
      const { data: sessionsData, error } = await getWorkoutStats(userId);

      if (error) {
        console.error('Error loading workout stats:', error);
        setLoading(false);
        return;
      }

      if (!sessionsData) {
        setLoading(false);
        return;
      }

      // Compute all statistics client-side from the nested data
      const computedStats = computeAllStatistics(sessionsData);
      setStats(computedStats);

      // Calculate streaks
      const streakData = calculateStreaks(sessionsData);
      setCurrentStreak(streakData.currentStreak);
      setLongestStreak(streakData.longestStreak);
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

  const formatPercentage = (value: number): string => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value}%`;
  };

  const getIconForMetric = (label: string): keyof typeof Ionicons.glyphMap => {
    if (label.includes('Workout')) return 'barbell-outline';
    if (label.includes('Volume')) return 'fitness-outline';
    if (label.includes('Streak')) return 'flame-outline';
    if (label.includes('Duration')) return 'time-outline';
    if (label.includes('Sets')) return 'list-outline';
    if (label.includes('Reps')) return 'repeat-outline';
    if (label.includes('RIR')) return 'speedometer-outline';
    return 'stats-chart-outline';
  };

  const renderStatCard = (
    label: string,
    value: string | number,
    color?: string,
    onPress?: () => void
  ) => {
    const icon = getIconForMetric(label);
    
    const cardContent = (
      <>
        <View style={styles.statCardHeader}>
          <Ionicons name={icon} size={24} color={color || colors.primary[500]} />
        </View>
        <Text style={[styles.statValue, color && { color }]}>
          {typeof value === 'number' ? formatNumber(value) : value}
        </Text>
        <Text style={styles.statLabel}>{label}</Text>
      </>
    );

    if (onPress) {
      return (
        <Pressable 
          onPress={onPress} 
          style={({ pressed }) => [
            styles.statCard,
            pressed && styles.statCardPressed
          ]}
        >
          {cardContent}
          <View style={styles.pressableIndicator}>
            <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
          </View>
        </Pressable>
      );
    }

    return <View style={styles.statCard}>{cardContent}</View>;
  };

  const renderComparisonCard = () => {
    if (!stats) return null;

    const { current, previous, changes } = stats.thisWeekVsLastWeek;

    const renderComparisonItem = (
      label: string,
      icon: keyof typeof Ionicons.glyphMap,
      currentVal: number | string,
      changeVal: number
    ) => (
      <View style={styles.comparisonItem}>
        <View style={styles.comparisonIconContainer}>
          <Ionicons name={icon} size={20} color={colors.primary[500]} />
        </View>
        <Text style={styles.comparisonLabel}>{label}</Text>
        <Text style={styles.comparisonValue}>
          {typeof currentVal === 'number' ? formatNumber(currentVal) : currentVal}
        </Text>
        <View style={[
          styles.changeIndicator,
          changeVal > 0 && styles.changeIndicatorPositive,
          changeVal < 0 && styles.changeIndicatorNegative,
        ]}>
          {changeVal !== 0 && (
            <Ionicons
              name={changeVal > 0 ? 'arrow-up' : 'arrow-down'}
              size={12}
              color={changeVal > 0 ? colors.success.main : colors.error.main}
            />
          )}
          <Text
            style={[
              styles.changeText,
              {
                color:
                  changeVal > 0
                    ? colors.success.main
                    : changeVal < 0
                    ? colors.error.main
                    : '#8E8E93',
              },
            ]}
          >
            {formatPercentage(changeVal)}
          </Text>
        </View>
      </View>
    );

    return (
      <View style={styles.comparisonCard}>
        <View style={styles.comparisonHeader}>
          <Ionicons name="calendar-outline" size={24} color={colors.primary[500]} />
          <Text style={styles.comparisonTitle}>This Week vs Last Week</Text>
        </View>

        <View style={styles.comparisonRow}>
          {renderComparisonItem('Workouts', 'barbell-outline', current.workouts, changes.workouts)}
          {renderComparisonItem('Volume', 'fitness-outline', current.volume, changes.volume)}
          {renderComparisonItem('Duration', 'time-outline', current.duration, changes.duration)}
        </View>
      </View>
    );
  };

  const renderPersonalRecords = () => {
    if (!stats || stats.personalRecords.length === 0) return null;

    return (
      <View style={styles.recordsCard}>
        <View style={styles.recordsHeader}>
          <Ionicons name="trophy" size={24} color={colors.accent[500]} />
          <Text style={styles.recordsTitle}>Personal Records</Text>
        </View>
        {stats.personalRecords.map((record, index) => (
          <View key={index} style={[
            styles.recordItem,
            index === 0 && styles.recordItemFirst,
            index === stats.personalRecords.length - 1 && styles.recordItemLast
          ]}>
            <View style={[styles.recordIcon, index < 3 && styles.recordIconTop]}>
              {index < 3 ? (
                <Ionicons 
                  name="medal" 
                  size={24} 
                  color={index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32'} 
                />
              ) : (
                <Ionicons name="barbell" size={20} color="#8E8E93" />
              )}
            </View>
            <View style={styles.recordLeft}>
              <Text style={styles.recordExercise} numberOfLines={1}>
                {record.exerciseName}
              </Text>
              <Text style={styles.recordDetails}>
                {record.maxWeight > 0
                  ? `${record.maxWeight}kg × ${record.maxReps} reps`
                  : `${record.maxReps} reps`}
              </Text>
            </View>
            <View style={styles.recordRight}>
              <Text style={styles.recordVolume}>{formatNumber(record.maxVolume)}</Text>
              <Text style={styles.recordVolumeLabel}>volume</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const muscleGroupChartData = useMemo(() => {
    if (!stats) return [];
    return stats.muscleGroups.map(mg => ({
      label: mg.muscleGroup,
      value: mg.volume,
      color: colors.primary[500],
    }));
  }, [stats]);

  const strengthTrendChartData = useMemo(() => {
    if (!stats) return [];
    return stats.strengthTrend.map((point, index) => ({
      x: index + 1,
      y: point.strengthScore,
      label: point.date,
    }));
  }, [stats]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={styles.loadingText}>Loading statistics...</Text>
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.emptyText}>No workout data available</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader title="Statistics" />
      <Text style={styles.subtitle}>Your complete workout analytics</Text>

      {/* Quick Overview Cards */}
      <View style={styles.statsGrid}>
        {renderStatCard(
          'Total Workouts',
          stats.allTime.totalWorkouts,
          colors.primary[500],
          () => navigation.navigate('WorkoutSummary')
        )}
        {renderStatCard('Total Volume', formatNumber(stats.allTime.totalVolume), colors.volume)}
      </View>

      <View style={styles.statsGrid}>
        {renderStatCard('Current Streak', currentStreak, colors.streak)}
        {renderStatCard('Avg Duration', `${stats.allTime.avgDuration} min`, colors.duration)}
      </View>

      {/* Period Comparison */}
      {renderComparisonCard()}

      {/* Average Metrics */}
      <View style={styles.sectionHeader}>
        <Ionicons name="analytics-outline" size={24} color={colors.primary[500]} />
        <Text style={styles.sectionTitle}>Averages</Text>
      </View>
      <View style={styles.statsGrid}>
        {renderStatCard('Sets/Workout', stats.allTime.avgSetsPerWorkout.toFixed(1))}
        {renderStatCard('Volume/Workout', formatNumber(stats.allTime.avgVolumePerWorkout))}
      </View>

      <View style={styles.statsGrid}>
        {renderStatCard('Reps/Set', stats.allTime.avgRepsPerSet.toFixed(1))}
        {renderStatCard(
          'Avg RIR',
          stats.allTime.avgRir !== null ? stats.allTime.avgRir.toFixed(1) : 'N/A'
        )}
      </View>

      {/* Muscle Group Breakdown */}
      {muscleGroupChartData.length > 0 && (
        <BarChart data={muscleGroupChartData} title="Volume by Muscle Group" maxBars={7} />
      )}

      {/* Personal Records */}
      {renderPersonalRecords()}

      {/* Strength Score Trend */}
      {strengthTrendChartData.length > 0 && (
        <LineChart
          data={strengthTrendChartData}
          title="Strength Score Progression"
          height={250}
        />
      )}

      {/* Longest Streak Card */}
      <View style={styles.largeCard}>
        <View style={styles.streakIcon}>
          <Ionicons name="flame" size={48} color={colors.streak} />
        </View>
        <Text style={styles.largeCardLabel}>Longest Streak</Text>
        <Text style={[styles.largeCardValue, { color: colors.streak }]}>
          {longestStreak} {longestStreak === 1 ? 'day' : 'days'}
        </Text>
        <Text style={styles.largeCardSubtext}>Keep the fire burning! 🔥</Text>
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
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: '#8E8E93',
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  content: {
    paddingHorizontal: 32,
    paddingTop: 24,
    paddingBottom: 32,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1C1C1E',
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
    position: 'relative',
  },
  statCardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  statCardHeader: {
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: -1.5,
    color: '#FFFFFF',
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: 13,
    color: '#8E8E93',
    letterSpacing: 0.3,
    textAlign: 'center',
    fontWeight: '500',
  },
  pressableIndicator: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
  comparisonCard: {
    backgroundColor: '#1C1C1E',
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  comparisonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  comparisonTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: spacing.sm,
  },
  comparisonItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  comparisonIconContainer: {
    marginBottom: spacing.xs,
  },
  comparisonLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: spacing.xs,
    fontWeight: '500',
  },
  comparisonValue: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#2C2C2E',
  },
  changeIndicatorPositive: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
  },
  changeIndicatorNegative: {
    backgroundColor: 'rgba(244, 67, 54, 0.15)',
  },
  changeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  recordsCard: {
    backgroundColor: '#1C1C1E',
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  recordsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  recordsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  recordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
    gap: spacing.md,
  },
  recordItemFirst: {
    paddingTop: 0,
  },
  recordItemLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  recordIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2C2C2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordIconTop: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  recordLeft: {
    flex: 1,
  },
  recordExercise: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  recordDetails: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  recordRight: {
    alignItems: 'flex-end',
  },
  recordVolume: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary[500],
    letterSpacing: -0.5,
  },
  recordVolumeLabel: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '500',
    marginTop: 2,
  },
  largeCard: {
    backgroundColor: '#1C1C1E',
    padding: spacing.xl,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: spacing.sm,
    shadowColor: colors.streak,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.2)',
  },
  streakIcon: {
    marginBottom: spacing.md,
  },
  largeCardLabel: {
    fontSize: 15,
    color: '#8E8E93',
    letterSpacing: 0.3,
    marginBottom: spacing.md,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  largeCardValue: {
    fontSize: 56,
    fontWeight: '700',
    letterSpacing: -2,
    color: '#FFFFFF',
    marginBottom: spacing.sm,
  },
  largeCardSubtext: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
});
