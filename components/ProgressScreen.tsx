import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import React from 'react';
import { Dimensions, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Photo } from '../app/(tabs)/_layout'; // Assuming Photo interface is exported from _layout.tsx
import Layout, { ModernCard, ModernHeader, SectionHeader } from './Layout';

interface ProgressScreenProps {
  photos?: Photo[];
}

const { width } = Dimensions.get('window');

export default function ProgressScreen({ photos = [] }: ProgressScreenProps) {
  const { isDarkMode, theme } = useTheme();
  const palette = isDarkMode ? Colors.dark : Colors.light;
  const primary = palette.primary;
  const text = theme.colors.text;
  const sub = palette.textSecondary;
  const border = theme.colors.border;
  const card = theme.colors.card;
  const totalPhotos = photos.length;
  const maxBarHeight = 80; // Max height for the bars

  const getWeeklyPhotoCounts = (photoList: Photo[]) => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 for Sunday, 1 for Monday, ..., 6 for Saturday
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Initialize counts for the last 7 days
    const weeklyCounts: { [key: number]: number } = {}; // Use timestamp as key
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek); // Set to Sunday of the current week
    startOfWeek.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      weeklyCounts[date.getTime()] = 0; // Use timestamp as key
    }

    photoList.forEach(photo => {
      const photoDate = new Date(photo.timestamp);
      photoDate.setHours(0, 0, 0, 0); // Normalize photoDate to start of day
      if (weeklyCounts.hasOwnProperty(photoDate.getTime())) {
        weeklyCounts[photoDate.getTime()]++;
      }
    });

    // Map to the desired format, ensuring correct order
    return days.map((dayName, index) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + index);
      return {
        day: dayName,
        value: weeklyCounts[date.getTime()] || 0,
      };
    });
  };

  const weeklyData = getWeeklyPhotoCounts(photos);
  const maxVal = Math.max(1, ...weeklyData.map(d => d.value));
  const photosThisWeek = weeklyData.reduce((acc, d) => acc + d.value, 0);

  return (
    <Layout>
      <ModernHeader title="Your Progress" subtitle="Analytics & Insights" />

      <SectionHeader title="Photo Stats" />
      <ModernCard style={styles.statCard}>
        <Text style={[styles.statNumber, { color: primary }]}>{totalPhotos}</Text>
        <Text style={[styles.statLabel, { color: sub }]}>Photos Taken</Text>
        <Text style={{ marginTop: 4, color: sub, fontSize: 12 }}>
          {photosThisWeek} this week
        </Text>
      </ModernCard>

      <SectionHeader title="Weekly Progress" />
      <ModernCard style={styles.chartCard}>
        {maxVal === 1 && photosThisWeek === 0 ? (
          <Text style={{ textAlign: 'center', color: sub }}>No photos this week yet.</Text>
        ) : (
          <View style={styles.chartContainer}>
            {weeklyData.map((data, i) => (
              <View key={i} style={styles.barWrapper}>
                <View
                  style={{
                    width: 25,
                    height: (data.value / maxVal) * maxBarHeight,
                    backgroundColor: primary,
                    borderRadius: 8,
                    marginBottom: 5,
                  }}
                />
                <Text style={[styles.barLabel, { color: sub }]}>{data.day}</Text>
              </View>
            ))}
          </View>
        )}
      </ModernCard>

      <SectionHeader title="Recent Photos" />
      <ModernCard style={styles.recentPhotosCard}>
        {photos.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoScrollContainer}>
            {photos.map((photo, index) => (
              <Image
                key={index}
                source={{ uri: photo.uri }}
                style={[styles.recentPhoto, { borderColor: border, borderWidth: 1 }]}
              />
            ))}
          </ScrollView>
        ) : (
          <Text style={[styles.noPhotosText, { color: sub }]}>No photos taken yet. Capture your first progress photo!</Text>
        )}
      </ModernCard>
    </Layout>
  );
}

const styles = StyleSheet.create({
  statCard: {
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 15,
  },
  statNumber: {
    fontSize: 38,
    fontWeight: '800',
  color: '#6A057F', // overridden by theme
  },
  statLabel: {
    fontSize: 18,
  color: '#555', // overridden by theme
    marginTop: 5,
  },
  chartCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 15,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 150, // Increased height for better visual
    paddingHorizontal: 10,
  },
  barWrapper: {
    alignItems: 'center',
    width: (width - 80) / 7, // Distribute bars evenly
  },
  bar: {
    width: 25, // Slightly wider bars
  backgroundColor: '#4CAF50', // overridden by theme
    borderRadius: 8,
    marginBottom: 5,
  },
  barLabel: {
    fontSize: 12,
  color: '#777', // overridden by theme
  },
  recentPhotosCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 15,
  },
  photoScrollContainer: {
    paddingHorizontal: 5,
  },
  recentPhoto: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginHorizontal: 5,
    resizeMode: 'cover',
  },
  noPhotosText: {
    textAlign: 'center',
  color: '#888', // overridden by theme
    fontStyle: 'italic',
    paddingVertical: 20,
  },
});
