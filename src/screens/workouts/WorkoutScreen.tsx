/**
 * WorkoutScreen - Active workout session (timer, set logger)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { useWorkoutTimer } from '@hooks/useWorkoutTimer';
import { useWorkoutStore } from '@store/workoutStore';
import { createWorkoutSet, endWorkoutSession } from '@services/supabase';
import { calculateTotalVolume } from '@utils/fitness';
import { useNavigation } from '@react-navigation/native';

// Progress Ring Component
const ProgressRing = ({ progress, size = 120 }: { progress: number; size?: number }) => {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <Svg width={size} height={size}>
      {/* Background Circle */}
      <Circle
        stroke="#3A3A3C"
        fill="none"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
      />
      {/* Progress Circle */}
      <Circle
        stroke="#3B82F6"
        fill="none"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </Svg>
  );
};

// Motivational messages based on progress
const getMotivationalMessage = (progress: number): string => {
  if (progress === 0) return "Let's crush this workout! 💪";
  if (progress < 25) return "Great start! Keep going! 🔥";
  if (progress < 50) return "You're doing amazing! 🚀";
  if (progress < 75) return "More than halfway there! 💯";
  if (progress < 100) return "Almost done! Finish strong! ⚡";
  return "Incredible work! You crushed it! 🎉";
};

export const WorkoutScreen = () => {
  const { formattedTime, isRunning } = useWorkoutTimer();
  const { activeSession, addSet, toggleExerciseDone, pauseWorkout, resumeWorkout, clearWorkout } = useWorkoutStore();
  const navigation = useNavigation();
  
  const [addingSetFor, setAddingSetFor] = useState<string | null>(null);
  const [celebrationAnim] = useState(new Animated.Value(0));
  const [lastCompletedExercise, setLastCompletedExercise] = useState<string | null>(null);

  // Calculate progress
  const completedExercises = activeSession?.exercises.filter(e => e.isDone).length || 0;
  const totalExercises = activeSession?.exercises.length || 1;
  const progress = (completedExercises / totalExercises) * 100;

  // Celebration animation when exercise is marked done
  useEffect(() => {
    if (activeSession) {
      const lastCompleted = activeSession.exercises.find(e => e.isDone && e.id !== lastCompletedExercise);
      if (lastCompleted) {
        setLastCompletedExercise(lastCompleted.id);
        // Trigger celebration animation
        Animated.sequence([
          Animated.timing(celebrationAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(celebrationAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      }
    }
  }, [activeSession?.exercises]);

  if (!activeSession) {
    return (
      <View style={styles.container}>
        <Text style={styles.noSession}>No active workout</Text>
      </View>
    );
  }

  const handleAddSet = async (exerciseId: string) => {
    const exercise = activeSession.exercises.find(e => e.id === exerciseId);
    if (!exercise) return;

    setAddingSetFor(exerciseId);
    try {
      // Use last set or targets for defaults
      const lastSet = exercise.sets[exercise.sets.length - 1];
      const reps = lastSet?.reps || exercise.targetReps || 10;
      const weight = lastSet?.weight || exercise.targetWeight || null;
      const rir = lastSet?.rir || null;

      const setNumber = exercise.sets.length + 1;
      
      // Don't pass completed_at - DB will use default now()
      const { data, error } = await createWorkoutSet({
        workout_exercise_id: exerciseId,
        set_number: setNumber,
        reps,
        weight,
        rir,
      });

      if (error) {
        console.error('Error creating set:', error);
        Alert.alert('Error', error.message || 'Failed to add set');
        return;
      }

      if (data) {
        const dataTyped = data as any;
        addSet(exerciseId, {
          id: dataTyped.id,
          setNumber,
          reps,
          weight,
          rir,
          completedAt: dataTyped.completed_at || new Date().toISOString(),
        });

        // Auto-mark exercise as done if target sets are reached
        if (exercise.targetSets && setNumber >= exercise.targetSets) {
          toggleExerciseDone(exerciseId);
        }
      }
    } catch (error: any) {
      console.error('Exception adding set:', error);
      Alert.alert('Error', error?.message || 'Failed to add set');
    } finally {
      setAddingSetFor(null);
    }
  };

  const handleEndWorkout = () => {
    Alert.alert(
      'End Workout',
      'Are you sure you want to end this workout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End',
          style: 'destructive',
          onPress: async () => {
            const allSets = activeSession.exercises.flatMap(e => e.sets);
            const durationSec = Math.floor((Date.now() - new Date(activeSession.startedAt).getTime()) / 1000);
            const strengthScore = calculateTotalVolume(allSets);

            await endWorkoutSession(activeSession.sessionId, new Date().toISOString(), durationSec, strengthScore);
            clearWorkout();
            navigation.goBack();
          },
        },
      ]
    );
  };

  // Celebration animation scale
  const celebrationScale = celebrationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });

  return (
    <View style={styles.container}>
      {/* Timer Header with Progress Ring */}
      <LinearGradient
        colors={['#1C1C1E', '#000000']}
        style={styles.timerContainer}
      >
        <View style={styles.timerContent}>
          <View style={styles.progressRingContainer}>
            <ProgressRing progress={progress} size={100} />
            <View style={styles.progressTextContainer}>
              <Text style={styles.progressPercentage}>{Math.round(progress)}%</Text>
            </View>
          </View>
          
          <View style={styles.timerInfo}>
            <Text style={styles.timerLabel}>Time</Text>
            <Text style={styles.timerText}>{formattedTime}</Text>
            <Text style={styles.motivationalText}>{getMotivationalMessage(progress)}</Text>
          </View>
        </View>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{completedExercises}/{totalExercises}</Text>
            <Text style={styles.statLabel}>Exercises</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{activeSession.exercises.reduce((sum, e) => sum + e.sets.length, 0)}</Text>
            <Text style={styles.statLabel}>Sets Completed</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Celebration Overlay */}
      <Animated.View 
        style={[
          styles.celebrationOverlay,
          {
            opacity: celebrationAnim,
            transform: [{ scale: celebrationScale }]
          }
        ]}
        pointerEvents="none"
      >
        <Text style={styles.celebrationText}>🎉 Nice work! 🎉</Text>
      </Animated.View>

      {/* Exercise List */}
      <FlatList
        data={activeSession.exercises}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Animated.View style={[
            styles.exerciseCard,
            item.isDone && styles.exerciseCardDone,
          ]}>
            <View style={styles.exerciseHeader}>
              <View style={styles.exerciseInfo}>
                <View style={styles.exerciseTitleRow}>
                  <Ionicons 
                    name="barbell-outline" 
                    size={24} 
                    color={item.isDone ? '#4CAF50' : '#3B82F6'} 
                  />
                  <Text style={[styles.exerciseName, item.isDone && styles.exerciseNameDone]}>
                    {item.name}
                  </Text>
                </View>
                <Text style={styles.setCount}>
                  {item.sets.length} / {item.targetSets || '—'} sets
                </Text>
              </View>
              <TouchableOpacity 
                style={[styles.checkboxButton, item.isDone && styles.checkboxButtonDone]}
                onPress={() => toggleExerciseDone(item.id)}
              >
                <Ionicons 
                  name={item.isDone ? 'checkmark-circle' : 'ellipse-outline'} 
                  size={32} 
                  color={item.isDone ? '#4CAF50' : '#3B82F6'} 
                />
              </TouchableOpacity>
            </View>

            {/* Sets display */}
            {item.sets.length > 0 && (
              <View style={styles.setsContainer}>
                {item.sets.map((set, idx) => (
                  <View key={set.id} style={[styles.setChip, item.isDone && styles.setChipDone]}>
                    <View style={styles.setChipIcon}>
                      <Ionicons name="checkmark" size={16} color="#4CAF50" />
                    </View>
                    <Text style={styles.setChipText}>
                      Set {idx + 1}: {set.reps} reps{set.weight ? ` @ ${set.weight}kg` : ''}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {!item.isDone && (
              <TouchableOpacity 
                style={[
                  styles.addSetButton, 
                  addingSetFor === item.id && styles.addSetButtonLoading,
                  item.targetSets && item.sets.length >= item.targetSets && styles.addSetButtonDisabled
                ]} 
                onPress={() => handleAddSet(item.id)}
                disabled={
                  addingSetFor === item.id || 
                  (item.targetSets !== null && item.targetSets !== undefined && item.sets.length >= item.targetSets)
                }
              >
                <Ionicons name="add-circle-outline" size={24} color="#FFFFFF" />
                <Text style={styles.addSetText}>
                  {addingSetFor === item.id ? 'Adding...' : 
                   item.targetSets && item.sets.length >= item.targetSets ? 'Complete' : 
                   'Add Set'}
                </Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        )}
      />

      {/* Bottom Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={isRunning ? pauseWorkout : resumeWorkout}
        >
          <Ionicons name={isRunning ? 'pause' : 'play'} size={20} color="#FFFFFF" />
          <Text style={styles.secondaryButtonText}>{isRunning ? 'Pause' : 'Resume'}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.primaryButtonWrapper}
          onPress={handleEndWorkout}
        >
          <LinearGradient
            colors={['#F44336', '#D32F2F']}
            style={styles.primaryButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="stop-circle-outline" size={20} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>End Workout</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  noSession: {
    color: '#8E8E93',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
  timerContainer: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    paddingTop: 48,
  },
  timerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    marginBottom: 24,
  },
  progressRingContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressPercentage: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  timerInfo: {
    flex: 1,
    gap: 4,
  },
  timerLabel: {
    color: '#8E8E93',
    fontSize: 14,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  timerText: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: -1,
  },
  motivationalText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#3A3A3C',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    color: '#8E8E93',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#3A3A3C',
  },
  celebrationOverlay: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  celebrationText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  listContent: {
    padding: 24,
    paddingBottom: 120,
  },
  exerciseCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  exerciseCardDone: {
    borderColor: '#4CAF50',
    backgroundColor: '#1C2E1C',
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  exerciseName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
  },
  exerciseNameDone: {
    color: '#4CAF50',
  },
  setCount: {
    color: '#8E8E93',
    fontSize: 15,
    fontWeight: '500',
  },
  checkboxButton: {
    padding: 4,
  },
  checkboxButtonDone: {
    transform: [{ scale: 1.1 }],
  },
  setsContainer: {
    marginBottom: 16,
    gap: 10,
  },
  setChip: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  setChipDone: {
    borderColor: '#4CAF50',
    backgroundColor: '#1C2E1C',
  },
  setChipIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  setChipText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  addSetButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  addSetButtonLoading: {
    opacity: 0.7,
  },
  addSetButtonDisabled: {
    opacity: 0.5,
    backgroundColor: '#3A3A3C',
  },
  addSetText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  controls: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 24,
    paddingBottom: 32,
    backgroundColor: '#000000',
    borderTopWidth: 1,
    borderTopColor: '#3A3A3C',
  },
  primaryButtonWrapper: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#F44336',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#3B82F6',
    paddingVertical: 18,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
