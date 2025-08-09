import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Layout, { ModernHeader, SectionHeader, ModernCard } from './Layout';

interface ProgressScreenProps {
  photos?: any[];
}

export default function ProgressScreen({ photos = [] }: ProgressScreenProps) {
  const totalPhotos = photos.length;
  const weeklyData = [1, 2, 1, 0, 3, 0, 2];

  return (
    <Layout>
      <ModernHeader title="Your Progress" subtitle="Analytics & Insights" />
      <SectionHeader title="Photo Stats" />
      <ModernCard style={styles.statCard}>
        <Text style={styles.statNumber}>{totalPhotos}</Text>
        <Text style={styles.statLabel}>Photos Taken</Text>
      </ModernCard>
      <SectionHeader title="Weekly Progress" />
      <View style={styles.chartContainer}>
        {weeklyData.map((v, i) => (
          <View key={i} style={styles.barWrapper}>
            <View style={[styles.bar, { height: v * 20 }]} />
          </View>
        ))}
      </View>
    </Layout>
  );
}

const styles = StyleSheet.create({
  statCard: {
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#8B5FBF',
  },
  statLabel: {
    fontSize: 16,
    color: '#666',
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    paddingHorizontal: 40,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  bar: {
    width: 20,
    backgroundColor: '#A8E6CF',
    borderRadius: 10,
  },
});

