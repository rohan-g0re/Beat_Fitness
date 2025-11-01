/**
 * AccountInformationScreen - User profile settings
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { colors } from '@theme/colors';
import { spacing, borderRadius } from '@theme/spacing';
import { typography } from '@theme/typography';
import { useCurrentUser } from '@hooks/useCurrentUser';
import { getProfile, updateProfile } from '@services/supabase';

// Predefined equipment list
const EQUIPMENT_OPTIONS = [
  'Dumbbells',
  'Barbell',
  'Resistance Bands',
  'Pull-up Bar',
  'Bench',
  'Squat Rack',
  'Cable Machine',
  'Kettlebells',
  'Bodyweight Only',
];

export const AccountInformationScreen = () => {
  const { userId } = useCurrentUser();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Profile data
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [units, setUnits] = useState<'metric' | 'imperial'>('metric');
  const [equipment, setEquipment] = useState<string[]>([]);

  // Load profile data
  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const { data, error } = await getProfile(userId);
      if (error) throw error;
      
      if (data) {
        setHeight(data.height?.toString() || '');
        setWeight(data.weight?.toString() || '');
        setUnits(data.units as 'metric' | 'imperial');
        setEquipment((data.equipment as string[]) || []);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!userId) return;
    
    setSaving(true);
    try {
      const { error } = await updateProfile(userId, {
        height: height ? parseFloat(height) : null,
        weight: weight ? parseFloat(weight) : null,
        units,
        equipment: equipment as any,
      });
      
      if (error) throw error;
      
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Failed to save profile:', error);
      Alert.alert('Error', 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const toggleEquipment = (item: string) => {
    setEquipment((prev) =>
      prev.includes(item) ? prev.filter((e) => e !== item) : [...prev, item]
    );
  };

  // Convert height/weight for display
  const getHeightLabel = () => {
    return units === 'metric' ? 'Height (cm)' : 'Height (inches)';
  };

  const getWeightLabel = () => {
    return units === 'metric' ? 'Weight (kg)' : 'Weight (lbs)';
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
      {/* Units Toggle */}
      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Units</Text>
        <View style={styles.unitsToggle}>
          <Text style={[styles.unitLabel, units === 'metric' && styles.unitLabelActive]}>
            kg/cm
          </Text>
          <Switch
            value={units === 'imperial'}
            onValueChange={(value) => setUnits(value ? 'imperial' : 'metric')}
            trackColor={{ false: colors.primary[700], true: colors.primary[700] }}
            thumbColor={colors.text.primary}
          />
          <Text style={[styles.unitLabel, units === 'imperial' && styles.unitLabelActive]}>
            lbs/in
          </Text>
        </View>
      </View>

      {/* Height Input */}
      <View style={styles.formField}>
        <Text style={styles.formLabel}>{getHeightLabel()}</Text>
        <TextInput
          style={styles.formInput}
          value={height}
          onChangeText={setHeight}
          placeholder={units === 'metric' ? '175' : '69'}
          placeholderTextColor={colors.text.disabled}
          keyboardType="decimal-pad"
        />
      </View>

      {/* Weight Input */}
      <View style={styles.formField}>
        <Text style={styles.formLabel}>{getWeightLabel()}</Text>
        <TextInput
          style={styles.formInput}
          value={weight}
          onChangeText={setWeight}
          placeholder={units === 'metric' ? '75' : '165'}
          placeholderTextColor={colors.text.disabled}
          keyboardType="decimal-pad"
        />
      </View>

      {/* Equipment Selection */}
      <View style={styles.formField}>
        <Text style={styles.formLabel}>Available Equipment</Text>
        <View style={styles.equipmentGrid}>
          {EQUIPMENT_OPTIONS.map((item) => (
            <Pressable
              key={item}
              style={[
                styles.equipmentChip,
                equipment.includes(item) && styles.equipmentChipSelected,
              ]}
              onPress={() => toggleEquipment(item)}
            >
              <Text
                style={[
                  styles.equipmentChipText,
                  equipment.includes(item) && styles.equipmentChipTextSelected,
                ]}
              >
                {item}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Save Button */}
      <Pressable
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSaveProfile}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator size="small" color={colors.text.primary} />
        ) : (
          <Text style={styles.saveButtonText}>Save Changes</Text>
        )}
      </Pressable>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingVertical: spacing.sm,
  },
  settingLabel: {
    color: colors.text.primary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
  unitsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  unitLabel: {
    color: colors.text.disabled,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  unitLabelActive: {
    color: colors.text.primary,
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
    backgroundColor: colors.background.elevated,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  equipmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  equipmentChip: {
    backgroundColor: colors.background.elevated,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.background.elevated,
  },
  equipmentChipSelected: {
    backgroundColor: colors.primary[900],
    borderColor: colors.primary[500],
  },
  equipmentChipText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  equipmentChipTextSelected: {
    color: colors.primary[300],
  },
  saveButton: {
    backgroundColor: colors.primary[500],
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    marginTop: spacing.sm,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
});

