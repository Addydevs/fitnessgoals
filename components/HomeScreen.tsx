import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Camera } from "expo-camera";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width: screenWidth } = Dimensions.get("window");
const OPENAI_API_KEY = "your-api-key-here"; // Replace with your actual key

// Helper Functions for Data Tracking
const getCurrentStreak = (photos: any[]): number => {
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

const getPhotosThisWeek = (photos: any[]): number => {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  return photos.filter((photo) => {
    const photoDate = new Date(photo.timestamp);
    return photoDate >= weekAgo;
  }).length;
};

const hasPhotoOnDate = (photos: any[], targetDate: Date): boolean => {
  return photos.some((photo) => {
    const photoDate = new Date(photo.timestamp);
    return photoDate.toDateString() === targetDate.toDateString();
  });
};

const saveUserStats = async (photos: any[]): Promise<any> => {
  const stats = {
    totalPhotos: photos.length,
    lastPhotoDate:
      photos.length > 0 ? photos[photos.length - 1].timestamp : null,
    startDate:
      photos.length > 0
        ? photos[0].timestamp
        : new Date().toISOString(),
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

const loadUserStats = async (): Promise<any> => {
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

const extractProgressScore = (analysis: string | null): number | null => {
  if (!analysis) return null;

  const positiveWords = [
    "improvement",
    "progress",
    "better",
    "stronger",
    "leaner",
    "definition",
  ];
  const negativeWords = ["decline", "loss", "worse", "weaker"];

  let score = 0.5;
  const lowerAnalysis = analysis.toLowerCase();

  positiveWords.forEach((word) => {
    if (lowerAnalysis.includes(word)) score += 0.1;
  });

  negativeWords.forEach((word) => {
    if (lowerAnalysis.includes(word)) score -= 0.1;
  });

  return Math.max(0, Math.min(1, score));
};

// Main Component
interface HomeScreenProps {
  photos: any[];
  setPhotos: (photos: any[]) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  navigation?: any;
}

export default function HomeScreen({
  photos,
  setPhotos,
  loading,
  setLoading,
  navigation,
}: HomeScreenProps) {
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [showWelcome, setShowWelcome] = useState<boolean>(true);
  const [currentDate] = useState<Date>(new Date());
  const [userStats, setUserStats] = useState<{
    totalPhotos: number;
    currentStreak: number;
    photosThisWeek: number;
    lastPhotoDate: string | null;
  }>({
    totalPhotos: 0,
    currentStreak: 0,
    photosThisWeek: 0,
    lastPhotoDate: null,
  });

  useEffect(() => {
    getCameraPermission();
    checkWelcomeStatus();
    loadUserStatsData();
  }, []);

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
    const { status } = await Camera.requestCameraPermissionsAsync();
    setCameraPermission(status === "granted");
  };

  const takePhoto = async (): Promise<void> => {
    if (!cameraPermission) {
      Alert.alert("Camera permission required");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled) {
      await processNewPhoto(result.assets[0]);
    }
  };

  const processNewPhoto = async (photo: any): Promise<void> => {
    setLoading(true);
    try {
      const fileName = `progress_photo_${Date.now()}.jpg`;
      const permanentUri = FileSystem.documentDirectory + fileName;

      await FileSystem.copyAsync({
        from: photo.uri,
        to: permanentUri,
      });

      const newPhoto: any = {
        id: Date.now().toString(),
        uri: permanentUri,
        timestamp: new Date().toISOString(),
        analysis: null as string | null,
        analyzed: false,
        progressScore: null as number | null,
      };

      const previousPhoto = photos.length > 0 ? photos[photos.length - 1] : null;

      if (previousPhoto) {
        const analysis = await getAIAnalysis(previousPhoto.uri, permanentUri);
        newPhoto.analysis = analysis;
        newPhoto.analyzed = true;
        newPhoto.progressScore = extractProgressScore(analysis);
      } else {
        newPhoto.analysis =
          "Great start! This is your first progress photo. Keep going!";
        newPhoto.analyzed = true;
        newPhoto.progressScore = 0.5;
      }

      const updatedPhotos = [...photos, newPhoto];
      await savePhotos(updatedPhotos);
      await saveUserStats(updatedPhotos);
      setPhotos(updatedPhotos);

      Alert.alert(
        "Photo Saved!",
        `Analysis complete! You now have ${updatedPhotos.length} progress photos.`,
        [{
          text: "View Analysis",
          onPress: () => navigation?.navigate("Progress"),
        }],
      );
    } catch (error) {
      console.error("Error processing photo:", error);
      Alert.alert("Error", "Failed to save photo. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getAIAnalysis = async (
    previousPhotoUri: string,
    currentPhotoUri: string,
  ): Promise<string> => {
    try {
      const userGoal = (await AsyncStorage.getItem("fitnessGoal")) || "";
      const previousBase64 = await uriToBase64(previousPhotoUri);
      const currentBase64 = await uriToBase64(currentPhotoUri);

      let goalContext = "";
      if (userGoal) {
        goalContext = `The user's fitness goal is: "${userGoal}". `;
      }

      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: `${goalContext}Compare these progress photos and provide encouraging feedback. Focus on specific changes you notice and provide motivation.`,
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: `data:image/jpeg;base64,${previousBase64}`,
                    },
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: `data:image/jpeg;base64,${currentBase64}`,
                    },
                  },
                ],
              },
            ],
            max_tokens: 200,
          }),
        },
      );

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error("AI Analysis Error:", error);
      return "Progress photo saved! Keep up the great work!";
    }
  };

  const uriToBase64 = async (uri: string): Promise<string | null> => {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64;
    } catch (error) {
      console.error("Error converting to base64:", error);
      return null;
    }
  };

  const savePhotos = async (newPhotos: any[]): Promise<void> => {
    try {
      await AsyncStorage.setItem("progressPhotos", JSON.stringify(newPhotos));
    } catch (error) {
      console.error("Error saving photos:", error);
    }
  };

  const generateWeekDays = (): any[] => {
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

  // Welcome Screen
  if (showWelcome) {
    return (
      <View style={styles.welcomeContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="white" />
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleGetStarted}
        >
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
          <Text style={styles.welcomeTitle}>
            Track Your Fitness{"\n"}Journey with AI
          </Text>
          <Text style={styles.welcomeSubtitle}>
            Capture progress photos and get AI-powered insights to achieve your
            fitness goals faster.
          </Text>
          <View style={styles.pageIndicators}>
            <View style={[styles.indicator, styles.indicatorActive]} />
            <View style={styles.indicator} />
            <View style={styles.indicator} />
            <View style={styles.indicator} />
          </View>
          <TouchableOpacity
            style={styles.getStartedButton}
            onPress={handleGetStarted}
            activeOpacity={0.9}
          >
            <Text style={styles.getStartedText}>Start Tracking</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Main Home Screen
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.userProfile}>
            <View style={styles.profileImageContainer}>
              <Feather name="user" size={24} color="#FF6B35" />
            </View>
            <View style={styles.greetingContainer}>
              <Text style={styles.greeting}>CaptureFit Progress</Text>
              <Text style={styles.date}>
                Today{" "}
                {currentDate.toLocaleDateString("en-US", {
                  day: "numeric",
                  month: "short",
                })}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Feather name="bell" size={18} color="#1F2937" />
            {userStats.photosThisWeek > 0 && (
              <View style={styles.notificationDot} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
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
                  <Text style={styles.progressNumber}>
                    {userStats.totalPhotos}
                  </Text>
                  <Text style={styles.progressLabel}>Photos</Text>
                </View>
                <View style={styles.progressItem}>
                  <Text style={styles.progressNumber}>
                    {userStats.currentStreak}
                  </Text>
                  <Text style={styles.progressLabel}>Day Streak</Text>
                </View>
              </View>
            </View>

            {/* 3D Spheres with Icons */}
            <View style={styles.challengeDecorations}>
              <View style={[styles.sphere, styles.aiSphere]}>
                <MaterialCommunityIcons
                  name="brain"
                  size={20}
                  color="white"
                />
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
              style={[
                styles.dayButton,
                dayInfo.isToday && styles.dayButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.dayText,
                  dayInfo.isToday && styles.dayTextActive,
                ]}
              >
                {dayInfo.day}
              </Text>
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
          <TouchableOpacity
            style={[styles.planCard, styles.captureCard]}
            onPress={takePhoto}
          >
            <View style={styles.planCardHeader}>
              <Feather name="camera" size={20} color="white" />
              <Text style={styles.planCardLabel}>Capture</Text>
            </View>
            <View style={styles.planCardBody}>
              <Text style={styles.planCardTitle}>Progress{"\n"}Photo</Text>
              <Text style={styles.planCardSubtitle}>
                {userStats.totalPhotos === 0
                  ? "Start your journey"
                  : "Continue tracking"}
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
          <TouchableOpacity
            style={[styles.planCard, styles.analysisCard]}
            onPress={() => navigation?.navigate("Progress")}
          >
            <View style={styles.planCardHeader}>
              <Feather name="trending-up" size={20} color="white" />
              <Text style={styles.planCardLabel}>Analysis</Text>
            </View>
            <View style={styles.planCardBody}>
              <Text style={styles.planCardTitle}>Progress{"\n"}Report</Text>
              <Text style={styles.planCardSubtitle}>
                {userStats.totalPhotos === 0
                  ? "No data yet"
                  : `${userStats.totalPhotos} photos analyzed`}
              </Text>
              <Text style={styles.planCardDetail}>AI insights & trends</Text>
            </View>
            <View style={styles.planCardFooter}>
              <View style={styles.analysisIcon}>
                <Feather name="bar-chart-2" size={12} color="#7986CB" />
              </View>
              <Text style={styles.aiLabel}>
                {userStats.totalPhotos === 0 ? "Waiting" : "View Report"}
              </Text>
            </View>

            {userStats.totalPhotos > 0 && (
              <View style={styles.progressVisualization}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(
                          userStats.totalPhotos * 10,
                          100,
                        )}%`,
                      },
                    ]}
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
              <TouchableOpacity
                onPress={() => navigation?.navigate("Progress")}
              >
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
                  {new Date(
                    photos[photos.length - 1].timestamp,
                  ).toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "short",
                  })}
                </Text>
                <Text style={styles.recentAnalysisText} numberOfLines={2}>
                  {photos[photos.length - 1].analysis || "Analysis complete!"}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.viewButton}
                onPress={() => navigation?.navigate("Progress")}
              >
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
            <Text style={styles.loadingSubtext}>
              AI is working its magic...
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = {
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
    backgroundColor: "#FAFAFA",
  },
  header: {
    backgroundColor: "white",
    paddingTop: 44,
    paddingHorizontal: 20,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
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
};

