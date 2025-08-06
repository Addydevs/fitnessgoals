import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Camera } from "expo-camera";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width: screenWidth } = Dimensions.get("window");
const OPENAI_API_KEY = "your-api-key-here"; // Replace with your actual key

// Modern Fitness Home Screen Component
export default function CameraScreen({
  photos,
  setPhotos,
  loading,
  setLoading,
}) {
  const [cameraPermission, setCameraPermission] = useState(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [currentDate] = useState(new Date());

  useEffect(() => {
    getCameraPermission();
    checkWelcomeStatus();
  }, []);

  const checkWelcomeStatus = async () => {
    try {
      const hasSeenWelcome = await AsyncStorage.getItem("hasSeenWelcome");
      if (hasSeenWelcome === "true") {
        setShowWelcome(false);
      }
    } catch (error) {
      console.error("Error checking welcome status:", error);
    }
  };

  const handleGetStarted = async () => {
    try {
      await AsyncStorage.setItem("hasSeenWelcome", "true");
      setShowWelcome(false);
    } catch (error) {
      console.error("Error saving welcome status:", error);
    }
  };

  const getCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setCameraPermission(status === "granted");
  };

  const takePhoto = async () => {
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

  const processNewPhoto = async (photo) => {
    setLoading(true);
    try {
      const fileName = `progress_photo_${Date.now()}.jpg`;
      const permanentUri = FileSystem.documentDirectory + fileName;

      await FileSystem.copyAsync({
        from: photo.uri,
        to: permanentUri,
      });

      const newPhoto = {
        id: Date.now().toString(),
        uri: permanentUri,
        timestamp: new Date().toISOString(),
        analysis: null,
      };

      const previousPhoto =
        photos.length > 0 ? photos[photos.length - 1] : null;

      if (previousPhoto) {
        const analysis = await getAIAnalysis(previousPhoto.uri, permanentUri);
        newPhoto.analysis = analysis;
      } else {
        newPhoto.analysis =
          "Great start! This is your first progress photo. Keep going!";
      }

      const updatedPhotos = [...photos, newPhoto];
      await savePhotos(updatedPhotos);
      setPhotos(updatedPhotos);
    } catch (error) {
      console.error("Error processing photo:", error);
      Alert.alert("Error", "Failed to save photo. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getAIAnalysis = async (previousPhotoUri, currentPhotoUri) => {
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
                    text: `${goalContext}Compare these progress photos and provide encouraging feedback.`,
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

  const uriToBase64 = async (uri) => {
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

  const savePhotos = async (newPhotos) => {
    try {
      await AsyncStorage.setItem("progressPhotos", JSON.stringify(newPhotos));
    } catch (error) {
      console.error("Error saving photos:", error);
    }
  };

  // Generate week days for calendar
  const generateWeekDays = () => {
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
      };
    });
  };

  const weekDays = generateWeekDays();

  // Welcome Screen (keeping your existing one)
  if (showWelcome) {
    return (
      <View style={styles.welcomeContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="white" />
        <TouchableOpacity style={styles.skipButton} onPress={handleGetStarted}>
          <Text style={styles.skipText}>Skip</Text>
          <Text style={styles.skipArrow}>›</Text>
        </TouchableOpacity>
        <View style={styles.heroImageContainer}>
          <View style={styles.heroImageBackground}>
            <Feather name="activity" size={80} color="#000" />
            <Text style={styles.heroImageText}>Progress Tracking</Text>
          </View>
        </View>
        <View style={styles.welcomeContent}>
          <Text style={styles.welcomeTitle}>
            Track Your Fitness{"\n"}Journey
          </Text>
          <Text style={styles.welcomeSubtitle}>
            Capture progress photos and get AI-powered insights to achieve your
            fitness goals.
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
            <Text style={styles.getStartedText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Main Home Screen (Dribbble Style)
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.userProfile}>
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
              }}
              style={styles.profileImage}
            />
            <View style={styles.greetingContainer}>
              <Text style={styles.greeting}>Hello, User</Text>
              <Text style={styles.date}>
                Today{" "}
                {currentDate.toLocaleDateString("en-US", {
                  day: "numeric",
                  month: "short",
                })}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.searchButton}>
            <Feather name="search" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Daily Challenge Card */}
        <View style={styles.challengeCard}>
          <LinearGradient
            colors={["#8B5FBF", "#6A4C93"]}
            style={styles.challengeGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.challengeContent}>
              <Text style={styles.challengeTitle}>Daily{"\n"}challenge</Text>
              <Text style={styles.challengeSubtitle}>
                Do your plan before 09:00 AM
              </Text>

              <View style={styles.challengeAvatars}>
                <View style={styles.avatarGroup}>
                  <Image
                    source={{
                      uri: "https://images.unsplash.com/photo-1494790108755-2616b5c3f95c?w=50&h=50&fit=crop",
                    }}
                    style={[styles.avatar, { zIndex: 3 }]}
                  />
                  <Image
                    source={{
                      uri: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop",
                    }}
                    style={[styles.avatar, { marginLeft: -10, zIndex: 2 }]}
                  />
                  <Image
                    source={{
                      uri: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop",
                    }}
                    style={[styles.avatar, { marginLeft: -10, zIndex: 1 }]}
                  />
                  <View
                    style={[
                      styles.avatar,
                      styles.moreAvatar,
                      { marginLeft: -10 },
                    ]}
                  >
                    <Text style={styles.moreAvatarText}>+</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.challengeDecorations}>
              <View style={styles.dumbbell} />
              <View style={styles.kettlebell} />
            </View>
          </LinearGradient>
        </View>

        {/* Week Calendar */}
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
              <Text
                style={[
                  styles.dateText,
                  dayInfo.isToday && styles.dateTextActive,
                ]}
              >
                {dayInfo.date}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Your Plan Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your plan</Text>
        </View>

        <View style={styles.planGrid}>
          {/* Progress Photos Card */}
          <TouchableOpacity
            style={[styles.planCard, styles.progressCard]}
            onPress={takePhoto}
          >
            <LinearGradient
              colors={["#FF9A56", "#FF6B35"]}
              style={styles.planCardGradient}
            >
              <View style={styles.planCardContent}>
                <Text style={styles.planCardTitle}>Progress{"\n"}Photos</Text>
                <Text style={styles.planCardDate}>
                  {new Date().toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "short",
                  })}
                </Text>
                <Text style={styles.planCardTime}>Take Photo</Text>
                <Text style={styles.planCardLocation}>AI Analysis</Text>

                <View style={styles.planCardTrainer}>
                  <Feather name="camera" size={16} color="#FF9A56" />
                  <Text style={styles.trainerName}>AI Coach</Text>
                </View>
              </View>

              <View style={styles.planCardIcon}>
                <Feather
                  name="camera"
                  size={24}
                  color="rgba(255,255,255,0.8)"
                />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* View Progress Card */}
          <TouchableOpacity style={[styles.planCard, styles.balanceCard]}>
            <LinearGradient
              colors={["#A8E6CF", "#7FCDCD"]}
              style={styles.planCardGradient}
            >
              <View style={styles.planCardContent}>
                <Text style={styles.planCardTitle}>View{"\n"}Progress</Text>
                <Text style={styles.planCardDate}>
                  {new Date().toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "short",
                  })}
                </Text>
                <Text style={styles.planCardTime}>{photos.length} photos</Text>
                <Text style={styles.planCardLocation}>Gallery</Text>

                <View style={styles.planCardTrainer}>
                  <Feather name="trending-up" size={16} color="#A8E6CF" />
                  <Text style={styles.trainerName}>Progress</Text>
                </View>
              </View>

              <View style={styles.planCardIcon}>
                <Feather
                  name="bar-chart-2"
                  size={24}
                  color="rgba(255,255,255,0.8)"
                />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Recent Progress */}
        {photos.length > 0 && (
          <View style={styles.recentSection}>
            <Text style={styles.sectionTitle}>Recent Progress</Text>
            <View style={styles.recentPhotoCard}>
              <Image
                source={{ uri: photos[photos.length - 1].uri }}
                style={styles.recentPhotoImage}
              />
              <View style={styles.recentPhotoContent}>
                <Text style={styles.recentPhotoTitle}>
                  Latest Progress Photo
                </Text>
                <Text style={styles.recentPhotoDate}>
                  {new Date(
                    photos[photos.length - 1].timestamp,
                  ).toLocaleDateString()}
                </Text>
                {photos[photos.length - 1].analysis && (
                  <Text style={styles.recentPhotoAnalysis} numberOfLines={2}>
                    {photos[photos.length - 1].analysis}
                  </Text>
                )}
              </View>
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
            <Text style={styles.loadingSubtext}>AI is working...</Text>
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
  skipArrow: {
    fontSize: 18,
    color: "#666",
    fontWeight: "bold",
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
    boxShadow: "0px 10px 20px rgba(0,0,0,0.1)",
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
    boxShadow: "0px 4px 8px rgba(168,230,207,0.3)",
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
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
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
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  date: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  challengeCard: {
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 20,
    overflow: "hidden",
    boxShadow: "0px 8px 20px rgba(139,95,191,0.3)",
    elevation: 10,
  },
  challengeGradient: {
    padding: 20,
    minHeight: 140,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  challengeContent: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    lineHeight: 28,
  },
  challengeSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginTop: 8,
    marginBottom: 16,
  },
  challengeAvatars: {
    marginTop: "auto",
  },
  avatarGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "white",
  },
  moreAvatar: {
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  moreAvatarText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  challengeDecorations: {
    position: "absolute",
    right: 20,
    top: 20,
  },
  dumbbell: {
    width: 40,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    marginBottom: 10,
  },
  kettlebell: {
    width: 35,
    height: 35,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 17,
  },
  calendarContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "white",
    borderRadius: 15,
    padding: 8,
    marginBottom: 20,
    boxShadow: "0px 2px 10px rgba(0,0,0,0.05)",
    elevation: 3,
  },
  dayButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignItems: "center",
  },
  dayButtonActive: {
    backgroundColor: "#000",
  },
  dayText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  dayTextActive: {
    color: "white",
  },
  dateText: {
    fontSize: 16,
    color: "#000",
    fontWeight: "600",
    marginTop: 4,
  },
  dateTextActive: {
    color: "white",
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
  planGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  planCard: {
    width: (screenWidth - 50) / 2,
    height: 180,
    borderRadius: 20,
    overflow: "hidden",
    boxShadow: "0px 8px 20px rgba(0,0,0,0.15)",
    elevation: 8,
  },
  planCardGradient: {
    flex: 1,
    padding: 16,
    justifyContent: "space-between",
  },
  planCardContent: {
    flex: 1,
  },
  planCardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    lineHeight: 22,
    marginBottom: 8,
  },
  planCardDate: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 2,
  },
  planCardTime: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "600",
    marginBottom: 2,
  },
  planCardLocation: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 12,
  },
  planCardTrainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  trainerName: {
    fontSize: 12,
    color: "white",
    marginLeft: 4,
    fontWeight: "500",
  },
  planCardIcon: {
    position: "absolute",
    top: 16,
    right: 16,
  },
  recentSection: {
    marginBottom: 30,
  },
  recentPhotoCard: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    boxShadow: "0px 2px 10px rgba(0,0,0,0.05)",
    elevation: 3,
  },
  recentPhotoImage: {
    width: 60,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  recentPhotoContent: {
    flex: 1,
  },
  recentPhotoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  recentPhotoDate: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  recentPhotoAnalysis: {
    fontSize: 12,
    color: "#999",
    lineHeight: 16,
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
