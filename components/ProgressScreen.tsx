import { AuthContext } from '@/app/_layout';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { useBreakpoint } from '@/utils/responsive';
import { supabase } from '@/utils/supabase';
import React, { useContext } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import Layout, { ModernCard, ModernHeader, SectionHeader } from './Layout';

// Define the Photo type locally if it's not easily importable
interface Photo {
  id: string;
  url: string;
  created_at: string;
}

const { width } = Dimensions.get('window');

export default function ProgressScreen() {
  // Use local state for photos
  const [photos, setPhotos] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const auth = useContext(AuthContext);
  const { token } = auth || {};
  // Get session from Supabase
  const [session, setSession] = React.useState<any>(null);
  React.useEffect(() => {
    async function getSession() {
      const { data } = await supabase.auth.getSession();
      setSession(data?.session);
    }
    getSession();
  }, [token]);
  const { isDarkMode, theme } = useTheme();
  const palette = isDarkMode ? Colors.dark : Colors.light;
  const primary = palette.primary;
  const sub = palette.textSecondary;
  const border = theme.colors.border;
  const totalPhotos = photos.length;
  const maxBarHeight = 80;


  // Always fetch photos from Supabase and update local state, stable reference
  const fetchPhotosFromDB = React.useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('photos')
      .select('id, url, user_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      setError(error.message);
      setPhotos([]);
    } else if (data) {
      setPhotos(data.map((p: any) => ({ id: p.id, url: p.url, user_id: p.user_id, created_at: p.created_at })));
    }
    setLoading(false);
  }, []);

  // Fetch photos on screen focus
  React.useEffect(() => {
    if (session?.user?.id) {
      fetchPhotosFromDB(session.user.id);
    }
  }, [session?.user?.id, fetchPhotosFromDB]);

 const resetProgress = async () => {
  console.log('resetProgress called');
  Alert.alert(
    "Reset Progress",
    "Are you sure you want to delete all your progress photos? This action cannot be undone.",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        style: "destructive",
        onPress: async () => {
          // ...existing code...
          if (session?.user?.id) {
            for (const photo of photos) {
              try {
                // Extract storage path from URL
                const path = photo.url.replace(
                  /^https:\/\/[^/]+\/storage\/v1\/object\/public\/photos\//,
                  ''
                );

                const res = await fetch(
                  'https://vpnitpweduycfmndmxsf.supabase.co/functions/v1/delete-photo-storage',
                  {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${session.access_token}`, // ✅ added
                    },
                    body: JSON.stringify({
                      photoId: photo.id,
                      path: path,
                    }),
                  }
                );

                const result = await res.json();
                // ...existing code...
              } catch (err) {
                // ...existing code...
              }
            }

            // Refresh after all deletions are done
            fetchPhotosFromDB(session.user.id);
          }

          if (auth?.resetProgress) {
            await auth.resetProgress(); // Also clear local storage
          }
        },
      },
    ]
  );
};


  // Calculate current streak (consecutive days with photos)
  const getCurrentStreak = (photoList: Photo[]): number => {
    if (photoList.length === 0) return 0;
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const hasPhotoOnDate = photoList.some((photo) => {
        const photoDate = new Date(photo.created_at);
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
      const photoDate = new Date(photo.created_at).toDateString();
      uniqueDays.add(photoDate);
    });
    return uniqueDays.size;
  };

  useBreakpoint();
  useWindowDimensions();
  const currentStreak = getCurrentStreak(photos);
  const daysTracked = getDaysTracked(photos);

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
      counts.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        value: 0,
      });
    }

    photoList.forEach((photo) => {
      const photoDate = new Date(photo.created_at);
      photoDate.setHours(0, 0, 0, 0);
      const dayIndex = days.findIndex((d) => d.getTime() === photoDate.getTime());
      if (dayIndex !== -1) {
        counts[dayIndex].value++;
      }
    });

    return counts;
  };

  const weeklyPhotoCounts = getWeeklyPhotoCounts(photos);
  const maxWeeklyPhotos = Math.max(...weeklyPhotoCounts.map((d) => d.value), 1);



  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: palette.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: palette.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: palette.text }}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <Layout>
      <ModernHeader title="Your Progress" />
      <ScrollView style={styles.container}>
        <View style={styles.statsContainer}>
          <ModernCard>
            <Text style={[styles.statValue, { color: primary }]}>{totalPhotos}</Text>
            <Text style={[styles.statLabel, { color: sub }]}>Total Photos</Text>
          </ModernCard>
          <ModernCard>
            <Text style={[styles.statValue, { color: primary }]}>{currentStreak}</Text>
            <Text style={[styles.statLabel, { color: sub }]}>Current Streak</Text>
          </ModernCard>
          <ModernCard>
            <Text style={[styles.statValue, { color: primary }]}>{daysTracked}</Text>
            <Text style={[styles.statLabel, { color: sub }]}>Days Tracked</Text>
          </ModernCard>
        </View>

        <SectionHeader title="Weekly Activity" />
        <View style={[styles.chartContainer, { backgroundColor: theme.colors.card }]}>
          {weeklyPhotoCounts.map((day, index) => (
            <View key={index} style={styles.barWrapper}>
              <View
                style={[
                  styles.bar,
                  {
                    height: (day.value / maxWeeklyPhotos) * maxBarHeight,
                    backgroundColor: primary,
                  },
                ]}
              />
              <Text style={[styles.barLabel, { color: sub }]}>{day.day}</Text>
            </View>
          ))}
        </View>

        <SectionHeader title="All Photos" />
        <TouchableOpacity onPress={() => session?.user?.id && fetchPhotosFromDB(session.user.id)} style={{ margin: 10, alignSelf: 'flex-end', backgroundColor: primary, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 }}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Refresh</Text>
        </TouchableOpacity>
        {/* Ensure refresh button fetches from DB */}
        {/* Use fetchPhotosFromDB for refresh */}
        <View style={styles.photoGrid}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading photos...</Text>
            </View>
          ) : (
            photos.map((photo, index) => (
              <TouchableOpacity key={photo.id || index} style={styles.photoContainer}>
                <Image source={{ uri: photo.url }} style={styles.photo} />
              </TouchableOpacity>
            ))
          )}
        </View>

        <TouchableOpacity onPress={resetProgress} style={styles.resetButton}>
          <Text style={styles.resetButtonText}>Reset Progress</Text>
        </TouchableOpacity>
      </ScrollView>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 14,
    textAlign: 'center',
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    padding: 10,
    borderRadius: 10,
    margin: 10,
    height: 120,
  },
  barWrapper: {
    alignItems: 'center',
  },
  bar: {
    width: 20,
    borderRadius: 5,
  },
  barLabel: {
    marginTop: 5,
    fontSize: 12,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  photoContainer: {
    width: width / 3 - 2,
    height: width / 3 - 2,
    margin: 1,
  },
  photo: {
    flex: 1,
    width: undefined,
    height: undefined,
  },
  resetButton: {
    margin: 20,
    padding: 15,
    backgroundColor: '#ff3b30',
    borderRadius: 10,
    alignItems: 'center',
  },
  resetButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
