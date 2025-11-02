/**
 * DayDetailScreen - Shared day/exercise view for Home and Workouts tabs
 * Reference: Figma Frame 1:2 Screen 2 (banner) + Frame 1:19 Screen 2 (list)
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Modal,
  Pressable,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { WorkoutsStackParamList, HomeStackParamList } from '../../types/navigation';
import { Card } from '@components/Card';
import { colors } from '@theme/colors';
import { spacing, borderRadius } from '@theme/spacing';
import { typography } from '@theme/typography';
import { Ionicons } from '@expo/vector-icons';
import {
  getRoutineExercises,
  createRoutineExercise,
  getRoutineDays,
  updateRoutineExercise,
  deleteRoutineExercise,
  createWorkoutSession,
  createWorkoutExercise,
} from '@services/supabase';
import { useRoutinesStore } from '@store/routinesStore';
import { useWorkoutStore } from '@store/workoutStore';
import { useCurrentUser } from '@hooks/useCurrentUser';
import type { RoutineExercise, RoutineDay } from '../../types/models';

type Props =
  | NativeStackScreenProps<WorkoutsStackParamList, 'DayDetail'>
  | NativeStackScreenProps<HomeStackParamList, 'DayDetail'>;

export const DayDetailScreen = ({ route, navigation }: Props) => {
  const { routineId, dayId } = route.params;
  const [loading, setLoading] = useState(true);
  const [exercises, setExercises] = useState<RoutineExercise[]>([]);
  const [day, setDay] = useState<RoutineDay | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingExercise, setEditingExercise] = useState<RoutineExercise | null>(null);
  const [startingWorkout, setStartingWorkout] = useState(false);

  // Form state
  const [exerciseName, setExerciseName] = useState('');
  const [targetSets, setTargetSets] = useState('');
  const [targetReps, setTargetReps] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { addExercise } = useRoutinesStore();
  const { startWorkout, activeSession } = useWorkoutStore();
  const { userId } = useCurrentUser();

  useEffect(() => {
    loadData();
  }, [dayId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Fetch day details
      const daysRes = await getRoutineDays(routineId);
      if (daysRes.data) {
        const dayData = (daysRes.data as RoutineDay[]).find(d => d.id === dayId);
        if (dayData) {
          setDay(dayData);
          navigation.setOptions({
            title: getDayName(dayData.day_of_week),
          });
        }
      }

      // Fetch exercises
      const exercisesRes = await getRoutineExercises(dayId);
      if (exercisesRes.data) {
        setExercises(exercisesRes.data as RoutineExercise[]);
      }
    } catch (error) {
      console.error('Error loading day data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDayName = (dayOfWeek: number): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek] || 'Day';
  };

  const handleAddExercise = async () => {
    if (!exerciseName.trim()) return;

    try {
      setSubmitting(true);

      const newExercise: any = {
        routine_day_id: dayId,
        name: exerciseName.trim(),
        target_sets: targetSets ? parseInt(targetSets, 10) : null,
        target_reps: targetReps ? parseInt(targetReps, 10) : null,
        target_weight: targetWeight ? parseFloat(targetWeight) : null,
        notes: null,
        sort_order: exercises.length,
      };

      const { data, error } = await createRoutineExercise(newExercise);

      if (error) {
        console.error('Error creating exercise:', error);
        return;
      }

      if (data) {
        // Add to local state
        setExercises([...exercises, data as RoutineExercise]);
        
        // Update store
        addExercise(data as RoutineExercise);

        // Reset form
        setExerciseName('');
        setTargetSets('');
        setTargetReps('');
        setTargetWeight('');
        setShowManualForm(false);
        setShowAddModal(false);
      }
    } catch (error) {
      console.error('Error adding exercise:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditExercise = (exercise: RoutineExercise) => {
    setEditingExercise(exercise);
    setExerciseName(exercise.name);
    setTargetSets(exercise.target_sets?.toString() || '');
    setTargetReps(exercise.target_reps?.toString() || '');
    setTargetWeight(exercise.target_weight?.toString() || '');
    setShowEditModal(true);
  };

  const handleUpdateExercise = async () => {
    if (!exerciseName.trim() || !editingExercise) return;

    try {
      setSubmitting(true);

      const updates: any = {
        name: exerciseName.trim(),
        target_sets: targetSets ? parseInt(targetSets, 10) : null,
        target_reps: targetReps ? parseInt(targetReps, 10) : null,
        target_weight: targetWeight ? parseFloat(targetWeight) : null,
      };

      const { data, error } = await updateRoutineExercise(editingExercise.id, updates);

      if (error) {
        console.error('Error updating exercise:', error);
        return;
      }

      if (data) {
        // Update local state
        setExercises(exercises.map(ex => ex.id === editingExercise.id ? data as RoutineExercise : ex));

        // Reset form
        setExerciseName('');
        setTargetSets('');
        setTargetReps('');
        setTargetWeight('');
        setEditingExercise(null);
        setShowEditModal(false);
      }
    } catch (error) {
      console.error('Error updating exercise:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExercise = async (exerciseId: string) => {
    Alert.alert(
      'Delete Exercise',
      'Are you sure you want to delete this exercise?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await deleteRoutineExercise(exerciseId);

              if (error) {
                console.error('Error deleting exercise:', error);
                return;
              }

              // Remove from local state
              setExercises(exercises.filter(ex => ex.id !== exerciseId));
            } catch (error) {
              console.error('Error deleting exercise:', error);
            }
          },
        },
      ]
    );
  };

  const handleStartWorkout = async () => {
    if (!userId) {
      Alert.alert('Error', 'Please sign in to start a workout');
      return;
    }

    if (exercises.length === 0) {
      Alert.alert('No Exercises', 'Please add exercises before starting a workout');
      return;
    }

    setStartingWorkout(true);
    try {
      const { data: session, error: sessionError } = await createWorkoutSession({
        user_id: userId,
        routine_id: routineId,
        routine_day_id: dayId,
        started_at: new Date().toISOString(),
      });

      if (sessionError || !session) {
        Alert.alert('Error', 'Could not start workout');
        console.error('Session creation error:', sessionError);
        return;
      }

      const sessionId = (session as any).id as string;

      const createdExercises = await Promise.all(
        exercises.map((rx) =>
          createWorkoutExercise({
            session_id: sessionId,
            name: rx.name,
            sort_order: rx.sort_order,
          })
        )
      );

      const exerciseList = createdExercises
        .map((res, i) => {
          if (!res.data) return null;
          const data = res.data as any;
          return {
            id: data.id as string,
            name: data.name as string,
            sortOrder: data.sort_order as number,
            targetSets: exercises[i].target_sets,
            targetReps: exercises[i].target_reps,
            targetWeight: exercises[i].target_weight,
            sets: [],
            isDone: false,
          };
        })
        .filter((ex): ex is NonNullable<typeof ex> => ex !== null);

      startWorkout(sessionId, routineId, dayId, exerciseList);

      // Navigate to ActiveWorkout
      if ('navigate' in navigation) {
        (navigation as any).navigate('ActiveWorkout');
      }
    } catch (error) {
      console.error('Failed to start workout:', error);
      Alert.alert('Error', 'Could not start workout');
    } finally {
      setStartingWorkout(false);
    }
  };

  const handleResumeWorkout = () => {
    if ('navigate' in navigation) {
      (navigation as any).navigate('ActiveWorkout');
    }
  };

  // Get exercise icon based on name
  const getExerciseIcon = (name: string): 'barbell' | 'dumbbell' | 'fitness' | 'body' => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('squat') || lowerName.includes('deadlift') || lowerName.includes('bench')) return 'barbell';
    if (lowerName.includes('curl') || lowerName.includes('press') || lowerName.includes('raise')) return 'dumbbell';
    if (lowerName.includes('plank') || lowerName.includes('push') || lowerName.includes('pull')) return 'body';
    return 'fitness';
  };

  // Get muscle group color for banner gradient
  const getBannerGradient = (): [string, string] => {
    if (!day || day.tags.length === 0) return ['#1E3A8A', '#3B82F6'];
    const firstTag = day.tags[0].toLowerCase();
    if (firstTag.includes('chest')) return ['#DC2626', '#F87171'];
    if (firstTag.includes('back')) return ['#0891B2', '#22D3EE'];
    if (firstTag.includes('legs')) return ['#7C3AED', '#A78BFA'];
    if (firstTag.includes('shoulder')) return ['#EA580C', '#FB923C'];
    if (firstTag.includes('arms')) return ['#3B82F6', '#60A5FA'];
    if (firstTag.includes('core')) return ['#F59E0B', '#FCD34D'];
    return ['#1E3A8A', '#3B82F6'];
  };

  const renderBanner = () => {
    if (!day) return null;

    return (
      <LinearGradient 
        colors={getBannerGradient()}
        style={styles.banner}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.bannerOverlay}>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>{getDayName(day.day_of_week)}</Text>
            <View style={styles.tagsContainer}>
              {day.tags.map((tag, index) => (
                <View key={index} style={styles.tagPill}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </LinearGradient>
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
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Banner with muscle tags */}
        {renderBanner()}

        {/* Exercise List */}
        <View style={styles.exercisesContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Exercises</Text>
            {exercises.length > 0 && (
              <View style={styles.exerciseCount}>
                <Text style={styles.exerciseCountText}>{exercises.length}</Text>
              </View>
            )}
          </View>
          
          {exercises.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="barbell-outline" size={64} color={colors.primary[500]} />
              </View>
              <Text style={styles.emptyText}>No exercises yet</Text>
              <Text style={styles.emptySubtext}>
                Tap the + button below to add your first exercise
              </Text>
            </View>
          ) : (
            exercises.map((exercise: any) => (
              <Card
                key={exercise.id}
                title={exercise.name}
                subtitle={`${exercise.target_sets || '-'} sets × ${exercise.target_reps || '-'} reps${
                  exercise.target_weight ? ` @ ${exercise.target_weight}kg` : ''
                }`}
                variant="exercise"
                icon={getExerciseIcon(exercise.name)}
                iconColor={colors.primary[500]}
                showEditIcon={true}
                onEditPress={() => handleEditExercise(exercise)}
              />
            ))
          )}
        </View>

        {/* Start Workout Button */}
        {exercises.length > 0 && (
          <View style={styles.workoutButtonContainer}>
            {activeSession?.routineDayId === dayId ? (
              <TouchableOpacity
                style={styles.startWorkoutButtonWrapper}
                onPress={handleResumeWorkout}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#34D399', '#059669']}
                  style={styles.startWorkoutButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="play-circle-outline" size={24} color="#000000" />
                  <Text style={styles.startWorkoutButtonText}>Resume Workout</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.startWorkoutButtonWrapper, startingWorkout && { opacity: 0.6 }]}
                onPress={handleStartWorkout}
                disabled={startingWorkout}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#3B82F6', '#1E3A8A']}
                  style={styles.startWorkoutButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {startingWorkout ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="barbell-outline" size={24} color="#FFFFFF" />
                      <Text style={styles.startWorkoutButtonText}>Start Workout</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* FAB - Add Exercise */}
      <Pressable
        style={styles.fab}
        onPress={() => setShowAddModal(true)}
      >
        <Ionicons name="add" size={24} color={colors.text.primary} />
      </Pressable>

      {/* Add Exercise Modal - Choose Manual/AI */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowAddModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Exercise</Text>
            
            <Pressable
              style={styles.modalButton}
              onPress={() => {
                setShowAddModal(false);
                setShowManualForm(true);
              }}
            >
              <Ionicons name="create-outline" size={24} color={colors.primary[500]} />
              <Text style={styles.modalButtonText}>Manual Entry</Text>
            </Pressable>

            <Pressable
              style={[styles.modalButton, styles.modalButtonDisabled]}
              disabled
            >
              <Ionicons name="sparkles-outline" size={24} color={colors.text.disabled} />
              <Text style={[styles.modalButtonText, styles.modalButtonTextDisabled]}>
                AI Suggest (Coming Soon)
              </Text>
            </Pressable>

            <Pressable
              style={styles.modalCancelButton}
              onPress={() => setShowAddModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Manual Form Modal */}
      <Modal
        visible={showManualForm}
        transparent
        animationType="slide"
        onRequestClose={() => setShowManualForm(false)}
      >
        <Pressable style={styles.formOverlay} onPress={() => setShowManualForm(false)}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
          >
            <Pressable style={styles.formContent} onPress={() => {}}>
              <View style={styles.formHandle} />

              <ScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 16 }}
              >
                <Text style={styles.formTitle}>Add Exercise Manually</Text>

                <View style={styles.formFields}>
                  <View style={styles.formField}>
                    <Text style={styles.formLabel}>Exercise Name *</Text>
                    <TextInput
                      style={styles.formInput}
                      value={exerciseName}
                      onChangeText={setExerciseName}
                      placeholder="e.g., Bench Press"
                      placeholderTextColor={colors.text.disabled}
                      returnKeyType="done"
                    />
                  </View>

                  <View style={styles.formRow}>
                    <View style={[styles.formField, { flex: 1 }]}>
                      <Text style={styles.formLabel}>Sets</Text>
                      <TextInput
                        style={styles.formInput}
                        value={targetSets}
                        onChangeText={setTargetSets}
                        placeholder="3"
                        keyboardType="number-pad"
                        placeholderTextColor={colors.text.disabled}
                        returnKeyType="done"
                      />
                    </View>

                    <View style={[styles.formField, { flex: 1 }]}>
                      <Text style={styles.formLabel}>Reps</Text>
                      <TextInput
                        style={styles.formInput}
                        value={targetReps}
                        onChangeText={setTargetReps}
                        placeholder="10"
                        keyboardType="number-pad"
                        placeholderTextColor={colors.text.disabled}
                        returnKeyType="done"
                      />
                    </View>

                    <View style={[styles.formField, { flex: 1 }]}>
                      <Text style={styles.formLabel}>Target Weight</Text>
                      <TextInput
                        style={styles.formInput}
                        value={targetWeight}
                        onChangeText={setTargetWeight}
                        placeholder="50"
                        keyboardType="decimal-pad"
                        placeholderTextColor={colors.text.disabled}
                        returnKeyType="done"
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.formButtons}>
                  <Pressable
                    style={[styles.formButton, styles.formButtonSecondary]}
                    onPress={() => setShowManualForm(false)}
                  >
                    <Text style={styles.formButtonSecondaryText}>Cancel</Text>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.formButton,
                      styles.formButtonPrimary,
                      (!exerciseName.trim() || submitting) && styles.formButtonDisabled,
                    ]}
                    onPress={handleAddExercise}
                    disabled={!exerciseName.trim() || submitting}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color={colors.text.primary} />
                    ) : (
                      <Text style={styles.formButtonPrimaryText}>Add Exercise</Text>
                    )}
                  </Pressable>
                </View>
              </ScrollView>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>

      {/* Edit Exercise Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowEditModal(false);
          setEditingExercise(null);
          setExerciseName('');
          setTargetSets('');
          setTargetReps('');
          setTargetWeight('');
        }}
      >
        <Pressable
          style={styles.formOverlay}
          onPress={() => {
            setShowEditModal(false);
            setEditingExercise(null);
            setExerciseName('');
            setTargetSets('');
            setTargetReps('');
            setTargetWeight('');
          }}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
          >
            <Pressable style={styles.formContent} onPress={() => {}}>
              <View style={styles.formHandle} />

              <ScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 16 }}
              >
                <Text style={styles.formTitle}>Edit Exercise</Text>

                <View style={styles.formFields}>
                  <View style={styles.formField}>
                    <Text style={styles.formLabel}>Exercise Name *</Text>
                    <TextInput
                      style={styles.formInput}
                      value={exerciseName}
                      onChangeText={setExerciseName}
                      placeholder="e.g., Bench Press"
                      placeholderTextColor={colors.text.disabled}
                      returnKeyType="done"
                    />
                  </View>

                  <View style={styles.formRow}>
                    <View style={[styles.formField, { flex: 1 }]}>
                      <Text style={styles.formLabel}>Sets</Text>
                      <TextInput
                        style={styles.formInput}
                        value={targetSets}
                        onChangeText={setTargetSets}
                        placeholder="3"
                        keyboardType="number-pad"
                        placeholderTextColor={colors.text.disabled}
                        returnKeyType="done"
                      />
                    </View>

                    <View style={[styles.formField, { flex: 1 }]}>
                      <Text style={styles.formLabel}>Reps</Text>
                      <TextInput
                        style={styles.formInput}
                        value={targetReps}
                        onChangeText={setTargetReps}
                        placeholder="10"
                        keyboardType="number-pad"
                        placeholderTextColor={colors.text.disabled}
                        returnKeyType="done"
                      />
                    </View>

                    <View style={[styles.formField, { flex: 1 }]}>
                      <Text style={styles.formLabel}>Target Weight</Text>
                      <TextInput
                        style={styles.formInput}
                        value={targetWeight}
                        onChangeText={setTargetWeight}
                        placeholder="50"
                        keyboardType="decimal-pad"
                        placeholderTextColor={colors.text.disabled}
                        returnKeyType="done"
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.formButtons}>
                  <Pressable
                    style={[styles.formButton, styles.formButtonSecondary]}
                    onPress={() => {
                      setShowEditModal(false);
                      setEditingExercise(null);
                      setExerciseName('');
                      setTargetSets('');
                      setTargetReps('');
                      setTargetWeight('');
                    }}
                  >
                    <Text style={styles.formButtonSecondaryText}>Cancel</Text>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.formButton,
                      styles.formButtonPrimary,
                      (!exerciseName.trim() || submitting) && styles.formButtonDisabled,
                    ]}
                    onPress={handleUpdateExercise}
                    disabled={!exerciseName.trim() || submitting}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color={colors.text.primary} />
                    ) : (
                      <Text style={styles.formButtonPrimaryText}>Update</Text>
                    )}
                  </Pressable>
                </View>

                {/* Delete Button */}
                <Pressable
                  style={[styles.formButton, styles.deleteButton]}
                  onPress={() => {
                    if (editingExercise) {
                      setShowEditModal(false);
                      handleDeleteExercise(editingExercise.id);
                      setEditingExercise(null);
                      setExerciseName('');
                      setTargetSets('');
                      setTargetReps('');
                      setTargetWeight('');
                    }
                  }}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.error.main} />
                  <Text style={styles.deleteButtonText}>Delete Exercise</Text>
                </Pressable>
              </ScrollView>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
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
  content: {
    paddingBottom: 80,
  },
  banner: {
    height: 220,
    justifyContent: 'flex-end',
    position: 'relative',
  },
  bannerOverlay: {
    padding: spacing.lg,
    position: 'relative',
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  bannerContent: {
    gap: spacing.md,
  },
  bannerTitle: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tagPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  tagText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  exercisesContainer: {
    padding: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  exerciseCount: {
    backgroundColor: colors.primary[500],
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseCountText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['4xl'],
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${colors.primary[500]}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  emptyText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalContent: {
    backgroundColor: colors.background.elevated,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
  modalButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  modalButtonTextDisabled: {
    color: colors.text.disabled,
  },
  modalCancelButton: {
    padding: spacing.md,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  formOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  formContent: {
    backgroundColor: colors.background.elevated,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  formHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.gray[700],
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  formTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  formFields: {
    gap: spacing.md,
  },
  formRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  formField: {
    marginBottom: spacing.sm,
  },
  formLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  formInput: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  formButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  formButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  formButtonPrimary: {
    backgroundColor: colors.primary[500],
  },
  formButtonSecondary: {
    backgroundColor: colors.background.card,
  },
  formButtonDisabled: {
    opacity: 0.5,
  },
  formButtonPrimaryText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  formButtonSecondaryText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
  },
  deleteButton: {
    flexDirection: 'row',
    backgroundColor: colors.background.card,
    marginTop: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.error.main,
  },
  deleteButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.error.main,
  },
  workoutButtonContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  startWorkoutButtonWrapper: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  startWorkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  startWorkoutButtonText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.5,
  },
});
