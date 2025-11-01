/**
 * WorkoutScreen - Active workout session (timer, set logger)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { useWorkoutTimer } from '@hooks/useWorkoutTimer';
import { useWorkoutStore } from '@store/workoutStore';
import { createWorkoutSet, endWorkoutSession } from '@services/supabase';
import { calculateTotalVolume } from '@utils/fitness';
import { useNavigation } from '@react-navigation/native';

export const WorkoutScreen = () => {
  const { formattedTime, isRunning } = useWorkoutTimer();
  const { activeSession, addSet, toggleExerciseDone, pauseWorkout, resumeWorkout, clearWorkout } = useWorkoutStore();
  const navigation = useNavigation();
  
  const [addingSetFor, setAddingSetFor] = useState<string | null>(null);

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

  return (
    <View style={styles.container}>
      {/* Timer Header */}
      <View style={styles.timerContainer}>
        <Text style={styles.timerLabel}>Workout Timer</Text>
        <Text style={styles.timerText}>{formattedTime}</Text>
      </View>

      {/* Exercise List */}
      <FlatList
        data={activeSession.exercises}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={[styles.exerciseCard, item.isDone && styles.exerciseCardDone]}>
            <View style={styles.exerciseHeader}>
              <View style={styles.exerciseInfo}>
                <Text style={[styles.exerciseName, item.isDone && styles.exerciseNameDone]}>
                  {item.name}
                </Text>
                <Text style={styles.setCount}>
                  {item.sets.length} / {item.targetSets || '—'} sets
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.checkboxButton}
                onPress={() => toggleExerciseDone(item.id)}
              >
                <Text style={styles.checkbox}>{item.isDone ? '☑️' : '☐'}</Text>
              </TouchableOpacity>
            </View>

            {/* Sets display */}
            {item.sets.length > 0 && (
              <View style={styles.setsContainer}>
                {item.sets.map((set, idx) => (
                  <View key={set.id} style={styles.setChip}>
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
                  // Disable if target sets reached
                  item.targetSets && item.sets.length >= item.targetSets && styles.addSetButtonDisabled
                ]} 
                onPress={() => handleAddSet(item.id)}
                disabled={
                  addingSetFor === item.id || 
                  (item.targetSets !== null && item.targetSets !== undefined && item.sets.length >= item.targetSets)
                }
              >
                <Text style={styles.addSetIcon}>+</Text>
                <Text style={styles.addSetText}>
                  {addingSetFor === item.id ? 'Adding...' : 
                   item.targetSets && item.sets.length >= item.targetSets ? 'Complete' : 
                   'Add Set'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />

      {/* Bottom Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={isRunning ? pauseWorkout : resumeWorkout}
        >
          <Text style={styles.secondaryButtonText}>{isRunning ? 'Pause' : 'Resume'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryButton} onPress={handleEndWorkout}>
          <Text style={styles.primaryButtonText}>End Workout</Text>
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
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
  timerContainer: {
    paddingHorizontal: 32,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A3C',
  },
  timerLabel: {
    color: '#8E8E93',
    fontSize: 14,
    letterSpacing: 0.2,
    marginBottom: 8,
  },
  timerText: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: -1,
  },
  listContent: {
    padding: 32,
    paddingBottom: 100,
  },
  exerciseCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 4,
    padding: 20,
    marginBottom: 16,
  },
  exerciseCardDone: {
    opacity: 0.4,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  exerciseNameDone: {
    textDecorationLine: 'line-through',
  },
  setCount: {
    color: '#8E8E93',
    fontSize: 14,
  },
  checkboxButton: {
    padding: 4,
  },
  checkbox: {
    fontSize: 28,
  },
  setsContainer: {
    marginBottom: 12,
    gap: 8,
  },
  setChip: {
    backgroundColor: '#2C2C2E',
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  setChipText: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  addSetButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: 4,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addSetButtonLoading: {
    opacity: 0.5,
  },
  addSetButtonDisabled: {
    opacity: 0.3,
    borderColor: '#8E8E93',
  },
  addSetIcon: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  addSetText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  controls: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 32,
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: '#3A3A3C',
    backgroundColor: '#000000',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    borderRadius: 4,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    paddingVertical: 18,
    borderRadius: 4,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
