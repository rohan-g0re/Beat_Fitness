/**
 * BarChart Component - Horizontal bar chart for muscle group breakdown
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { colors } from '@theme/colors';
import { spacing } from '@theme/spacing';

interface BarChartData {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarChartData[];
  title?: string;
  height?: number;
  maxBars?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 64; // Account for padding

export const BarChart = React.memo<BarChartProps>(
  ({ data, title, height = 250, maxBars = 7 }) => {
    // Take top N items and sort by value
    const displayData = data.slice(0, maxBars).sort((a, b) => b.value - a.value);

    if (displayData.length === 0) {
      return (
        <View style={styles.container}>
          {title && <Text style={styles.title}>{title}</Text>}
          <View style={[styles.emptyState, { height }]}>
            <Text style={styles.emptyText}>No data available</Text>
          </View>
        </View>
      );
    }

    // Format large numbers
    const formatValue = (value: number): string => {
      if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
      }
      if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K`;
      }
      return value.toFixed(0);
    };

    const maxValue = Math.max(...displayData.map(d => d.value));

    return (
      <View style={styles.container}>
        {title && <Text style={styles.title}>{title}</Text>}
        <View style={styles.chartContainer}>
          {displayData.map((item, index) => {
            const barWidth = maxValue > 0 ? (item.value / maxValue) * (CHART_WIDTH - 120) : 0;
            const barColor = item.color || colors.primary[500];

            return (
              <View key={index} style={styles.barRow}>
                <Text style={styles.label} numberOfLines={1}>
                  {item.label}
                </Text>
                <View style={styles.barContainer}>
                  <View style={[styles.bar, { width: barWidth, backgroundColor: barColor }]} />
                </View>
                <Text style={styles.value}>{formatValue(item.value)}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: spacing.lg,
    letterSpacing: -0.5,
  },
  chartContainer: {
    gap: spacing.sm,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  label: {
    fontSize: 14,
    color: '#8E8E93',
    width: 80,
  },
  barContainer: {
    flex: 1,
    height: 28,
    backgroundColor: '#2C2C2E',
    borderRadius: 6,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 6,
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    width: 60,
    textAlign: 'right',
  },
  emptyState: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    borderRadius: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8E93',
  },
});

