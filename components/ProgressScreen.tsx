"use client"

import { AuthContext } from "@/app/_layout"
import { Colors } from "@/constants/Colors"
import { useTheme } from "@/contexts/ThemeContext"
import { useBreakpoint } from "@/utils/responsive"
import { supabase } from "@/utils/supabase"
import { useContext, useMemo, useState, useCallback, useEffect } from "react"
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native"
import Layout, { ModernCard, ModernHeader, SectionHeader } from "./Layout"

// Define the Photo type locally if it's not easily importable
interface Photo {
  id: string
  url: string
  created_at: string
}

const { width } = Dimensions.get("window")

// Calculate current streak (consecutive days with photos)
const getCurrentStreak = (photoList: Photo[]): number => {
  if (photoList.length === 0) return 0
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today)
    checkDate.setDate(today.getDate() - i)
    const hasPhotoOnDate = photoList.some((photo) => {
      const photoDate = new Date(photo.created_at)
      return photoDate.toDateString() === checkDate.toDateString()
    })
    if (hasPhotoOnDate) {
      streak++
    } else {
      break
    }
  }
  return streak
}

// Calculate days tracked (unique days with photos)
const getDaysTracked = (photoList: Photo[]): number => {
  const uniqueDays = new Set<string>()
  photoList.forEach((photo) => {
    const photoDate = new Date(photo.created_at).toDateString()
    uniqueDays.add(photoDate)
  })
  return uniqueDays.size
}

// Show last 7 days (rolling window)
const getWeeklyPhotoCounts = (photoList: Photo[]) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days = []
  const counts: { day: string; value: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    days.push(date)
    counts.push({
      day: date.toLocaleDateString("en-US", { weekday: "short" }),
      value: 0,
    })
  }

  photoList.forEach((photo) => {
    const photoDate = new Date(photo.created_at)
    photoDate.setHours(0, 0, 0, 0)
    const dayIndex = days.findIndex((d) => d.getTime() === photoDate.getTime())
    if (dayIndex !== -1) {
      counts[dayIndex].value++
    }
  })

  return counts
}

export default function ProgressScreen() {
  // Use local state for photos
  const [photos, setPhotos] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const auth = useContext(AuthContext)
  const { token } = auth || {}
  // Get session from Supabase
  const [session, setSession] = useState<any>(null)
  useEffect(() => {
    async function getSession() {
      const { data } = await supabase.auth.getSession()
      setSession(data?.session)
    }
    getSession()
  }, [token])
  const { isDarkMode, theme } = useTheme()
  const palette = isDarkMode ? Colors.dark : Colors.light
  const primary = palette.primary
  const sub = palette.textSecondary
  const border = theme.colors.border
  const totalPhotos = photos.length
  const maxBarHeight = 80

  const [displayedPhotos, setDisplayedPhotos] = useState<any[]>([])
  const [photosPerPage] = useState(20)
  const [currentPage, setCurrentPage] = useState(1)

  const currentStreak = useMemo(() => getCurrentStreak(photos), [photos])
  const daysTracked = useMemo(() => getDaysTracked(photos), [photos])
  const weeklyPhotoCounts = useMemo(() => getWeeklyPhotoCounts(photos), [photos])
  const maxWeeklyPhotos = useMemo(() => Math.max(...weeklyPhotoCounts.map((d) => d.value), 1), [weeklyPhotoCounts])

  // Always fetch photos from Supabase and update local state, stable reference
  const fetchPhotosFromDB = useCallback(async (userId: string, showLoading = true) => {
    if (showLoading) setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from("photos")
        .select("id, url, user_id, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (error) throw error

      setPhotos(data || [])
      setCurrentPage(1) // Reset pagination
    } catch (err: any) {
      setError(err.message)
      setPhotos([])
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [])

  // Fetch photos on screen focus
  useEffect(() => {
    if (session?.user?.id) {
      fetchPhotosFromDB(session.user.id)
    }
  }, [session?.user?.id, fetchPhotosFromDB])

  useEffect(() => {
    const startIndex = 0
    const endIndex = currentPage * photosPerPage
    setDisplayedPhotos(photos.slice(startIndex, endIndex))
  }, [photos, currentPage, photosPerPage])

  const resetProgress = async () => {
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
              for (const photo of photos) {
                // Extract path from URL (remove the base URL part)
                const urlParts = photo.url.split("/photos/")
                const path = urlParts.length > 1 ? urlParts[1] : photo.url

                const res = await fetch("https://vpnitpweduycfmndmxsf.supabase.co/functions/v1/delete-photo-storage", {
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

                if (!res.ok) {
                  const errorData = await res.json()
                  throw new Error(`Failed to delete photo ${photo.id}: ${errorData.error || "Unknown error"}`)
                }
              }

              // Clear local state immediately for better UX
              setPhotos([])
              setDisplayedPhotos([])

              if (auth?.resetProgress) {
                await auth.resetProgress()
              }
            } catch (err: any) {
              setError(err.message)
              // Refresh to get current state if deletion failed
              fetchPhotosFromDB(session.user.id, false)
            } finally {
              setLoading(false)
            }
          },
        },
      ],
    )
  }

  useBreakpoint()
  useWindowDimensions()

  const loadMorePhotos = () => {
    if (displayedPhotos.length < photos.length) {
      setCurrentPage((prev) => prev + 1)
    }
  }

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: palette.background, justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={primary} />
      </View>
    )
  }

  if (error) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: palette.background, justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Text style={{ color: palette.text }}>Error: {error}</Text>
      </View>
    )
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
                style={[styles.bar, { height: (day.value / maxWeeklyPhotos) * maxBarHeight, backgroundColor: primary }]}
              />
              <Text style={[styles.barLabel, { color: sub }]}>{day.day}</Text>
            </View>
          ))}
        </View>

        <SectionHeader title="All Photos" />
        <TouchableOpacity
          onPress={() => session?.user?.id && fetchPhotosFromDB(session.user.id)}
          style={[styles.refreshButton, { backgroundColor: primary }]}
          disabled={loading}
        >
          <Text style={styles.refreshButtonText}>{loading ? "Refreshing..." : "Refresh"}</Text>
        </TouchableOpacity>

        <View style={styles.photoGrid}>
          {displayedPhotos.map((photo, index) => (
            <TouchableOpacity key={photo.id || index} style={styles.photoContainer}>
              <Image
                source={{ uri: photo.url }}
                style={styles.photo}
                onError={() => console.log("Failed to load image:", photo.url)}
              />
            </TouchableOpacity>
          ))}
        </View>

        {displayedPhotos.length < photos.length && (
          <TouchableOpacity onPress={loadMorePhotos} style={[styles.loadMoreButton, { backgroundColor: primary }]}>
            <Text style={styles.loadMoreButtonText}>Load More Photos</Text>
          </TouchableOpacity>
        )}

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
