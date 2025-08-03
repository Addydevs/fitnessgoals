import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
// eslint-disable-next-line import/no-unresolved
import Svg, { Circle } from 'react-native-svg';

import Layout from '@/components/Layout';
import { theme } from '@/constants/theme';

export default function Homepage() {
  const progress = 0.7;
  const size = 120;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <Layout>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, John</Text>
          <Text style={styles.subtitle}>Ready for your workout?</Text>
        </View>
        <Image source={require('../../assets/images/icon.png')} style={styles.avatar} />
      </View>

      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.workoutCard}
      >
        <View style={styles.workoutText}>
          <Text style={styles.workoutTitle}>Daily Workout</Text>
          <Text style={styles.workoutTime}>8:00 AM</Text>
          <TouchableOpacity style={styles.workoutButton}>
            <Text style={styles.workoutButtonText}>Start</Text>
          </TouchableOpacity>
        </View>
        <Image source={require('../../assets/images/react-logo.png')} style={styles.workoutImage} />
      </LinearGradient>

      <View style={styles.progressSection}>
        <Svg width={size} height={size}>
          <Circle
            stroke="#e6e6e6"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <Circle
            stroke={theme.colors.primary}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${size / 2},${size / 2}`}
          />
        </Svg>
        <View style={styles.progressLabel}>
          <Text style={styles.progressPercent}>70%</Text>
          <Text style={styles.progressText}>Completed</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>350</Text>
          <Text style={styles.statLabel}>Cal</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>45m</Text>
          <Text style={styles.statLabel}>Time</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>120</Text>
          <Text style={styles.statLabel}>BPM</Text>
        </View>
      </View>
    </Layout>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
  },
  subtitle: {
    marginTop: 4,
    color: theme.colors.text,
    opacity: 0.7,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  workoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  workoutText: {
    flex: 1,
  },
  workoutTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  workoutTime: {
    color: '#fff',
    marginBottom: 12,
  },
  workoutButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  workoutButtonText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  workoutImage: {
    width: 80,
    height: 80,
  },
  progressSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  progressLabel: {
    position: 'absolute',
    top: '35%',
    alignItems: 'center',
  },
  progressPercent: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
  },
  progressText: {
    marginTop: 4,
    color: theme.colors.text,
    opacity: 0.7,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    marginHorizontal: 4,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  statLabel: {
    marginTop: 4,
    color: theme.colors.text,
    opacity: 0.7,
  },
});

