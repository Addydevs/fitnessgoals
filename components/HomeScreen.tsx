import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Camera } from "expo-camera";
// FileSystem not used in HomeScreen
// ImagePicker not used directly in HomeScreen
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from '@/contexts/ThemeContext';
import { Photo, RootStackParamList } from "../app/(tabs)/_layout"; // Import Photo and RootStackParamList from _layout.tsx
import { onUserChange } from '../utils/userEvents';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;


interface Notification {
  id: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface UserStats {
  totalPhotos: number;
  lastPhotoDate: string | null;
  startDate: string;
  currentStreak: number;
  photosThisWeek: number;
  updatedAt: string;
}

interface HomeScreenProps {
  photos: Photo[];
  setPhotos: (photos: Photo[]) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  navigation?: NavigationProp;
}

// UserType interface
interface UserType {
  fullName: string;
  email: string;
  avatar?: string | null;
}

const { width: screenWidth } = Dimensions.get("window");
// OPENAI_API_KEY not used in HomeScreen

// Helper Functions for Data Tracking
const getCurrentStreak = (photos: Photo[]): number => {
  if (photos.length === 0) return 0;

  let streak = 0;
  const today = new Date();

  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() - i);

    const hasPhotoOnDate = photos.some((photo) => {
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

const getPhotosThisWeek = (photos: Photo[]): number => {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  return photos.filter((photo) => {
    const photoDate = new Date(photo.timestamp);
    return photoDate >= weekAgo;
  }).length;
};

const hasPhotoOnDate = (photos: Photo[], targetDate: Date): boolean => {
  return photos.some((photo) => {
    const photoDate = new Date(photo.timestamp);
    return photoDate.toDateString() === targetDate.toDateString();
  });
};

const saveUserStats = async (photos: Photo[]): Promise<UserStats | null> => {
  const stats: UserStats = {
    totalPhotos: photos.length,
    lastPhotoDate: photos.length > 0 ? photos[photos.length - 1].timestamp : null,
    startDate: photos.length > 0 ? photos[0].timestamp : new Date().toISOString(),
    currentStreak: getCurrentStreak(photos),
    photosThisWeek: getPhotosThisWeek(photos),
    updatedAt: new Date().toISOString(),
  };

  try {
    await AsyncStorage.setItem("userStats", JSON.stringify(stats));
    return stats;
  } catch (error) {
    console.error("Error saving user stats:", error);
    return null;
  }
};

const loadUserStats = async (): Promise<UserStats> => {
  try {
    const stats = await AsyncStorage.getItem("userStats");
    return stats
      ? JSON.parse(stats)
      : {
          totalPhotos: 0,
          lastPhotoDate: null,
          startDate: new Date().toISOString(),
          currentStreak: 0,
          photosThisWeek: 0,
          updatedAt: new Date().toISOString(),
        };
  } catch (error) {
    console.error("Error loading user stats:", error);
    return {
      totalPhotos: 0,
      lastPhotoDate: null,
      startDate: new Date().toISOString(),
      currentStreak: 0,
      photosThisWeek: 0,
      updatedAt: new Date().toISOString(),
    };
  }
};

// extractProgressScore removed (not used in this file)

// Main Component
export default function HomeScreen({
  photos = [],
  setPhotos = () => {},
  loading = false,
  setLoading = () => {},
  navigation,
}: HomeScreenProps) {
  const { isDarkMode, theme } = useTheme();
  const styles = getStyles(isDarkMode, theme) as any;
  const barStyle = isDarkMode ? ("light-content" as const) : ("dark-content" as const);
  const barBg = isDarkMode ? theme.colors.background : "white";

  // cameraPermission state removed (not needed in HomeScreen)
  const [showWelcome, setShowWelcome] = useState<boolean>(true);
  const [currentDate] = useState<Date>(new Date());
  const [isModalVisible, setModalVisible] = useState(false);
  const [generalNotifications, setGeneralNotifications] = useState<Notification[]>([]);
  const [user, setUser] = useState<UserType | null>(null);
  const [userStats, setUserStats] = useState<UserStats>({
    totalPhotos: 0,
    currentStreak: 0,
    photosThisWeek: 0,
    lastPhotoDate: null,
    startDate: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  useFocusEffect(() => {
    getCameraPermission();
    checkWelcomeStatus();
    loadUserStatsData();
    loadGeneralNotificationsData();
    loadUserData();
  });

  // Subscribe to external user updates (from ProfileScreen)
  // loadUserData needs to be stable for effects; define above as useCallback
  const loadUserData = React.useCallback(async (): Promise<void> => {
    try {
      const userData = await AsyncStorage.getItem("user");
      if (userData) {
        const parsed = JSON.parse(userData);
        const nextUser = {
          fullName: parsed.name || parsed.fullName || "User",
          email: parsed.email || "",
          avatar: normalizeAvatarUri(parsed.avatar) || null,
        };
        // Avoid unnecessary state updates
        setUser((prev) => {
          if (!prev) return nextUser;
          if (prev.fullName === nextUser.fullName && prev.email === nextUser.email && prev.avatar === nextUser.avatar) return prev;
          return nextUser;
        });
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  }, []);

  useEffect(() => {
    const unsub = onUserChange((u) => {
      try {
        // Support multiple possible payload shapes: { fullName, name, email, avatar, uri }
        const fullName = (u as any).fullName || (u as any).name || null;
        const email = (u as any).email || null;
        const avatarRaw = (u as any).avatar || (u as any).uri || (u as any).avatarUri || null;
        const avatar = normalizeAvatarUri(avatarRaw) || null;
        // If the payload contains at least one user field, update state directly and skip async reload
        if (fullName || email || avatar) {
          setUser((prev) => {
            const next = { ...(prev || { fullName: fullName || 'User', email: email || '' }), avatar: avatar || prev?.avatar || null, fullName: fullName || prev?.fullName } as any;
            if (prev && prev.fullName === next.fullName && prev.email === next.email && prev.avatar === next.avatar) return prev;
            return next;
          });

          // If a weekStreak is provided by the profile, update userStats.currentStreak only if different
          const weekStreak = (u as any).weekStreak;
          if (typeof weekStreak === 'number') {
            setUserStats((s) => {
              if (s && s.currentStreak === weekStreak) return s;
              return { ...(s || {}), currentStreak: weekStreak };
            });
          }
        } else {
          // Fallback: if payload is empty/unknown, reload stored user
          loadUserData();
        }
      } catch (err) {
        console.error('Error handling onUserChange:', err);
      }
    });
    return () => unsub();
  }, [loadUserData]);

  const normalizeAvatarUri = (uri: string | null | undefined): string | null => {
    if (!uri) return null;
    const s = String(uri);
    if (s.startsWith('http') || s.startsWith('data:') || s.startsWith('file:') || s.startsWith('content:')) return s;
    if (s.startsWith('/')) return `file://${s}`;
    return s;
  };

  const updateUserStats = useCallback(async () => {
    const newStats = await saveUserStats(photos);
    if (newStats) {
      setUserStats(newStats);
    }
  }, [photos]);

  useEffect(() => {
    updateUserStats();
  }, [updateUserStats]);

  const loadUserStatsData = async (): Promise<void> => {
    const stats = await loadUserStats();
    setUserStats(stats);
  };

  const checkWelcomeStatus = async (): Promise<void> => {
    try {
      const hasSeenWelcome = await AsyncStorage.getItem("hasSeenWelcome");
      if (hasSeenWelcome === "true") {
        setShowWelcome(false);
      }
    } catch (error) {
      console.error("Error checking welcome status:", error);
    }
  };

  const handleGetStarted = async (): Promise<void> => {
    try {
      await AsyncStorage.setItem("hasSeenWelcome", "true");
      setShowWelcome(false);
    } catch (error) {
      console.error("Error saving welcome status:", error);
    }
  };

  const getCameraPermission = async (): Promise<void> => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      console.log('camera permission status:', status);
    } catch (err) {
      console.error('Error requesting camera permission:', err);
    }
  };

  // Camera/photo processing is handled in CameraScreen; Home no longer defines processNewPhoto.


  // uriToBase64 moved to CameraScreen where needed

  const saveGeneralNotifications = async (newNotifications: Notification[]): Promise<void> => {
    try {
      await AsyncStorage.setItem("generalNotifications", JSON.stringify(newNotifications));
    } catch (error) {
      console.error("Error saving general notifications:", error);
    }
  };

  const loadGeneralNotifications = async (): Promise<Notification[]> => {
    try {
      const storedNotifications = await AsyncStorage.getItem("generalNotifications");
      return storedNotifications ? JSON.parse(storedNotifications) : [];
    } catch (error) {
      console.error("Error loading general notifications:", error);
      return [];
    }
  };

  const loadGeneralNotificationsData = async (): Promise<void> => {
    const loadedNotifications = await loadGeneralNotifications();
    setGeneralNotifications(loadedNotifications);
    if (loadedNotifications.length === 0) {
      // Add a welcome notification if no notifications exist
      addGeneralNotification({
        message: "Welcome to CaptureFit Progress! Start by taking your first progress photo.",
        read: false,
      });
    }
  };

  const addGeneralNotification = async (notification: Omit<Notification, "id" | "timestamp">): Promise<void> => {
    const newNotification: Notification = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...notification,
    };
    const updatedNotifications = [...generalNotifications, newNotification];
    setGeneralNotifications(updatedNotifications);
    await saveGeneralNotifications(updatedNotifications);
  };

  const markGeneralNotificationAsRead = async (id: string): Promise<void> => {
    const updatedNotifications = generalNotifications.map((notif) =>
      notif.id === id ? { ...notif, read: true } : notif,
    );
    setGeneralNotifications(updatedNotifications);
    await saveGeneralNotifications(updatedNotifications);
  };


  // duplicate loadUserData removed; using the stable useCallback version defined earlier

  // savePhotos removed from HomeScreen; CameraScreen owns photo persistence

  const generateWeekDays = (): { day: string; date: number; isToday: boolean; fullDate: Date; hasPhoto: boolean }[] => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const today = new Date();
    const currentDay = today.getDay();

    return days.map((day, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - currentDay + index);

      return {
        day,
        date: date.getDate(),
        isToday: index === currentDay,
        fullDate: date,
        hasPhoto: hasPhotoOnDate(photos, date),
      };
    });
  };

  const weekDays = generateWeekDays();

  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };

  const NotificationModal = () => {

    return (
      <Modal animationType="slide" transparent={true} visible={isModalVisible} onRequestClose={toggleModal}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Notifications</Text>
            <ScrollView style={styles.notificationScrollView}>
              {generalNotifications.length === 0 ? (
                <Text style={styles.noNotificationsText}>No notifications yet.</Text>
              ) : (
                generalNotifications.map((notif) => (
                  <View key={notif.id} style={[styles.notificationItem, !notif.read && styles.unreadNotification]}>
                    <View style={styles.notificationTextContent}>
                      <Text style={styles.notificationMessage}>{notif.message}</Text>
                      <Text style={styles.notificationTimestamp}>
                        {new Date(notif.timestamp).toLocaleString()}
                      </Text>
                    </View>
                    {!notif.read && (
                      <TouchableOpacity onPress={() => markGeneralNotificationAsRead(notif.id)} style={styles.markReadButton}>
                        <Feather name="check-circle" size={20} color="#10B981" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))
              )}
            </ScrollView>
            <TouchableOpacity onPress={toggleModal} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    );
  };

  // Welcome Screen
  if (showWelcome) {
    return (
      <View style={styles.welcomeContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="white" />
        <TouchableOpacity style={styles.skipButton} onPress={handleGetStarted}>
          <Text style={styles.skipText}>Skip</Text>
          <Feather name="chevron-right" size={18} color="#666" />
        </TouchableOpacity>
        <View style={styles.heroImageContainer}>
          <View style={styles.heroImageBackground}>
            <Feather name="activity" size={80} color="#000" />
            <Text style={styles.heroImageText}>CaptureFit Progress</Text>
          </View>
        </View>
        <View style={styles.welcomeContent}>
          <Text style={styles.welcomeTitle}>Track Your Fitness{"\n"}Journey with AI</Text>
          <Text style={styles.welcomeSubtitle}>
            Capture progress photos and get AI-powered insights to achieve your fitness goals faster.
          </Text>
          <View style={styles.pageIndicators}>
            <View style={[styles.indicator, styles.indicatorActive]} />
            <View style={styles.indicator} />
            <View style={styles.indicator} />
            <View style={styles.indicator} />
          </View>
          <TouchableOpacity style={styles.getStartedButton} onPress={handleGetStarted} activeOpacity={0.9}>
            <Text style={styles.getStartedText}>Start Tracking</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Main Home Screen
  return (
    <SafeAreaView style={styles.container}>
  <StatusBar barStyle={barStyle} backgroundColor={barBg} />
      <NotificationModal />
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.userProfile}>
            <View style={styles.profileImageContainer}>
              {user?.avatar ? (
  <Image source={{ uri: normalizeAvatarUri(user.avatar) || undefined }} style={styles.avatarImage}
    onLoad={() => console.log('Header avatar loaded:', user?.avatar)}
    onError={(e) => console.error('Header avatar failed to load', e.nativeEvent || e)}
  />
) : user?.fullName ? (
  <Text style={styles.avatarText}>{user.fullName.charAt(0).toUpperCase()}</Text>
) : (
  <Feather name="user" size={24} color="#FF6B35" />
)}
            </View>
            <View style={styles.greetingContainer}>
              <Text style={styles.greeting}>{user?.fullName || "CaptureFit Progress"}</Text>
              <Text style={styles.date}>
                {user?.email || "Today "}
                {user?.email ? "" : currentDate.toLocaleDateString("en-US", {
                  day: "numeric",
                  month: "short",
                })}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.notificationButton} onPress={toggleModal}>
            <MaterialCommunityIcons
  name="bell"
  size={24}
  style={styles.notificationIcon}
/>
            {generalNotifications.filter((notif) => !notif.read).length > 0 && (
              <View style={styles.notificationDot} />
            )}
          </TouchableOpacity>
        </View>
      </View>

  {/* Main Home Screen */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* AI Analysis Challenge Card */}
        <View style={styles.challengeCard}>
          <LinearGradient
            colors={["#A855F7", "#7C3AED"]}
            style={styles.challengeGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.challengeContent}>
              <Text style={styles.challengeTitle}>AI Analysis{"\n"}Ready</Text>
              <Text style={styles.challengeSubtitle}>
                {userStats.totalPhotos === 0
                  ? "Take your first progress photo"
                  : `${userStats.totalPhotos} photos analyzed • 🔥 ${userStats.currentStreak} day streak`}
              </Text>

              <View style={styles.progressIndicators}>
                <View style={styles.progressItem}>
                  <Text style={styles.progressNumber}>{userStats.totalPhotos}</Text>
                  <Text style={styles.progressLabel}>Photos</Text>
                </View>
                <View style={styles.progressItem}>
                  <Text style={styles.progressNumber}>{userStats.currentStreak}</Text>
                  <Text style={styles.progressLabel}>Day Streak</Text>
                </View>
              </View>
            </View>

            {/* 3D Spheres with Icons */}
            <View style={styles.challengeDecorations}>
              <View style={[styles.sphere, styles.aiSphere]}>
                <MaterialCommunityIcons name="brain" size={20} color="white" />
              </View>
              <View style={[styles.sphere, styles.cameraSphere]}>
                <Feather name="camera" size={16} color="white" />
              </View>
              <View style={[styles.sphere, styles.analysisSphere]}>
                <Feather name="bar-chart-2" size={18} color="white" />
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Photo Tracking Calendar */}
        <View style={styles.calendarContainer}>
          {weekDays.map((dayInfo, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.dayButton, dayInfo.isToday && styles.dayButtonActive]}
            >
              <Text style={[styles.dayText, dayInfo.isToday && styles.dayTextActive]}>{dayInfo.day}</Text>
              <View
                style={[
                  styles.photoIndicator,
                  dayInfo.hasPhoto && styles.hasPhoto,
                  dayInfo.isToday && dayInfo.hasPhoto && styles.todayPhoto,
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Actions Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>
        
        <View style={styles.planGrid}>
          {/* Capture Progress Card */}
          <TouchableOpacity style={[styles.planCard, styles.captureCard]} onPress={() => navigation?.navigate("aicoach")}>
            <View style={styles.planCardHeader}>
              <Feather name="camera" size={20} color="white" />
              <Text style={styles.planCardLabel}>Capture</Text>
            </View>
            <View style={styles.planCardBody}>
              <Text style={styles.planCardTitle}>Progress{"\n"}Photo</Text>
              <Text style={styles.planCardSubtitle}>
                {userStats.totalPhotos === 0 ? "Start your journey" : "Continue tracking"}
              </Text>
              <Text style={styles.planCardDetail}>AI analysis included</Text>
            </View>
            <View style={styles.planCardFooter}>
              <View style={styles.aiIcon}>
                <Feather name="zap" size={12} color="#FFA726" />
              </View>
              <Text style={styles.aiLabel}>AI Ready</Text>
            </View>
          </TouchableOpacity>

          {/* View Analysis Card */}
          <TouchableOpacity style={[styles.planCard, styles.analysisCard]} onPress={() => navigation?.navigate("progress")}>
            <View style={styles.planCardHeader}>
              <Feather name="trending-up" size={20} color="white" />
              <Text style={styles.planCardLabel}>Analysis</Text>
            </View>
            <View style={styles.planCardBody}>
              <Text style={styles.planCardTitle}>Progress{"\n"}Report</Text>
              <Text style={styles.planCardSubtitle}>
                {userStats.totalPhotos === 0 ? "No data yet" : `${userStats.totalPhotos} photos analyzed`}
              </Text>
              <Text style={styles.planCardDetail}>AI insights & trends</Text>
            </View>
            <View style={styles.planCardFooter}>
              <View style={styles.analysisIcon}>
                <Feather name="bar-chart-2" size={12} color="#7986CB" />
              </View>
              <Text style={styles.aiLabel}>{userStats.totalPhotos === 0 ? "Waiting" : "View Report"}</Text>
            </View>

            {userStats.totalPhotos > 0 && (
              <View style={styles.progressVisualization}>
                <View style={styles.progressBar}>
                  <View
                    style={[styles.progressFill, { width: `${Math.min(userStats.totalPhotos * 10, 100)}%` }]}
                  />
                </View>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* AI Features Row */}
        <View style={styles.aiFeatures}>
          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: "#E91E63" }]}>
              <Feather name="eye" size={16} color="white" />
            </View>
            <Text style={styles.featureLabel}>Body Analysis</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: "#9C27B0" }]}>
              <Feather name="activity" size={16} color="white" />
            </View>
            <Text style={styles.featureLabel}>Progress Tracking</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: "#4CAF50" }]}>
              <Feather name="target" size={16} color="white" />
            </View>
            <Text style={styles.featureLabel}>Goal Insights</Text>
          </View>
        </View>

        {/* Recent Analysis Preview */}
        {userStats.totalPhotos > 0 && photos.length > 0 && (
          <View style={styles.recentSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Latest Analysis</Text>
              <TouchableOpacity onPress={() => navigation?.navigate("progress")}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.recentAnalysis}>
              <View style={styles.recentPhotoPlaceholder}>
                <Feather name="image" size={24} color="#9CA3AF" />
              </View>
              <View style={styles.recentContent}>
                <Text style={styles.recentTitle}>Latest Progress</Text>
                <Text style={styles.recentDate}>
                  {new Date(photos[photos.length - 1].timestamp).toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "short",
                  })}
                </Text>
                <Text style={styles.recentAnalysisText} numberOfLines={2}>
                  {photos[photos.length - 1].analysis || "Analysis complete!"}
                </Text>
              </View>
              <TouchableOpacity style={styles.viewButton} onPress={() => navigation?.navigate("progress")}>
                <Feather name="chevron-right" size={16} color="#A855F7" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#8B5FBF" />
            <Text style={styles.loadingTitle}>Analyzing Progress</Text>
            <Text style={styles.loadingSubtext}>AI is working its magic...</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

function getStyles(isDarkMode: boolean, theme: any): any {
  if (!isDarkMode) {
    // Exact LIGHT mode styles as provided
    return StyleSheet.create({
      // Welcome Screen Styles
      welcomeContainer: {
        flex: 1,
        backgroundColor: "white",
        paddingTop: 50,
      },
      skipButton: {
        position: "absolute",
        top: 60,
        right: 20,
        flexDirection: "row",
        alignItems: "center",
        zIndex: 10,
      },
      skipText: {
        fontSize: 16,
        color: "#666",
        marginRight: 4,
      },
      heroImageContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 40,
        paddingTop: 40,
      },
      heroImageBackground: {
        width: 280,
        height: 280,
        backgroundColor: "#a8e6cf",
        borderRadius: 40,
        justifyContent: "center",
        alignItems: "center",
        elevation: 10,
      },
      heroImageText: {
        fontSize: 18,
        fontWeight: "600",
        color: "#333",
        marginTop: 10,
      },
      welcomeContent: {
        paddingHorizontal: 30,
        paddingBottom: 50,
        alignItems: "center",
      },
      welcomeTitle: {
        fontSize: 32,
        fontWeight: "bold",
        color: "#000",
        textAlign: "center",
        lineHeight: 38,
        marginBottom: 16,
      },
      welcomeSubtitle: {
        fontSize: 16,
        color: "#666",
        textAlign: "center",
        lineHeight: 24,
        marginBottom: 40,
        paddingHorizontal: 10,
      },
      pageIndicators: {
        flexDirection: "row",
        marginBottom: 40,
      },
      indicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#e0e0e0",
        marginHorizontal: 4,
      },
      indicatorActive: {
        backgroundColor: "#a8e6cf",
        width: 24,
      },
      getStartedButton: {
        backgroundColor: "#a8e6cf",
        paddingVertical: 18,
        paddingHorizontal: 80,
        borderRadius: 30,
        width: "100%",
        alignItems: "center",
        elevation: 8,
      },
      getStartedText: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#000",
      },

      // Main App Styles
      container: {
        flex: 1,
        backgroundColor: "white",
      },
      header: {
        backgroundColor: "white",
        paddingRight: 55,
        paddingLeft: 15,
        paddingBottom: 16,
      },
      headerContent: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      },
      userProfile: {
        flexDirection: "row",
        alignItems: "center",
      },
      profileImageContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "#F3F4F6",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
      },
      avatarImage: {
        width: 44,
        height: 44,
        borderRadius: 22,
        resizeMode: 'cover',
        borderWidth: 2,
        borderColor: '#F3F4F6',
        backgroundColor: '#F3F4F6',
      },
      greetingContainer: {
        flex: 1,
      },
      greeting: {
        fontSize: 17,
        fontWeight: "600",
        color: "#1F2937",
        marginBottom: 2,
      },
      date: {
        fontSize: 13,
        color: "#6B7280",
      },
      notificationButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
        backgroundColor: "#F3F4F6",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
      },
      notificationIcon: {
        color: isDarkMode ? theme.colors.text : theme.colors.primary,
        paddingRight: 8, // Reduced padding
      },
      notificationDot: {
        position: "absolute",
        top: 8,
        right: 8,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#EF4444",
      },
      notBell: {
        marginRight: 20,
      },
      scrollView: {
        flex: 1,
      },
      scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 100,
      },
      challengeCard: {
        marginTop: 16,
        marginBottom: 20,
        borderRadius: 20,
        overflow: "hidden",
        elevation: 8,
        shadowColor: "#A855F7",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      challengeGradient: {
        padding: 20,
        height: 140,
        flexDirection: "row",
        justifyContent: "space-between",
        position: "relative",
      },
      challengeContent: {
        flex: 1,
        zIndex: 2,
      },
      challengeTitle: {
        fontSize: 24,
        fontWeight: "bold",
        color: "white",
        lineHeight: 28,
        marginBottom: 4,
      },
      challengeSubtitle: {
        fontSize: 14,
        color: "rgba(255,255,255,0.9)",
        marginBottom: 16,
      },
      progressIndicators: {
        flexDirection: "row",
        gap: 20,
      },
      progressItem: {
        alignItems: "center",
      },
      progressNumber: {
        fontSize: 18,
        fontWeight: "bold",
        color: "white",
      },
      progressLabel: {
        fontSize: 11,
        color: "rgba(255,255,255,0.8)",
      },
      challengeDecorations: {
        position: "absolute",
        right: 0,
        top: 0,
        bottom: 0,
        width: 120,
        zIndex: 1,
      },
      sphere: {
        position: "absolute",
        borderRadius: 50,
        justifyContent: "center",
        alignItems: "center",
      },
      aiSphere: {
        width: 45,
        height: 45,
        backgroundColor: "#10B981",
        top: 15,
        right: 20,
        shadowColor: "#10B981",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
      },
      cameraSphere: {
        width: 35,
        height: 35,
        backgroundColor: "#FFA726",
        top: 40,
        right: 45,
        shadowColor: "#FFA726",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
      },
      analysisSphere: {
        width: 40,
        height: 40,
        backgroundColor: "#42A5F5",
        bottom: 15,
        right: 30,
        shadowColor: "#42A5F5",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
      },
      calendarContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        backgroundColor: "white",
        borderRadius: 16,
        padding: 12,
        marginBottom: 20,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      dayButton: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 4,
        borderRadius: 12,
        alignItems: "center",
      },
      dayButtonActive: {
        backgroundColor: "#1F2937",
      },
      dayText: {
        fontSize: 11,
        color: "#9CA3AF",
        fontWeight: "500",
        marginBottom: 6,
      },
      dayTextActive: {
        color: "white",
      },
      photoIndicator: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: "#E5E7EB",
      },
      hasPhoto: {
        backgroundColor: "#10B981",
      },
      todayPhoto: {
        backgroundColor: "#EF4444",
      },
      sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
      },
      sectionTitle: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#1F2937",
      },
      viewAllText: {
        fontSize: 14,
        color: "#A855F7",
        fontWeight: "500",
      },
      planGrid: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 20,
        gap: 12,
      },
      planCard: {
        width: (screenWidth - 52) / 2,
        height: 200,
        borderRadius: 20,
        padding: 16,
        position: "relative",
        elevation: 4,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      captureCard: {
        backgroundColor: "#FFA726",
        shadowColor: "#FFA726",
      },
      analysisCard: {
        backgroundColor: "#7986CB",
        shadowColor: "#7986CB",
      },
      planCardHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
      },
      planCardLabel: {
        fontSize: 11,
        color: "rgba(255,255,255,0.8)",
        fontWeight: "500",
        marginLeft: 6,
      },
      planCardBody: {
        flex: 1,
      },
      planCardTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "white",
        marginBottom: 8,
      },
      planCardSubtitle: {
        fontSize: 12,
        color: "rgba(255,255,255,0.9)",
        marginBottom: 4,
      },
      planCardDetail: {
        fontSize: 11,
        color: "rgba(255,255,255,0.8)",
      },
      planCardFooter: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 8,
      },
      aiIcon: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: "rgba(255,255,255,0.2)",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 6,
      },
      analysisIcon: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: "rgba(255,255,255,0.2)",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 6,
      },
      aiLabel: {
        fontSize: 10,
        color: "white",
        fontWeight: "500",
      },
      progressVisualization: {
        position: "absolute",
        bottom: 12,
        right: 16,
        left: 16,
      },
      progressBar: {
        height: 3,
        backgroundColor: "rgba(255,255,255,0.3)",
        borderRadius: 2,
      },
      progressFill: {
        height: 3,
        backgroundColor: "white",
        borderRadius: 2,
      },
      aiFeatures: {
        flexDirection: "row",
        justifyContent: "space-around",
        backgroundColor: "white",
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      featureItem: {
        alignItems: "center",
      },
      featureIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 8,
      },
      featureLabel: {
        fontSize: 11,
        color: "#6B7280",
        fontWeight: "500",
        textAlign: "center",
      },
      recentSection: {
        marginBottom: 20,
      },
      recentAnalysis: {
        backgroundColor: "white",
        borderRadius: 16,
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      recentPhotoPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 12,
        backgroundColor: "#F3F4F6",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
      },
      recentContent: {
        flex: 1,
      },
      recentTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "#1F2937",
        marginBottom: 2,
      },
      recentDate: {
        fontSize: 12,
        color: "#6B7280",
        marginBottom: 4,
      },
      recentAnalysisText: {
        fontSize: 12,
        color: "#9CA3AF",
        lineHeight: 16,
      },
      viewButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#F3F4F6",
        justifyContent: "center",
        alignItems: "center",
      },
      loadingOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
      },
      loadingCard: {
        backgroundColor: "white",
        borderRadius: 20,
        padding: 30,
        alignItems: "center",
        margin: 40,
      },
      loadingTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#000",
        marginTop: 16,
        marginBottom: 8,
      },
      loadingSubtext: {
        fontSize: 14,
        color: "#666",
      },
      // Modal Styles (light)
      modalContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
      },
      modalContent: {
        width: "80%",
        backgroundColor: "white",
        borderRadius: 10,
        padding: 20,
        alignItems: "center",
      },
      modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 10,
      },
      closeButton: {
        marginTop: 20,
        backgroundColor: "#2196F3",
        borderRadius: 20,
        padding: 10,
        elevation: 2,
      },
      closeButtonText: {
        color: "white",
        fontWeight: "bold",
        textAlign: "center",
      },
      notificationScrollView: {
        maxHeight: Dimensions.get("window").height * 0.5,
        width: "100%",
        paddingHorizontal: 10,
      },
      noNotificationsText: {
        textAlign: "center",
        color: "#6B7280",
        marginTop: 20,
      },
      notificationItem: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F9FAFB",
        borderRadius: 10,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "#E5E7EB",
      },
      unreadNotification: {
        backgroundColor: "#EEF2FF",
        borderColor: "#C7D2FE",
      },
      notificationTextContent: {
        flex: 1,
      },
      notificationMessage: {
        fontSize: 14,
        color: "#1F2937",
        fontWeight: "500",
      },
      notificationTimestamp: {
        fontSize: 10,
        color: "#9CA3AF",
        marginTop: 4,
      },
      markReadButton: {
        marginLeft: 10,
        padding: 5,
      },
      avatarText: {
        fontSize: 24,
        fontWeight: "bold",
        color: "white",
      },
    });
  }

  // DARK mode styles (theme-driven)
  return StyleSheet.create({
    // Welcome Screen Styles
    welcomeContainer: {
      flex: 1,
      backgroundColor: "white",
      paddingTop: 50,
    },
    skipButton: {
      position: "absolute",
      top: 60,
      right: 20,
      flexDirection: "row",
      alignItems: "center",
      zIndex: 10,
    },
    skipText: {
      fontSize: 16,
      color: "#666",
      marginRight: 4,
    },
    heroImageContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 40,
      paddingTop: 40,
    },
    heroImageBackground: {
      width: 280,
      height: 280,
      backgroundColor: "#a8e6cf",
      borderRadius: 40,
      justifyContent: "center",
      alignItems: "center",
      elevation: 10,
    },
    heroImageText: {
      fontSize: 18,
      fontWeight: "600",
      color: "#333",
      marginTop: 10,
    },
    welcomeContent: {
      paddingHorizontal: 30,
      paddingBottom: 50,
      alignItems: "center",
    },
    welcomeTitle: {
      fontSize: 32,
      fontWeight: "bold",
      color: "#000",
      textAlign: "center",
      lineHeight: 38,
      marginBottom: 16,
    },
    welcomeSubtitle: {
      fontSize: 16,
      color: "#666",
      textAlign: "center",
      lineHeight: 24,
      marginBottom: 40,
      paddingHorizontal: 10,
    },
    pageIndicators: {
      flexDirection: "row",
      marginBottom: 40,
    },
    indicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: "#e0e0e0",
      marginHorizontal: 4,
    },
    indicatorActive: {
      backgroundColor: "#a8e6cf",
      width: 24,
    },
    getStartedButton: {
      backgroundColor: "#a8e6cf",
      paddingVertical: 18,
      paddingHorizontal: 80,
      borderRadius: 30,
      width: "100%",
      alignItems: "center",
      elevation: 8,
    },
    getStartedText: {
      fontSize: 18,
      fontWeight: "bold",
      color: "#000",
    },

    // Main App Styles
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      backgroundColor: theme.colors.background,
      paddingRight: 55,
      paddingLeft: 15,
      paddingBottom: 16,
    },
    headerContent: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
  // No background here to avoid nested mismatch in dark mode; header provides background
    },
    userProfile: {
      flexDirection: "row",
      alignItems: "center",
    },
    greetingContainer: {
      marginLeft: 12,
    },
    greeting: {
      fontSize: 17,
      fontWeight: "600",
      color: theme.colors.text,
      marginBottom: 2,
    },
    date: {
      fontSize: 13,
      color: theme.colors.text,
    },
    notificationButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      position: "absolute",
      right: -25,
      top: 16,
      backgroundColor: theme.colors.card,
      borderRadius: 10,
      padding: 8,
      shadowColor: theme.colors.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
    notificationIcon: {
      color: isDarkMode ? theme.colors.text : theme.colors.primary,
      paddingRight: 3, // Reduced padding
    },
    notificationDot: {
      position: "absolute",
      top: 8,
      right: 8,
      width: 8,
      height: 8,
      borderRadius: 8,
      backgroundColor: theme.colors.notification,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 100,
    },
    challengeCard: {
      marginTop: 16,
      marginBottom: 20,
      borderRadius: 20,
      overflow: "hidden",
      elevation: 8,
      shadowColor: theme.colors.notification,
      shadowOffset: { width: 0, height: 4 },
    },
    challengeGradient: {
      padding: 20,
      height: 140,
      flexDirection: "row",
      justifyContent: "space-between",
      position: "relative",
    },
    challengeTitle: {
      fontSize: 24,
      fontWeight: "bold",
  color: theme.colors.text,
      lineHeight: 28,
      marginBottom: 4,
    },
    challengeSubtitle: {
      fontSize: 14,
  color: theme.colors.text,
      marginBottom: 16,
    },
    progressIndicators: {
      flexDirection: "row",
      gap: 20,
    },
    progressItem: {
      alignItems: "center",
    },
    progressNumber: {
      fontSize: 18,
      fontWeight: "bold",
      color: theme.colors.text,
    },
    progressLabel: {
      fontSize: 11,
      color: theme.colors.text,
    },
    calendarContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      backgroundColor: theme.colors.card,
      borderRadius: 16,
      padding: 12,
      marginBottom: 20,
      elevation: 2,
      shadowColor: theme.colors.border,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
    },
    dayButton: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 4,
      borderRadius: 12,
      alignItems: "center",
    },
    dayButtonActive: {
      backgroundColor: theme.colors.notification,
    },
    dayText: {
      fontSize: 11,
      color: theme.colors.text,
      fontWeight: "500",
      marginBottom: 6,
    },
    dayTextActive: {
      color: theme.colors.text,
    },
    photoIndicator: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.colors.border,
    },
    hasPhoto: {
      backgroundColor: theme.colors.notification,
    },
    todayPhoto: {
      backgroundColor: theme.colors.notification,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 22,
      fontWeight: "bold",
      color: theme.colors.text,
    },
    viewAllText: {
      fontSize: 14,
      color: theme.colors.notification,
      fontWeight: "500",
    },
    planGrid: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 20,
      gap: 12,
    },
    planCard: {
      width: (screenWidth - 52) / 2,
      height: 200,
      borderRadius: 20,
      padding: 16,
      position: "relative",
      elevation: 4,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    captureCard: {
      backgroundColor: theme.colors.notification,
      shadowColor: theme.colors.notification,
    },
    analysisCard: {
      backgroundColor: "#7C3AED",
      shadowColor: theme.colors.card,
    },
    planCardHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },
    planCardLabel: {
      fontSize: 11,
      color: theme.colors.text,
      fontWeight: "500",
      marginLeft: 6,
    },
    planCardBody: {
      flex: 1,
    },
    planCardTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: theme.colors.text,
      marginBottom: 8,
    },
    planCardSubtitle: {
      fontSize: 12,
      color: theme.colors.text,
      marginBottom: 4,
    },
    planCardDetail: {
      fontSize: 11,
      color: theme.colors.text,
    },
    planCardFooter: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 8,
    },
    aiIcon: {
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: theme.colors.border,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 6,
    },
    analysisIcon: {
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: theme.colors.border,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 6,
    },
    aiLabel: {
      fontSize: 10,
      color: theme.colors.text,
      fontWeight: "500",
    },
    progressVisualization: {
      position: "absolute",
      bottom: 12,
      right: 16,
      left: 16,
    },
    progressBar: {
      height: 3,
      backgroundColor: theme.colors.border,
      borderRadius: 2,
    },
    progressFill: {
      height: 3,
      backgroundColor: theme.colors.notification,
      borderRadius: 2,
    },
    aiFeatures: {
      flexDirection: "row",
      justifyContent: "space-around",
      backgroundColor: theme.colors.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 20,
      elevation: 2,
      shadowColor: theme.colors.border,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
    },
    featureItem: {
      alignItems: "center",
    },
    featureIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 8,
    },
    featureLabel: {
      fontSize: 11,
      color: theme.colors.text,
      fontWeight: "500",
      textAlign: "center",
    },
    recentSection: {
      marginBottom: 20,
    },
    recentAnalysis: {
      backgroundColor: theme.colors.card,
      borderRadius: 16,
      padding: 16,
      flexDirection: "row",
      alignItems: "center",
      elevation: 2,
      shadowColor: theme.colors.border,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
    },
    recentPhotoPlaceholder: {
      width: 50,
      height: 50,
      borderRadius: 12,
      backgroundColor: theme.colors.border,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    recentContent: {
      flex: 1,
    },
    recentTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.text,
      marginBottom: 2,
    },
    recentDate: {
      fontSize: 12,
      color: theme.colors.text,
      marginBottom: 4,
    },
    recentAnalysisText: {
      fontSize: 12,
      color: theme.colors.text,
      lineHeight: 16,
    },
    viewButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.card,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    loadingCard: {
      backgroundColor: theme.colors.card,
      borderRadius: 20,
      padding: 30,
      alignItems: "center",
      margin: 40,
    },
    loadingTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: theme.colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    loadingSubtext: {
      fontSize: 14,
      color: theme.colors.text,
    },
    challengeContent: {
      flex: 1,
      zIndex: 2,
    },
    challengeDecorations: {
      position: "absolute",
      right: 0,
      top: 0,
      bottom: 0,
      width: 120,
      zIndex: 1,
    },
    sphere: {
      position: "absolute",
      borderRadius: 50,
      justifyContent: "center",
      alignItems: "center",
    },
    aiSphere: {
      width: 45,
      height: 45,
      backgroundColor: theme.colors.notification,
      top: 15,
      right: 20,
      shadowColor: theme.colors.notification,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 4,
    },
    cameraSphere: {
      width: 35,
      height: 35,
      backgroundColor: "#FFA726",
      top: 40,
      right: 45,
      shadowColor: "#FFA726",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 4,
    },
    analysisSphere: {
      width: 40,
      height: 40,
      backgroundColor: "#42A5F5",
      bottom: 15,
      right: 30,
      shadowColor: "#42A5F5",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 4,
    },
    // Modal Styles
    modalContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modalContent: {
      width: "90%",
      backgroundColor: theme.colors.card,
      borderRadius: 10,
      padding: 20,
      alignItems: "center",
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: theme.colors.text,
      marginBottom: 10,
    },
    notificationScrollView: {
      width: "100%",
      marginVertical: 10,
    },
    noNotificationsText: {
      fontSize: 14,
      color: theme.colors.text,
      textAlign: "center",
    },
    notificationItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 10,
      backgroundColor: theme.colors.background,
      borderRadius: 5,
      marginBottom: 5,
    },
    unreadNotification: {
      backgroundColor: theme.colors.notification,
    },
    notificationTextContent: {
      flex: 1,
    },
    notificationMessage: {
      fontSize: 14,
      color: theme.colors.text,
    },
    notificationTimestamp: {
      fontSize: 12,
      color: theme.colors.border,
    },
    markReadButton: {
      padding: 5,
    },
    closeButton: {
      marginTop: 10,
      padding: 10,
      backgroundColor: theme.colors.notification,
      borderRadius: 5,
    },
    closeButtonText: {
      fontSize: 14,
      color: "white",
      textAlign: "center",
    },
    profileImageContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.card,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: theme.colors.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
    avatarText: {
      fontSize: 18,
      fontWeight: "bold",
      color: theme.colors.text,
    },
  });
}