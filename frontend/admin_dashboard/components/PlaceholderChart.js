import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '../styles/colors';
import typography from '../styles/typography';
import { spacing, radius } from '../styles/globalStyles';

/**
 * PlaceholderChart
 * Simple bar-chart-style usage summary built entirely with Views
 * (no external chart library).
 *
 * Props:
 * - data: Array<{ label: string, value: number }>
 * - maxBarHeight: number
 */
const PlaceholderChart = ({ data = [], maxBarHeight = 120 }) => {
  const highestValue = data.reduce((max, item) => (item.value > max ? item.value : max), 1);

  return (
    <View style={styles.container}>
      <View style={[styles.chartArea, { height: maxBarHeight + 32 }]}>
        {data.map((item, index) => {
          const barHeight = Math.max((item.value / highestValue) * maxBarHeight, 6);
          return (
            <View key={item.label + index} style={styles.barColumn}>
              <Text style={styles.barValueText}>{item.value}%</Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: barHeight,
                      backgroundColor: index % 2 === 0 ? colors.primaryBlue : colors.skyBlue,
                    },
                  ]}
                />
              </View>
              <Text style={styles.barLabel} numberOfLines={1}>{item.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { width: '100%' },
  chartArea: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  barColumn: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', marginHorizontal: spacing.xs },
  barValueText: { ...typography.caption, fontSize: 10, color: colors.textSecondary, marginBottom: spacing.xs },
  barTrack: { width: '100%', alignItems: 'center', justifyContent: 'flex-end' },
  bar: { width: 22, borderRadius: radius.sm },
  barLabel: { ...typography.caption, fontSize: 10, color: colors.textSecondary, marginTop: spacing.sm },
});

export default PlaceholderChart;
