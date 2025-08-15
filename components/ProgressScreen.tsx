import { AuthContext } from '@/app/_layout';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useContext } from 'react';
import { Alert, Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Photo } from '../app/(tabs)/_layout'; // Assuming Photo interface is exported from _layout.tsx
import Layout, { ModernCard, ModernHeader, SectionHeader } from './Layout';

interface ProgressScreenProps {
  photos?: Photo[];
}

const { width } = Dimensions.get('window');

export default function ProgressScreen({ photos = [] }: ProgressScreenProps) {
  // (Removed duplicate declarations)
  const { isDarkMode, theme } = useTheme();
  const palette = isDarkMode ? Colors.dark : Colors.light;
  const primary = palette.primary;
  const sub = palette.textSecondary;
  const border = theme.colors.border;
  const totalPhotos = photos.length;
  const maxBarHeight = 80; // Max height for the bars
  const auth = useContext(AuthContext);
  const resetProgress = auth?.resetProgress;
  const [localPhotos, setLocalPhotos] = React.useState<Photo[]>(photos);

  // Calculate current streak (consecutive days with photos)
  const getCurrentStreak = (photoList: Photo[]): number => {
    if (photoList.length === 0) return 0;
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const hasPhotoOnDate = photoList.some((photo) => {
        const photoDate = new Date(photo.timestamp);
        return photoDate.toDateString() === checkDate.toDateString();
      });
      if (hasPhotoOnDate) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  // Calculate days tracked (unique days with photos)
  const getDaysTracked = (photoList: Photo[]): number => {
    const uniqueDays = new Set<string>();
    photoList.forEach((photo) => {
      const photoDate = new Date(photo.timestamp).toDateString();
      uniqueDays.add(photoDate);
    });
    return uniqueDays.size;
  };

  const currentStreak = getCurrentStreak(localPhotos);
  const daysTracked = getDaysTracked(localPhotos);

  // Sync localPhotos with prop changes
  React.useEffect(() => {
    setLocalPhotos(photos);
  }, [photos]);

  // Show last 7 days (rolling window)
  const getWeeklyPhotoCounts = (photoList: Photo[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = [];
    const counts: { day: string; value: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      days.push(date);
    }
    days.forEach(date => {
      const dayName = date.toLocaleDateString(undefined, { weekday: 'short' });
      const count = photoList.filter(photo => {
        const photoDate = new Date(photo.timestamp);
        photoDate.setHours(0, 0, 0, 0);
        return photoDate.getTime() === date.getTime();
      }).length;
      counts.push({ day: dayName, value: count });
    });
    return counts;
  };

  const weeklyData = getWeeklyPhotoCounts(photos);
  const maxVal = Math.max(1, ...weeklyData.map(d => d.value));
  const photosThisWeek = weeklyData.reduce((acc, d) => acc + d.value, 0);

  return (
    <Layout>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ModernHeader title="Your Progress" subtitle="Analytics & Insights" />
        <SectionHeader title="Actions" />
        <ModernCard style={{ marginHorizontal: 20, marginBottom: 20 }}>
          <TouchableOpacity
            style={{ backgroundColor: palette.primary, padding: 12, borderRadius: 12, alignItems: 'center' }}
            onPress={async () => {
              if (resetProgress) {
                await resetProgress();
                // Reload photos from AsyncStorage
                const updated = JSON.parse(await AsyncStorage.getItem('progressPhotos') || '[]');
                setLocalPhotos(updated);
                Alert.alert('Progress Reset', 'All progress photos have been cleared.');
              } else {
                Alert.alert('Error', 'Reset progress function not available.');
              }
            }}
          >
            <Text style={{ color: 'white', fontWeight: '600' }}>Reset Progress</Text>
          </TouchableOpacity>
        </ModernCard>
        <SectionHeader title="Photo Stats" />
        <ModernCard style={styles.statCard}>
          <Text style={[styles.statNumber, { color: primary }]}>{totalPhotos}</Text>
          <Text style={[styles.statLabel, { color: sub }]}>Photos Taken</Text>
          <Text style={{ marginTop: 4, color: sub, fontSize: 12 }}>
            {photosThisWeek} this week
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 12 }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: primary }}>{currentStreak}</Text>
              <Text style={{ fontSize: 12, color: sub }}>Current Streak</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: primary }}>{daysTracked}</Text>
              <Text style={{ fontSize: 12, color: sub }}>Days Tracked</Text>
            </View>
          </View>
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
          {localPhotos.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoScrollContainer}>
              {localPhotos.map((photo, index) => (
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
      </ScrollView>
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
