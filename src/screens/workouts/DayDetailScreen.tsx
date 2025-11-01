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
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
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
} from '@services/supabase';
import { useRoutinesStore } from '@store/routinesStore';
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

  // Form state
  const [exerciseName, setExerciseName] = useState('');
  const [targetSets, setTargetSets] = useState('');
  const [targetReps, setTargetReps] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { addExercise } = useRoutinesStore();

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

  const renderBanner = () => {
    if (!day) return null;

    // TODO: Replace with actual images from Figma or user-uploaded images
    // For now, using gradient backgrounds based on muscle groups
    const getBannerImage = () => {
      // Placeholder: You can add actual images here
      // return require('@assets/images/workout-banner.jpg');
      return null;
    };

    return (
      <View style={styles.banner}>
        {getBannerImage() ? (
          <Image
            source={getBannerImage()!}
            style={styles.bannerImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.bannerPlaceholder} />
        )}
        <View style={styles.bannerOverlay}>
          <View style={styles.tagsContainer}>
            {day.tags.map((tag, index) => (
              <View key={index} style={styles.tagPill}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
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
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Banner with muscle tags */}
        {renderBanner()}

        {/* Exercise List */}
        <View style={styles.exercisesContainer}>
          <Text style={styles.sectionTitle}>Exercises</Text>
          
          {exercises.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="barbell-outline" size={48} color={colors.text.disabled} />
              <Text style={styles.emptyText}>No exercises yet</Text>
              <Text style={styles.emptySubtext}>
                Tap the + button to add exercises
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
                onPress={() => {
                  // TODO: Navigate to exercise detail or edit
                }}
              />
            ))
          )}
        </View>
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
                      <Text style={styles.formLabel}>Weight (kg)</Text>
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
    height: 200,
    backgroundColor: colors.background.card,
    justifyContent: 'flex-end',
    position: 'relative',
  },
  bannerImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  bannerPlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    backgroundColor: colors.background.card,
  },
  bannerOverlay: {
    padding: spacing.md,
    position: 'relative',
    zIndex: 1,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tagPill: {
    backgroundColor: colors.primary[900],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  tagText: {
    color: colors.primary[300],
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
  },
  exercisesContainer: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyText: {
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.text.disabled,
    marginTop: spacing.xs,
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
});
