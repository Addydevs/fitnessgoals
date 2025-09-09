"use client"

import { AuthContext } from "@/app/_layout"
import { Colors } from "@/constants/Colors"
import { useTheme } from "@/contexts/ThemeContext"
import { supabase } from "@/utils/supabase"
import { memo, useCallback, useContext, useEffect, useMemo, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import Layout, { ModernCard, ModernHeader, SectionHeader } from "./Layout"

// Define the Photo type locally if it's not easily importable
interface Photo {
  id: string
  url: string
  created_at: string
}

const { width } = Dimensions.get("window")

const PhotoItem = memo(({ photo, onPress }: { photo: Photo; onPress?: () => void }) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.photoContainer}>
      <Image
        source={{ uri: photo.url }}
        style={styles.photo}
        onError={() => console.log("Failed to load image:", photo.url)}
        resizeMode="cover"
        fadeDuration={200}
      />
    </TouchableOpacity>
  )
})
PhotoItem.displayName = "PhotoItem"

const StatsCard = memo(({ value, label, color }: { value: number; label: string; color: string }) => {
  return (
    <ModernCard>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color }]}>{label}</Text>
    </ModernCard>
  )
})
StatsCard.displayName = "StatsCard"

const WeeklyChart = memo(({ weeklyPhotoCounts, maxWeeklyPhotos, primary, sub, theme }: any) => {
  const maxBarHeight = 80

  return (
    <View style={[styles.chartContainer, { backgroundColor: theme.colors.card }]}>
      {weeklyPhotoCounts.map((day: any, index: number) => (
        <View key={index} style={styles.barWrapper}>
          <View
            style={[styles.bar, { height: (day.value / maxWeeklyPhotos) * maxBarHeight, backgroundColor: primary }]}
          />
          <Text style={[styles.barLabel, { color: sub }]}>{day.day}</Text>
        </View>
      ))}
    </View>
  )
})
WeeklyChart.displayName = "WeeklyChart"

const calculateStats = (photos: Photo[]) => {
  if (photos.length === 0) {
    return {
      currentStreak: 0,
      daysTracked: 0,
      weeklyPhotoCounts: Array.from({ length: 7 }, (_, i) => ({
        day: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", { weekday: "short" }),
        value: 0,
      })),
    }
  }

  // Calculate current streak more efficiently
  let currentStreak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const photoDates = new Set(photos.map((photo) => new Date(photo.created_at).toDateString()))

  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today)
    checkDate.setDate(today.getDate() - i)
    if (photoDates.has(checkDate.toDateString())) {
      currentStreak++
    } else {
      break
    }
  }

  // Calculate days tracked (already optimized with Set)
  const daysTracked = photoDates.size

  // Calculate weekly photo counts more efficiently
  const weeklyPhotoCounts = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (6 - i))
    return {
      day: date.toLocaleDateString("en-US", { weekday: "short" }),
      value: 0,
    }
  })

  const oneWeekAgo = new Date(today)
  oneWeekAgo.setDate(today.getDate() - 6)

  photos.forEach((photo) => {
    const photoDate = new Date(photo.created_at)
    photoDate.setHours(0, 0, 0, 0)

    if (photoDate >= oneWeekAgo && photoDate <= today) {
      const daysDiff = Math.floor((today.getTime() - photoDate.getTime()) / (24 * 60 * 60 * 1000))
      if (daysDiff >= 0 && daysDiff < 7) {
        weeklyPhotoCounts[6 - daysDiff].value++
      }
    }
  })

  return { currentStreak, daysTracked, weeklyPhotoCounts }
}

export default function ProgressScreen() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const auth = useContext(AuthContext)
  const { token } = auth || {}
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    let mounted = true
    async function getSession() {
      const { data } = await supabase.auth.getSession()
      if (mounted) {
        setSession(data?.session)
      }
    }
    getSession()
    return () => {
      mounted = false
    }
  }, [token])

  const { isDarkMode, theme } = useTheme()
  const palette = isDarkMode ? Colors.dark : Colors.light
  const primary = palette.primary
  const sub = palette.textSecondary

  const stats = useMemo(() => calculateStats(photos), [photos])
  const maxWeeklyPhotos = useMemo(
    () => Math.max(...stats.weeklyPhotoCounts.map((d) => d.value), 1),
    [stats.weeklyPhotoCounts],
  )

  const fetchPhotosFromDB = useCallback(async (userId: string, showLoading = true) => {
    if (showLoading) setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from("photos")
        .select("id, url, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(100) // Limit initial load for better performance

      if (error) throw error
      setPhotos(data || [])
    } catch (err: any) {
      setError(err.message)
      setPhotos([])
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (session?.user?.id) {
      fetchPhotosFromDB(session.user.id)
    }
  }, [session?.user?.id, fetchPhotosFromDB])

  const handleRefresh = useCallback(async () => {
    if (!session?.user?.id) return
    setRefreshing(true)
    await fetchPhotosFromDB(session.user.id, false)
    setRefreshing(false)
  }, [session?.user?.id, fetchPhotosFromDB])

  const resetProgress = useCallback(async () => {
    Alert.alert(
      "Reset Progress",
      "Are you sure you want to delete all your progress photos? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            if (!session?.user?.id || photos.length === 0) return

            setLoading(true)
            try {
              const deletePromises = photos.map(async (photo) => {
                const urlParts = photo.url.split("/photos/")
                const path = urlParts.length > 1 ? urlParts[1] : photo.url

                return fetch("https://vpnitpweduycfmndmxsf.supabase.co/functions/v1/delete-photo-storage", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.access_token}`,
                  },
                  body: JSON.stringify({
                    photoId: photo.id,
                    path: path,
                  }),
                })
              })

              await Promise.all(deletePromises)
              setPhotos([])

              if (auth?.resetProgress) {
                await auth.resetProgress()
              }
            } catch (err: any) {
              setError(err.message)
              fetchPhotosFromDB(session.user.id, false)
            } finally {
              setLoading(false)
            }
          },
        },
      ],
    )
  }, [session, photos, auth, fetchPhotosFromDB])

  // useBreakpoint()
  // useWindowDimensions()

  const renderPhotoItem = useCallback(({ item }: { item: Photo }) => <PhotoItem photo={item} />, [])

  const getItemLayout = useCallback(
    (data: any, index: number) => ({
      length: width / 3,
      offset: (width / 3) * index,
      index,
    }),
    [],
  )

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: palette.background,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color={primary} />
      </View>
    )
  }

  if (error) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: palette.background,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text style={{ color: palette.text }}>Error: {error}</Text>
      </View>
    )
  }

  return (
    <Layout>
      <ModernHeader title="Your Progress" />
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: 40,
        }}
      >
        <View style={styles.statsContainer}>
          <StatsCard value={photos.length} label="Total Photos" color={primary} />
          <StatsCard value={stats.currentStreak} label="Current Streak" color={primary} />
          <StatsCard value={stats.daysTracked} label="Days Tracked" color={primary} />
        </View>

        <SectionHeader title="Weekly Activity" />
        <WeeklyChart
          weeklyPhotoCounts={stats.weeklyPhotoCounts}
          maxWeeklyPhotos={maxWeeklyPhotos}
          primary={primary}
          sub={sub}
          theme={theme}
        />

        <SectionHeader title="All Photos" />
        <TouchableOpacity
          onPress={handleRefresh}
          style={[styles.refreshButton, { backgroundColor: primary }]}
          disabled={refreshing}
        >
          <Text style={styles.refreshButtonText}>{refreshing ? "Refreshing..." : "Refresh"}</Text>
        </TouchableOpacity>

        <FlatList
          data={photos}
          renderItem={renderPhotoItem}
          keyExtractor={(item) => item.id}
          numColumns={3}
          getItemLayout={getItemLayout}
          initialNumToRender={21} // 7 rows of 3 photos
          maxToRenderPerBatch={21}
          windowSize={10}
          removeClippedSubviews={true}
          scrollEnabled={false} // Disable scroll since it's inside ScrollView
          contentContainerStyle={styles.photoGrid}
        />

        <TouchableOpacity onPress={resetProgress} style={styles.resetButton} disabled={loading}>
          <Text style={styles.resetButtonText}>{loading ? "Resetting..." : "Reset Progress"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </Layout>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 10,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  statLabel: {
    fontSize: 14,
    textAlign: "center",
  },
  chartContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    padding: 10,
    borderRadius: 10,
    margin: 10,
    height: 120,
  },
  barWrapper: {
    alignItems: "center",
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
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
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
    backgroundColor: "#ff3b30",
    borderRadius: 10,
    alignItems: "center",
  },
  resetButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  refreshButton: {
    margin: 10,
    alignSelf: "flex-end",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  refreshButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  loadMoreButton: {
    margin: 20,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  loadMoreButtonText: {
    color: "white",
    fontWeight: "bold",
  },
})
