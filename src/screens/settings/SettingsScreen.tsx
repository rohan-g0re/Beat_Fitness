/**
 * SettingsScreen - Main settings menu with card navigation
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@theme/colors';
import { spacing, borderRadius } from '@theme/spacing';
import { typography } from '@theme/typography';
import { useAuth } from '@hooks/useAuth';
import { SettingsStackParamList } from '@types/navigation';

type NavigationProp = NativeStackNavigationProp<SettingsStackParamList>;

export const SettingsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { signOut } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.mainTitle}>Settings</Text>

      {/* Account Information Card */}
      <Pressable
        style={styles.card}
        onPress={() => navigation.navigate('AccountInformation')}
      >
        <View style={styles.cardIcon}>
          <Ionicons name="person-outline" size={24} color={colors.primary[500]} />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>Account Information</Text>
          <Text style={styles.cardSubtitle}>
            Manage height, weight, units, and equipment
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color={colors.text.disabled} />
      </Pressable>

      {/* FAQs Card */}
      <Pressable style={styles.card} onPress={() => navigation.navigate('FAQs')}>
        <View style={styles.cardIcon}>
          <Ionicons name="help-circle-outline" size={24} color={colors.primary[500]} />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>FAQs</Text>
          <Text style={styles.cardSubtitle}>Frequently asked questions and help</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color={colors.text.disabled} />
      </Pressable>

      {/* Log Out Card */}
      <Pressable style={[styles.card, styles.logoutCard]} onPress={handleLogout}>
        <View style={styles.cardIcon}>
          <Ionicons name="log-out-outline" size={24} color={colors.error.main} />
        </View>
        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, styles.logoutText]}>Log Out</Text>
          <Text style={styles.cardSubtitle}>Sign out of your account</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color={colors.text.disabled} />
      </Pressable>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.dark,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  mainTitle: {
    color: colors.text.primary,
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.background.elevated,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutCard: {
    borderWidth: 1,
    borderColor: colors.error.dark,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    color: colors.text.primary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semiBold,
    marginBottom: spacing.xs,
  },
  logoutText: {
    color: colors.error.main,
  },
  cardSubtitle: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
  },
});

