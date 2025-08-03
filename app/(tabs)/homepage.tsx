import { StyleSheet, View, Image, ImageBackground } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function Homepage() {
  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <ThemedText type="defaultSemiBold" style={styles.greeting}>
            Good Morning,
          </ThemedText>
          <ThemedText type="title" style={styles.name}>
            Alex
          </ThemedText>
        </View>
        <Image
          source={require('@/assets/images/icon.png')}
          style={styles.avatar}
        />
      </View>

      {/* Daily workout card */}
      <ImageBackground
        source={require('@/assets/images/react-logo.png')}
        style={styles.workoutCard}
        imageStyle={styles.workoutImage}
      >
        <View style={styles.workoutOverlay}>
          <ThemedText type="defaultSemiBold" style={styles.workoutTime}>
            Today 8:00 AM
          </ThemedText>
          <ThemedText type="subtitle" style={styles.workoutTitle}>
            Full Body Workout
          </ThemedText>
        </View>
      </ImageBackground>

      {/* Progress and statistics */}
      <View style={styles.progressSection}>
        <View style={styles.progressRing}>
          <ThemedText type="subtitle" style={styles.progressText}>
            75%
          </ThemedText>
        </View>
        <View style={styles.statsContainer}>
          <View style={styles.statsCard}>
            <ThemedText style={styles.statsLabel}>Calories</ThemedText>
            <ThemedText type="defaultSemiBold" style={styles.statsValue}>
              450 kcal
            </ThemedText>
          </View>
          <View style={styles.statsCard}>
            <ThemedText style={styles.statsLabel}>Steps</ThemedText>
            <ThemedText type="defaultSemiBold" style={styles.statsValue}>
              8,500
            </ThemedText>
          </View>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    color: '#555',
    fontSize: 16,
  },
  name: {
    fontSize: 24,
    color: '#1E1E1E',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  workoutCard: {
    height: 160,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
    justifyContent: 'flex-end',
  },
  workoutImage: {
    borderRadius: 20,
  },
  workoutOverlay: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 16,
  },
  workoutTime: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 4,
  },
  workoutTitle: {
    color: '#fff',
    fontSize: 18,
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 12,
    borderColor: '#4C6EF5',
    borderRightColor: '#E0E0E0',
    borderBottomColor: '#E0E0E0',
    transform: [{ rotate: '45deg' }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    color: '#1E1E1E',
    fontSize: 20,
    fontWeight: '600',
    transform: [{ rotate: '-45deg' }],
  },
  statsContainer: {
    flex: 1,
    marginLeft: 24,
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  statsLabel: {
    color: '#777',
    fontSize: 14,
    marginBottom: 4,
  },
  statsValue: {
    fontSize: 16,
    color: '#1E1E1E',
  },
});
