/**
 * Card Component - Reusable card matching Figma Frame 1:19 Screen 2
 * Used for routines, days, exercises, and workout cards
 */

import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  ImageSourcePropType,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@theme/colors';
import { spacing, borderRadius } from '@theme/spacing';
import { typography } from '@theme/typography';

export type CardVariant = 'routine' | 'day' | 'exercise' | 'workout';

interface CardProps {
  title: string;
  subtitle?: string;
  image?: ImageSourcePropType | string;
  tags?: string[];
  variant?: CardVariant;
  onPress?: () => void;
  disabled?: boolean;
  showEditIcon?: boolean;
  onEditPress?: () => void;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  image,
  tags = [],
  variant = 'routine',
  onPress,
  disabled = false,
  showEditIcon = false,
  onEditPress,
}) => {
  const hasImage = !!image;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled || !onPress}
    >
      {hasImage && (
        <View style={styles.imageContainer}>
          <Image
            source={typeof image === 'string' ? { uri: image } : image}
            style={styles.image}
            resizeMode="cover"
          />
        </View>
      )}

      <View style={[styles.content, hasImage && styles.contentWithImage]}>
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>

        {tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Edit Icon */}
      {showEditIcon && onEditPress && (
        <Pressable
          style={styles.editButton}
          onPress={(e) => {
            e.stopPropagation();
            onEditPress();
          }}
          hitSlop={8}
        >
          <Ionicons name="pencil" size={20} color={colors.primary[500]} />
        </Pressable>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.elevated,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    position: 'relative',
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.5,
  },
  editButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  imageContainer: {
    width: '100%',
    height: 120,
    backgroundColor: colors.background.card,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  content: {
    padding: spacing.md,
  },
  contentWithImage: {
    paddingTop: spacing.sm,
  },
  textContainer: {
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.text.primary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semiBold,
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tag: {
    backgroundColor: colors.primary[900],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  tagText: {
    color: colors.primary[300],
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
});

