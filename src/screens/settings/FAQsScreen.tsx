/**
 * FAQsScreen - Frequently Asked Questions
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { colors } from '@theme/colors';
import { spacing, borderRadius } from '@theme/spacing';
import { typography } from '@theme/typography';

// FAQ data
const FAQS = [
  {
    question: 'How do I create a workout routine?',
    answer: 'Navigate to the Workouts tab and tap the "+" button. Name your routine, then add days and exercises to each day.',
  },
  {
    question: 'How do I track my workouts?',
    answer: 'Go to the Home tab and start a workout. Log your sets with reps, weight, and RIR (Reps in Reserve) for each exercise.',
  },
  {
    question: 'What does RIR mean?',
    answer: 'RIR stands for Reps in Reserve - how many more reps you could have done. RIR 0 = failure, RIR 2 = 2 more reps possible.',
  },
  {
    question: 'How is strength score calculated?',
    answer: 'Strength score is based on total volume (sets × reps × weight) across all exercises in your workout session.',
  },
  {
    question: 'Can I switch between metric and imperial units?',
    answer: 'Yes! Use the units toggle in Account Information. Your weights will be displayed in kg or lbs based on your preference.',
  },
  {
    question: 'How do I delete a routine?',
    answer: 'Go to the Workouts tab, find your routine, and swipe left or long-press to access the delete option.',
  },
  {
    question: 'Can I edit exercises in my routine?',
    answer: 'Yes! Navigate to the specific day in your routine and tap on any exercise to edit its details like sets, reps, or weight.',
  },
];

export const FAQsScreen = () => {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {FAQS.map((faq, index) => (
        <View key={index} style={styles.faqItem}>
          <Pressable style={styles.faqQuestion} onPress={() => toggleFaq(index)}>
            <Text style={styles.faqQuestionText}>{faq.question}</Text>
            <Text style={styles.faqIcon}>{expandedFaq === index ? '−' : '+'}</Text>
          </Pressable>
          {expandedFaq === index && (
            <View style={styles.faqAnswer}>
              <Text style={styles.faqAnswerText}>{faq.answer}</Text>
            </View>
          )}
        </View>
      ))}
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
  faqItem: {
    backgroundColor: colors.background.elevated,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  faqQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  faqQuestionText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    flex: 1,
    paddingRight: spacing.sm,
  },
  faqIcon: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.light,
  },
  faqAnswer: {
    padding: spacing.md,
    paddingTop: 0,
  },
  faqAnswerText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
});

