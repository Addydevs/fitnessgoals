import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
// eslint-disable-next-line import/no-unresolved
import Svg, { Circle } from 'react-native-svg';
import { Feather } from '@expo/vector-icons';

import Layout from '@/components/Layout';
import { theme } from '@/constants/theme';

const workouts = [
  {
    id: 1,
    title: 'Full Body',
    time: '8:00 AM',
    image: require('../../assets/images/react-logo.png'),
  },
  {
    id: 2,
    title: 'Yoga Stretch',
    time: '9:00 AM',
    image: require('../../assets/images/react-logo.png'),
  },
  {
    id: 3,
    title: 'HIIT Blast',
    time: '10:00 AM',
    image: require('../../assets/images/react-logo.png'),
  },
];

export default function Homepage() {
  const progress = 0.7;
  const size = 120;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <Layout>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, John</Text>
            <Text style={styles.subtitle}>Ready for your workout?</Text>
          </View>
          <Image source={require('../../assets/images/icon.png')} style={styles.avatar} />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.workoutScroll}
          style={{ marginBottom: 24 }}
        >
          {workouts.map((item) => (
            <View key={item.id} style={styles.workoutCard}>
              <View style={styles.workoutInfo}>
                <Text style={styles.workoutTitle}>{item.title}</Text>
                <Text style={styles.workoutTime}>{item.time}</Text>
                <TouchableOpacity style={styles.playButton}>
                  <Feather name="play" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
              <Image source={item.image} style={styles.workoutImage} />
            </View>
          ))}
        </ScrollView>

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

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, styles.statCardSpacing]}>
            <Feather name="fire" size={24} color={theme.colors.primary} />
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>350</Text>
              <Text style={styles.statLabel}>Calories</Text>
            </View>
          </View>
          <View style={[styles.statCard, styles.statCardSpacing]}>
            <Feather name="clock" size={24} color={theme.colors.primary} />
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>45m</Text>
              <Text style={styles.statLabel}>Time</Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <Feather name="heart" size={24} color={theme.colors.primary} />
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>120</Text>
              <Text style={styles.statLabel}>BPM</Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
  workoutScroll: {
    paddingBottom: 16,
  },
  workoutCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginRight: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  workoutTime: {
    color: '#6B7280',
    marginBottom: 12,
  },
  playButton: {
    backgroundColor: theme.colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  workoutImage: {
    width: 80,
    height: 80,
    marginLeft: 10,
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
  statsGrid: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  statCardSpacing: {
    marginRight: 16,
  },
  statInfo: {
    marginLeft: 12,
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

