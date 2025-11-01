/**
 * RoutinesScreen - List all routines with create CTA
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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { WorkoutsStackParamList } from '@types/navigation';
import { Card } from '@components/Card';
import { colors } from '@theme/colors';
import { spacing, borderRadius } from '@theme/spacing';
import { typography } from '@theme/typography';
import { Ionicons } from '@expo/vector-icons';
import { getRoutines, getRoutineDays, createRoutine, updateRoutine, deleteRoutine } from '@services/supabase';
import { useRoutinesStore } from '@store/routinesStore';
import { Routine, RoutineDay } from '@types/models';
import { useCurrentUser } from '@hooks/useCurrentUser';

type NavigationProp = NativeStackNavigationProp<WorkoutsStackParamList>;

export const RoutinesScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { userId, initialized } = useCurrentUser();
  const [loading, setLoading] = useState(true);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [routineName, setRoutineName] = useState('');
  const [creating, setCreating] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [editedName, setEditedName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { setRoutines: setStoreRoutines, setDays, addRoutine } = useRoutinesStore();

  useEffect(() => {
    if (initialized) {
      loadRoutines();
    }
  }, [initialized]);

  const loadRoutines = async () => {
    try {
      setLoading(true);
      
      if (!userId) {
        console.log('No authenticated user');
        setLoading(false);
        return;
      }
      
      const { data, error } = await getRoutines(userId);

      if (error) {
        console.error('Error loading routines:', error);
        return;
      }

      if (data) {
        const routinesData = data as Routine[];
        setRoutines(routinesData);
        setStoreRoutines(routinesData);

        // Load days for all routines
        const allDays: RoutineDay[] = [];
        for (const routine of routinesData) {
          const daysRes = await getRoutineDays(routine.id);
          if (daysRes.data) {
            allDays.push(...(daysRes.data as RoutineDay[]));
          }
        }
        setDays(allDays);
      }
    } catch (error) {
      console.error('Error loading routines:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoutine = async () => {
    if (!routineName.trim()) {
      Alert.alert('Error', 'Please enter a routine name');
      return;
    }

    if (!userId) {
      Alert.alert('Error', 'You must be logged in to create a routine');
      return;
    }

    try {
      setCreating(true);

      const newRoutine = {
        user_id: userId,
        name: routineName.trim(),
      };

      const { data, error } = await createRoutine(newRoutine);

      if (error) {
        console.error('Error creating routine:', error);
        Alert.alert('Error', 'Failed to create routine. Please try again.');
        return;
      }

      if (data) {
        // Add to local state
        const routine = data as Routine;
        setRoutines([...routines, routine]);
        addRoutine(routine);

        // Reset form
        setRoutineName('');
        setShowCreateModal(false);

        // Navigate to the new routine
        navigation.navigate('RoutineDetail', { routineId: routine.id });
      }
    } catch (error) {
      console.error('Error creating routine:', error);
      Alert.alert('Error', 'Failed to create routine. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const getDayCount = (routine: Routine): number => {
    // Count days with exercises from store
    // For now, return mock count
    return 7;
  };

  const handleEditRoutine = (routine: Routine) => {
    setEditingRoutine(routine);
    setEditedName(routine.name);
    setShowEditModal(true);
  };

  const handleUpdateRoutine = async () => {
    if (!editedName.trim() || !editingRoutine) return;

    try {
      setSubmitting(true);

      const { data, error } = await updateRoutine(editingRoutine.id, {
        name: editedName.trim(),
      });

      if (error) {
        console.error('Error updating routine:', error);
        Alert.alert('Error', 'Failed to update routine name');
        return;
      }

      if (data) {
        // Update local state
        setRoutines(routines.map(r => r.id === editingRoutine.id ? data as Routine : r));
        setShowEditModal(false);
        setEditingRoutine(null);
        setEditedName('');
      }
    } catch (error) {
      console.error('Error updating routine:', error);
      Alert.alert('Error', 'Failed to update routine name');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRoutine = (routine: Routine) => {
    Alert.alert(
      'Delete Routine',
      `Are you sure you want to delete "${routine.name}"? This will delete all days and exercises in it.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await deleteRoutine(routine.id);

              if (error) {
                console.error('Error deleting routine:', error);
                Alert.alert('Error', 'Failed to delete routine');
                return;
              }

              // Remove from local state
              setRoutines(routines.filter(r => r.id !== routine.id));
            } catch (error) {
              console.error('Error deleting routine:', error);
              Alert.alert('Error', 'Failed to delete routine');
            }
          },
        },
      ]
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
        <Text style={styles.title}>Your Routines</Text>

        {routines.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="barbell-outline" size={64} color={colors.text.disabled} />
            <Text style={styles.emptyTitle}>No routines yet</Text>
            <Text style={styles.emptySubtext}>
              Create your first workout routine to get started
            </Text>
            <Pressable
              style={styles.createButton}
              onPress={() => setShowCreateModal(true)}
            >
              <Ionicons name="add" size={20} color={colors.text.primary} />
              <Text style={styles.createButtonText}>Create Routine</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {routines.map((routine) => (
              <Card
                key={routine.id}
                title={routine.name}
                subtitle={`${getDayCount(routine)} days`}
                variant="routine"
                showEditIcon={true}
                onPress={() => {
                  navigation.navigate('RoutineDetail', { routineId: routine.id });
                }}
                onEditPress={() => {
                  Alert.alert(
                    'Routine Options',
                    `What would you like to do with "${routine.name}"?`,
                    [
                      {
                        text: 'Edit Name',
                        onPress: () => handleEditRoutine(routine),
                      },
                      {
                        text: 'Delete Routine',
                        style: 'destructive',
                        onPress: () => handleDeleteRoutine(routine),
                      },
                      { text: 'Cancel', style: 'cancel' },
                    ]
                  );
                }}
              />
            ))}

            <Pressable
              style={styles.addButton}
              onPress={() => setShowCreateModal(true)}
            >
              <Ionicons name="add" size={20} color={colors.primary[500]} />
              <Text style={styles.addButtonText}>Add Another Routine</Text>
            </Pressable>
          </>
        )}
      </ScrollView>

      {/* Create Routine Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowCreateModal(false)}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
          >
            <Pressable style={styles.modalContent} onPress={() => {}}>
              <View style={styles.modalHandle} />

              <Text style={styles.modalTitle}>Create New Routine</Text>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Routine Name *</Text>
                <TextInput
                  style={styles.formInput}
                  value={routineName}
                  onChangeText={setRoutineName}
                  placeholder="e.g., Push Pull Legs"
                  placeholderTextColor={colors.text.disabled}
                  autoFocus
                  returnKeyType="done"
                />
              </View>

              <View style={styles.modalButtons}>
                <Pressable
                  style={[styles.modalButton, styles.modalButtonSecondary]}
                  onPress={() => {
                    setRoutineName('');
                    setShowCreateModal(false);
                  }}
                >
                  <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.modalButton,
                    styles.modalButtonPrimary,
                    (!routineName.trim() || creating) && styles.modalButtonDisabled,
                  ]}
                  onPress={handleCreateRoutine}
                  disabled={!routineName.trim() || creating}
                >
                  {creating ? (
                    <ActivityIndicator size="small" color={colors.text.primary} />
                  ) : (
                    <Text style={styles.modalButtonPrimaryText}>Create</Text>
                  )}
                </Pressable>
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>

      {/* Edit Routine Name Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowEditModal(false);
          setEditingRoutine(null);
          setEditedName('');
        }}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => {
            setShowEditModal(false);
            setEditingRoutine(null);
            setEditedName('');
          }}
        >
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
                  onPress={() => {
                    setShowEditModal(false);
                    setEditingRoutine(null);
                    setEditedName('');
                  }}
                >
                  <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.modalButton,
                    styles.modalButtonPrimary,
                    (!editedName.trim() || submitting) && styles.modalButtonDisabled,
                  ]}
                  onPress={handleUpdateRoutine}
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
    padding: spacing.md,
  },
  title: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['4xl'],
  },
  emptyTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  createButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.elevated,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  addButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.primary[500],
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
