/**
 * Card Component - Enhanced reusable card with gradients, icons, and animations
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
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@theme/colors';
import { spacing, borderRadius } from '@theme/spacing';
import { typography } from '@theme/typography';

export type CardVariant = 'routine' | 'day' | 'exercise' | 'workout';
export type ExerciseIcon = 'barbell' | 'dumbbell' | 'fitness' | 'body' | 'bicycle' | 'walk';

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
  gradient?: string[];
  icon?: ExerciseIcon;
  iconColor?: string;
  progress?: number; // 0-100
  hasExercises?: boolean; // For day cards
  isRestDay?: boolean;
}

// Helper to get icon name from exercise icon type
const getIconName = (icon?: ExerciseIcon): keyof typeof Ionicons.glyphMap => {
  switch (icon) {
    case 'barbell':
      return 'barbell-outline';
    case 'dumbbell':
      return 'barbell-outline';
    case 'fitness':
      return 'fitness-outline';
    case 'body':
      return 'body-outline';
    case 'bicycle':
      return 'bicycle-outline';
    case 'walk':
      return 'walk-outline';
    default:
      return 'fitness-outline';
  }
};

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
  gradient,
  icon,
  iconColor = colors.primary[500],
  progress,
  hasExercises = false,
  isRestDay = false,
}) => {
  const hasImage = !!image;
  const hasGradient = !!gradient && gradient.length >= 2;
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      friction: 5,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
    }).start();
  };

  // Get card-specific styles based on variant
  const getVariantStyles = () => {
    switch (variant) {
      case 'routine':
        return {
          minHeight: 140,
          paddingVertical: spacing.lg,
        };
      case 'day':
        return {
          minHeight: 120,
          paddingVertical: spacing.lg,
        };
      case 'exercise':
        return {
          minHeight: 100,
          paddingVertical: spacing.lg,
        };
      case 'workout':
        return {
          minHeight: 120,
          paddingVertical: spacing.lg,
        };
      default:
        return {};
    }
  };

  const CardContent = (
    <>
      {hasImage && (
        <View style={styles.imageContainer}>
          <Image
            source={typeof image === 'string' ? { uri: image } : image}
            style={styles.image}
            resizeMode="cover"
          />
        </View>
      )}

      <View style={[styles.content, hasImage && styles.contentWithImage, getVariantStyles()]}>
        <View style={styles.topRow}>
          {/* Icon */}
          {icon && (
            <View style={[styles.iconContainer, { backgroundColor: `${iconColor}20` }]}>
              <Ionicons name={getIconName(icon)} size={28} color={iconColor} />
            </View>
          )}

          <View style={styles.textContainer}>
            <View style={styles.titleRow}>
              <Text style={styles.title} numberOfLines={2}>
                {title}
              </Text>
              {variant === 'day' && hasExercises && !isRestDay && (
                <View style={styles.activeIndicator} />
              )}
            </View>
            {subtitle && (
              <Text style={styles.subtitle} numberOfLines={2}>
                {subtitle}
              </Text>
            )}
          </View>
        </View>

        {tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {tags.map((tag, index) => {
              const tagColor = getMuscleGroupColor(tag);
              return (
                <View
                  key={index}
                  style={[styles.tag, { backgroundColor: `${tagColor}20`, borderColor: tagColor }]}
                >
                  <Text style={[styles.tagText, { color: tagColor }]}>{tag}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Progress bar */}
        {progress !== undefined && progress >= 0 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${Math.min(100, progress)}%` }]} />
            </View>
            <Text style={styles.progressText}>{Math.round(progress)}%</Text>
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
          <Ionicons name="pencil" size={20} color={colors.primary[400]} />
        </Pressable>
      )}
    </>
  );

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
      <Pressable
        style={({ pressed }) => [
          styles.container,
          pressed && !disabled && styles.pressed,
          disabled && styles.disabled,
          isRestDay && styles.restDayContainer,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || !onPress}
      >
        {hasGradient ? (
          <LinearGradient colors={gradient} style={styles.gradientOverlay} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            {CardContent}
          </LinearGradient>
        ) : (
          CardContent
        )}
      </Pressable>
    </Animated.View>
  );
};

// Helper to get muscle group colors
const getMuscleGroupColor = (tag: string): string => {
  const lowerTag = tag.toLowerCase();
  if (lowerTag.includes('chest')) return '#FF6B6B';
  if (lowerTag.includes('back')) return '#4ECDC4';
  if (lowerTag.includes('legs') || lowerTag.includes('leg')) return '#A78BFA';
  if (lowerTag.includes('shoulders') || lowerTag.includes('shoulder')) return '#FFA500';
  if (lowerTag.includes('arms') || lowerTag.includes('arm') || lowerTag.includes('bicep') || lowerTag.includes('tricep')) return '#60A5FA';
  if (lowerTag.includes('core') || lowerTag.includes('abs')) return '#F59E0B';
  if (lowerTag.includes('cardio')) return '#EC4899';
  return colors.primary[500];
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1C1C1E',
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.5,
  },
  restDayContainer: {
    opacity: 0.7,
  },
  gradientOverlay: {
    flex: 1,
    borderRadius: borderRadius.lg,
  },
  editButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: 'rgba(28, 28, 30, 0.9)',
    borderRadius: borderRadius.md,
    width: 40,
    height: 40,
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
    height: 140,
    backgroundColor: '#2C2C2E',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  content: {
    padding: spacing.lg,
  },
  contentWithImage: {
    paddingTop: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  title: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semiBold,
    flex: 1,
  },
  subtitle: {
    color: '#8E8E93',
    fontSize: typography.fontSize.base,
    lineHeight: 20,
  },
  activeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success.main,
    marginLeft: spacing.sm,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  tag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  tagText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(142, 142, 147, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.success.main,
    borderRadius: 3,
  },
  progressText: {
    color: colors.success.main,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    minWidth: 40,
    textAlign: 'right',
  },
});

