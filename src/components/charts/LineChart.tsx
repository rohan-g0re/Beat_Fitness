/**
 * LineChart Component - Line chart for strength score trends
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { colors } from '@theme/colors';
import { spacing } from '@theme/spacing';

interface LineChartData {
  x: number;
  y: number;
  label?: string;
}

interface LineChartProps {
  data: LineChartData[];
  title?: string;
  height?: number;
  xAxisLabel?: string;
  yAxisLabel?: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 64; // Account for padding
const CHART_HEIGHT = 200;
const PADDING = 20;

export const LineChart = React.memo<LineChartProps>(
  ({ data, title, height = 250, xAxisLabel, yAxisLabel }) => {
    if (data.length === 0) {
      return (
        <View style={styles.container}>
          {title && <Text style={styles.title}>{title}</Text>}
          <View style={[styles.emptyState, { height }]}>
            <Text style={styles.emptyText}>No data available</Text>
          </View>
        </View>
      );
    }

    // Calculate min and max for display
    const values = data.map(d => d.y);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const valueRange = maxValue - minValue || 1; // Avoid division by zero
    
    const formatValue = (value: number): string => {
      if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
      }
      if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K`;
      }
      return value.toFixed(0);
    };

    // Calculate chart dimensions
    const chartWidth = CHART_WIDTH - PADDING * 2;
    const chartHeight = CHART_HEIGHT - PADDING * 2;
    const xStep = data.length > 1 ? chartWidth / (data.length - 1) : 0;

    return (
      <View style={styles.container}>
        {title && <Text style={styles.title}>{title}</Text>}
        
        {/* Value Range Display */}
        <View style={styles.valueRange}>
          <Text style={styles.rangeText}>Min: {formatValue(minValue)}</Text>
          <Text style={styles.rangeText}>Max: {formatValue(maxValue)}</Text>
        </View>

        <View style={[styles.chartWrapper, { height: CHART_HEIGHT }]}>
          {/* Grid lines */}
          <View style={styles.gridContainer}>
            {[0, 1, 2, 3, 4].map(i => (
              <View key={i} style={styles.gridLine} />
            ))}
          </View>

          {/* Data points and connecting lines */}
          <View style={styles.chartContent}>
            {data.map((point, index) => {
              if (index === 0) return null;
              
              const prevPoint = data[index - 1];
              const x1 = (index - 1) * xStep;
              const x2 = index * xStep;
              
              // Normalize y values to chart height (inverted because top is 0)
              const y1Normalized = (prevPoint.y - minValue) / valueRange;
              const y2Normalized = (point.y - minValue) / valueRange;
              const y1 = chartHeight - (y1Normalized * chartHeight);
              const y2 = chartHeight - (y2Normalized * chartHeight);
              
              // Calculate line angle and length
              const dx = x2 - x1;
              const dy = y2 - y1;
              const length = Math.sqrt(dx * dx + dy * dy);
              const angle = Math.atan2(dy, dx) * (180 / Math.PI);
              
              return (
                <View
                  key={index}
                  style={[
                    styles.lineSegment,
                    {
                      left: x1 + PADDING,
                      top: y1 + PADDING,
                      width: length,
                      transform: [{ rotate: `${angle}deg` }],
                    },
                  ]}
                />
              );
            })}

            {/* Data points */}
            {data.map((point, index) => {
              const x = index * xStep;
              const yNormalized = (point.y - minValue) / valueRange;
              const y = chartHeight - (yNormalized * chartHeight);
              
              return (
                <View
                  key={`point-${index}`}
                  style={[
                    styles.dataPoint,
                    {
                      left: x + PADDING - 4,
                      top: y + PADDING - 4,
                    },
                  ]}
                />
              );
            })}
          </View>
        </View>

        {/* Axis Labels */}
        {(xAxisLabel || yAxisLabel) && (
          <View style={styles.axisLabels}>
            {xAxisLabel && <Text style={styles.axisLabel}>{xAxisLabel}</Text>}
            {yAxisLabel && <Text style={styles.axisLabel}>{yAxisLabel}</Text>}
          </View>
        )}
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
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
  },
  valueRange: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  rangeText: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
  },
  chartWrapper: {
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  gridContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    paddingVertical: PADDING,
  },
  gridLine: {
    height: 1,
    backgroundColor: '#3A3A3C',
    opacity: 0.3,
  },
  chartContent: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  lineSegment: {
    position: 'absolute',
    height: 3,
    backgroundColor: colors.primary[500],
    transformOrigin: 'left center',
  },
  dataPoint: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary[500],
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  axisLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  axisLabel: {
    fontSize: 12,
    color: '#8E8E93',
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

