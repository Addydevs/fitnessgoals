import { AuthContext } from "@/app/_layout"
import { Colors } from "@/constants/Colors"
import { useTheme } from "@/contexts/ThemeContext"
import { supabase } from "@/utils/supabase"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { memo, useCallback, useContext, useEffect, useMemo, useState } from "react"
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Layout, { ModernCard, ModernHeader, SectionHeader } from "./Layout";

// Helper to push notification to AsyncStorage
async function pushNotification(message: string) {
  try {
    const stored = await AsyncStorage.getItem("generalNotifications");
    let loaded = stored ? JSON.parse(stored) : [];
    const newNotif = {
      id: `${Date.now()}-${Math.random()}`,
      message,
      timestamp: new Date().toISOString(),
      read: false,
    };
    loaded.unshift(newNotif);
    await AsyncStorage.setItem("generalNotifications", JSON.stringify(loaded));
  } catch {
    // fail silently
  }
}




// Define the Photo type locally if it's not easily importable
interface Photo {
  id: string
  url: string
  created_at: string
}

const { width } = Dimensions.get("window")

const PhotoItem = memo(({ photo, onPress, onDelete, isEditMode }: { photo: Photo; onPress?: () => void; onDelete?: () => void; isEditMode?: boolean }) => {
  const getTimeAgo = (dateString: string) => {
    const now = new Date()
    const photoDate = new Date(dateString)
    const diffInMs = now.getTime() - photoDate.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
    
    if (diffInDays < 1) {
      return "Today"
    } else if (diffInDays === 1) {
      return "1 day ago"
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`
    } else if (diffInDays < 14) {
      return "1 week ago"
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7)
      return `${weeks} weeks ago`
    } else if (diffInDays < 60) {
      return "1 month ago"
    } else if (diffInDays < 365) {
      const months = Math.floor(diffInDays / 30)
      return `${months} months ago`
    } else {
      const years = Math.floor(diffInDays / 365)
      return years === 1 ? "1 year ago" : `${years} years ago`
    }
  }

  return (
    <TouchableOpacity 
      onPress={onPress}
      style={styles.photoContainer}
    >
      <Image
        source={{ uri: photo.url }}
        style={styles.photo}
        onError={() => console.log("Failed to load image:", photo.url)}
        resizeMode="cover"
        fadeDuration={200}
      />
      
      {/* Time ago overlay */}
      <View style={styles.dateOverlay}>
        <Text style={styles.dateOverlayText}>{getTimeAgo(photo.created_at)}</Text>
      </View>
      
      {/* Edit mode overlay with subtle delete option */}
      {isEditMode && (
        <View style={styles.editModeOverlay}>
          <TouchableOpacity 
            style={styles.subtleDeleteButton} 
            onPress={(e) => {
              e.stopPropagation()
              onDelete?.()
            }}
          >
            <Text style={styles.subtleDeleteText}>−</Text>
          </TouchableOpacity>
        </View>
      )}
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
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [deletingPhoto, setDeletingPhoto] = useState<string | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)

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
      const prevCount = photos.length;
      setPhotos(data || []);
      if (data && data.length > prevCount) {
        await pushNotification('You uploaded a new progress photo!');
      }
    } catch (err: any) {
      setError(err.message)
      setPhotos([])
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [photos.length])

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

  const deletePhoto = useCallback(async (photo: Photo) => {
    Alert.alert(
      "Delete Photo",
      "Are you sure you want to delete this progress photo?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!session?.user?.id) return

            setDeletingPhoto(photo.id)
            try {
              const urlParts = photo.url.split("/photos/")
              const path = urlParts.length > 1 ? urlParts[1] : photo.url

              const response = await fetch("https://vpnitpweduycfmndmxsf.supabase.co/functions/v1/delete-photo-storage", {
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

              if (response.ok) {
                setPhotos(prev => prev.filter(p => p.id !== photo.id))
                setModalVisible(false)
              } else {
                throw new Error('Failed to delete photo')
              }
            } catch (err: any) {
              setError(err.message)
              Alert.alert("Error", "Failed to delete photo. Please try again.")
            } finally {
              setDeletingPhoto(null)
            }
          },
        },
      ],
    )
  }, [session])

  const openPhotoModal = useCallback((photo: Photo) => {
    setSelectedPhoto(photo)
    setModalVisible(true)
  }, [])

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

  const renderPhotoItem = useCallback(({ item }: { item: Photo }) => (
    <PhotoItem 
      photo={item} 
      onPress={isEditMode ? () => deletePhoto(item) : () => openPhotoModal(item)}
      onDelete={() => deletePhoto(item)}
      isEditMode={isEditMode}
    />
  ), [openPhotoModal, deletePhoto, isEditMode])

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
        <View style={styles.photoActionsRow}>
          <TouchableOpacity
            onPress={handleRefresh}
            style={[styles.refreshButton, { backgroundColor: primary }]}
            disabled={refreshing}
          >
            <Text style={styles.refreshButtonText}>{refreshing ? "Refreshing..." : "Refresh"}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => setIsEditMode(!isEditMode)}
            style={[styles.editButton, { backgroundColor: isEditMode ? "#ff3b30" : primary }]}
          >
            <Text style={styles.editButtonText}>{isEditMode ? "Done" : "Edit"}</Text>
          </TouchableOpacity>
        </View>

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

      {/* Photo Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            {selectedPhoto && (
              <>
                <View style={styles.modalHeader}>
                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={[styles.closeButtonText, { color: palette.text }]}>×</Text>
                  </TouchableOpacity>
                </View>
                
                <Image 
                  source={{ uri: selectedPhoto.url }} 
                  style={styles.modalImage}
                  resizeMode="contain"
                />
                
                <View style={styles.modalInfo}>
                  <Text style={[styles.modalDate, { color: palette.text }]}>
                    {new Date(selectedPhoto.created_at).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                  
                  <TouchableOpacity 
                    style={[styles.modalDeleteButton, { opacity: deletingPhoto === selectedPhoto.id ? 0.5 : 1 }]}
                    onPress={() => deletePhoto(selectedPhoto)}
                    disabled={deletingPhoto === selectedPhoto.id}
                  >
                    <Text style={styles.modalDeleteButtonText}>
                      {deletingPhoto === selectedPhoto.id ? "Deleting..." : "Delete Photo"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
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
    position: 'relative',
  },
  selectedPhoto: {
    borderWidth: 3,
    borderColor: '#007AFF',
  },
  draggedPhoto: {
    opacity: 0.5,
    transform: [{ scale: 1.1 }],
  },
  reorderPhoto: {
    borderWidth: 2,
    borderColor: '#FF9500',
    borderStyle: 'dashed',
  },
  photoOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    padding: 4,
  },
  checkmark: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reorderIcon: {
    backgroundColor: '#FF9500',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dragIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 5,
    padding: 5,
    transform: [{ translateX: -50 }, { translateY: -10 }],
  },
  dragText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
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
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  refreshButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  photoActionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 10,
    marginBottom: 10,
  },
  editButton: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  editButtonText: {
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
  deleteButton: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "rgba(255, 59, 48, 0.9)",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    lineHeight: 20,
  },
  dateOverlay: {
    position: "absolute",
    bottom: 5,
    left: 5,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dateOverlayText: {
    color: "white",
    fontSize: 10,
    fontWeight: "600",
  },
  editModeOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  subtleDeleteButton: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  subtleDeleteText: {
    color: "#ff3b30",
    fontSize: 24,
    fontWeight: "300",
    lineHeight: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxHeight: "90%",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
  },
  modalHeader: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 10,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  modalImage: {
    width: "100%",
    height: 300,
    borderRadius: 10,
    marginBottom: 20,
  },
  modalInfo: {
    width: "100%",
    alignItems: "center",
  },
  modalDate: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  modalDeleteButton: {
    backgroundColor: "#ff3b30",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
  },
  modalDeleteButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
})
