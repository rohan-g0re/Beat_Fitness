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
  Pressable,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { WorkoutsStackParamList } from '@types/navigation';
import { Card } from '@components/Card';
import { colors } from '@theme/colors';
import { spacing, borderRadius } from '@theme/spacing';
import { typography } from '@theme/typography';
import { Ionicons } from '@expo/vector-icons';
import {
  getRoutine,
  getRoutineDays,
  getRoutineExercises,
  upsertRoutineDay,
  updateRoutine,
  deleteRoutine,
} from '@services/supabase';
import { Routine, RoutineDay } from '@types/models';

type Props = NativeStackScreenProps<WorkoutsStackParamList, 'RoutineDetail'>;

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const RoutineDetailScreen = ({ route, navigation }: Props) => {
  const { routineId } = route.params;
  const [loading, setLoading] = useState(true);
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [days, setDays] = useState<RoutineDay[]>([]);
  const [exerciseCounts, setExerciseCounts] = useState<Record<string, number>>({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadRoutineData();
  }, [routineId]);

  useEffect(() => {
    // Add header right button for edit/delete
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => {
            Alert.alert(
              'Routine Options',
              'What would you like to do?',
              [
                {
                  text: 'Edit Name',
                  onPress: () => {
                    setEditedName(routine?.name || '');
                    setShowEditModal(true);
                  },
                },
                {
                  text: 'Delete Routine',
                  style: 'destructive',
                  onPress: handleDeleteRoutine,
                },
                { text: 'Cancel', style: 'cancel' },
              ]
            );
          }}
          style={{ marginRight: 16 }}
        >
          <Ionicons name="ellipsis-horizontal" size={24} color={colors.text.primary} />
        </Pressable>
      ),
    });
  }, [routine]);

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
          (a, b) => a.day_of_week - b.day_of_week
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

  const handleEditRoutineName = async () => {
    if (!editedName.trim()) {
      Alert.alert('Error', 'Please enter a routine name');
      return;
    }

    try {
      setSubmitting(true);

      const { data, error } = await updateRoutine(routineId, {
        name: editedName.trim(),
      });

      if (error) {
        console.error('Error updating routine:', error);
        Alert.alert('Error', 'Failed to update routine name');
        return;
      }

      if (data) {
        setRoutine(data as Routine);
        navigation.setOptions({
          title: editedName.trim(),
        });
        setShowEditModal(false);
      }
    } catch (error) {
      console.error('Error updating routine:', error);
      Alert.alert('Error', 'Failed to update routine name');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRoutine = async () => {
    Alert.alert(
      'Delete Routine',
      'Are you sure you want to delete this routine? This will delete all days and exercises in it.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await deleteRoutine(routineId);

              if (error) {
                console.error('Error deleting routine:', error);
                Alert.alert('Error', 'Failed to delete routine');
                return;
              }

              // Navigate back to routines list
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting routine:', error);
              Alert.alert('Error', 'Failed to delete routine');
            }
          },
        },
      ]
    );
  };

  // Create full week array with placeholders for missing days
  const getFullWeek = () => {
    const fullWeek: (RoutineDay | null)[] = [];
    for (let i = 0; i < 7; i++) {
      const day = days.find(d => d.day_of_week === i);
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

  // Get icon for day based on exercises or muscle groups
  const getDayIcon = (day: RoutineDay | null): 'barbell' | 'dumbbell' | 'fitness' | 'body' => {
    if (!day || day.tags.length === 0) return 'fitness';
    const firstTag = day.tags[0].toLowerCase();
    if (firstTag.includes('chest') || firstTag.includes('back')) return 'barbell';
    if (firstTag.includes('arms') || firstTag.includes('shoulder')) return 'dumbbell';
    if (firstTag.includes('legs')) return 'body';
    return 'fitness';
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>Select a day to view or edit exercises</Text>

        {getFullWeek().map((day, index) => {
          if (!day) {
            // Empty day slot → Create on tap, then navigate
            return (
              <Card
                key={`empty-${index}`}
                title={DAY_NAMES[index]}
                subtitle="Tap to add exercises"
                variant="day"
                icon="fitness"
                iconColor={colors.gray[600]}
                isRestDay={true}
                onPress={() => createDayAndNavigate(index)}
              />
            );
          }

          const exerciseCount = exerciseCounts[day.id] || 0;
          const hasExercises = exerciseCount > 0;

          return (
            <Card
              key={day.id}
              title={DAY_NAMES[day.day_of_week]}
              subtitle={
                hasExercises
                  ? `${exerciseCount} exercise${exerciseCount !== 1 ? 's' : ''}`
                  : 'Tap to add exercises'
              }
              tags={day.tags}
              variant="day"
              icon={getDayIcon(day)}
              iconColor={hasExercises ? colors.primary[500] : colors.gray[600]}
              hasExercises={hasExercises}
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

      {/* Edit Routine Name Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowEditModal(false)}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
          >
            <Pressable style={styles.modalContent} onPress={() => {}}>
              <View style={styles.modalHandle} />

              <Text style={styles.modalTitle}>Edit Routine Name</Text>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Routine Name *</Text>
                <TextInput
                  style={styles.formInput}
                  value={editedName}
                  onChangeText={setEditedName}
                  placeholder="e.g., Push Pull Legs"
                  placeholderTextColor={colors.text.disabled}
                  autoFocus
                  returnKeyType="done"
                />
              </View>

              <View style={styles.modalButtons}>
                <Pressable
                  style={[styles.modalButton, styles.modalButtonSecondary]}
                  onPress={() => setShowEditModal(false)}
                >
                  <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.modalButton,
                    styles.modalButtonPrimary,
                    (!editedName.trim() || submitting) && styles.modalButtonDisabled,
                  ]}
                  onPress={handleEditRoutineName}
                  disabled={!editedName.trim() || submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color={colors.text.primary} />
                  ) : (
                    <Text style={styles.modalButtonPrimaryText}>Save</Text>
                  )}
                </Pressable>
              </View>
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
    padding: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  subtitle: {
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.elevated,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.gray[700],
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  formField: {
    marginBottom: spacing.lg,
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
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  modalButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  modalButtonPrimary: {
    backgroundColor: colors.primary[500],
  },
  modalButtonSecondary: {
    backgroundColor: colors.background.card,
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
  modalButtonPrimaryText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  modalButtonSecondaryText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
  },
});
