import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";
import Layout from "@/components/Layout";

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function PhotoProgressApp() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [userProgress, setUserProgress] = useState({
    weekStreak: 0,
    totalPhotos: 0,
    daysTracked: 0,
    photosThisWeek: 0,
    lastPhotoDate: null as string | null,
    needsPhotoToday: false,
  });

  const [photoHistory, setPhotoHistory] = useState({
    thisWeek: null as string | null,
    lastWeek: null as string | null,
    allPhotos: [] as any[],
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchUserProgress();
    fetchPhotoHistory();
  }, []);

  const fetchUserProgress = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/user/progress", {
        headers: {
          Authorization: "Bearer YOUR_API_TOKEN",
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUserProgress({
          weekStreak: data.weekStreak || 0,
          totalPhotos: data.totalPhotos || 0,
          daysTracked: data.daysTracked || 0,
          photosThisWeek: data.photosThisWeek || 0,
          lastPhotoDate: data.lastPhotoDate || null,
          needsPhotoToday: data.needsPhotoToday || false,
        });
      } else {
        setUserProgress({
          weekStreak: 0,
          totalPhotos: 0,
          daysTracked: 0,
          photosThisWeek: 0,
          lastPhotoDate: null,
          needsPhotoToday: true,
        });
      }
    } catch (err) {
      console.error("Error fetching user progress:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPhotoHistory = async () => {
    try {
      const response = await fetch("/api/user/photos", {
        headers: {
          Authorization: "Bearer YOUR_API_TOKEN",
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        setPhotoHistory({
          thisWeek: data.thisWeek || null,
          lastWeek: data.lastWeek || null,
          allPhotos: data.allPhotos || [],
        });
      }
    } catch (err) {
      console.error("Error fetching photo history:", err);
    }
  };

  const updateProgressAfterPhoto = (newPhotoData: any) => {
    setUserProgress((prev) => ({
      ...prev,
      totalPhotos: prev.totalPhotos + 1,
      photosThisWeek: prev.photosThisWeek + 1,
      lastPhotoDate: new Date().toISOString(),
      needsPhotoToday: false,
      weekStreak: newPhotoData.weekStreak || prev.weekStreak,
    }));
    setPhotoHistory((prev) => ({
      ...prev,
      thisWeek: newPhotoData.photoUrl,
      allPhotos: [newPhotoData, ...prev.allPhotos],
    }));
  };

  const sendToAPI = async (photo: any) => {
    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append("image", {
        uri: photo.uri,
        name: "progress-photo.jpg",
        type: "image/jpeg",
      } as any);
      formData.append("userId", "john_123");
      formData.append("timestamp", new Date().toISOString());
      formData.append("weekNumber", String(getWeekNumber(new Date())));
      const apiResponse = await fetch("/api/photos/upload", {
        method: "POST",
        headers: {
          Authorization: "Bearer YOUR_API_TOKEN",
        },
        body: formData,
      });
      if (apiResponse.ok) {
        const result = await apiResponse.json();
        updateProgressAfterPhoto({
          id: result.photoId,
          photoUrl: result.photoUrl,
          date: result.date,
          weekStreak: result.updatedWeekStreak,
          week: result.weekNumber,
        });
        alert("Photo uploaded successfully! Keep up the great progress.");
      } else {
        throw new Error("API request failed");
      }
    } catch (err) {
      console.error("Error uploading photo:", err);
      alert("Error uploading photo. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getWeekNumber = (date: Date) => {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDays = (date.getTime() - startOfYear.getTime()) / 86400000;
    return Math.ceil((pastDays + startOfYear.getDay() + 1) / 7);
  };

  const handleCameraClick = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      alert("Camera permission not granted");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      await sendToAPI(result.assets[0]);
    }
  };

  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-US", {
      weekday: "long",
      day: "numeric",
      month: "short",
    });

  const todayIndex = currentDate.getDay();
  const baseDay = 22;

  return (
    <Layout paddingHorizontal={24} paddingVertical={24}>
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading your progress...</Text>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Status Bar */}
        <View style={styles.statusBar}>
          <Text style={styles.statusText}>9:41</Text>
          <View style={styles.statusIcons}>
            <Text style={styles.statusDots}>••••</Text>
            <Text style={styles.statusText}>📶</Text>
            <Text style={styles.statusText}>🔋</Text>
          </View>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.profile}>
            <Image
              source={{
                uri: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Ccircle cx='24' cy='24' r='24' fill='%23E5E7EB'/%3E%3Ctext x='24' y='30' text-anchor='middle' fill='%236B7280' font-family='Arial, sans-serif' font-size='16' font-weight='bold'%3EJ%3C/text%3E%3C/svg%3E",
              }}
              style={styles.avatar}
            />
            <View style={styles.profileText}>
              <Text style={styles.greeting}>Hello, John</Text>
              <Text style={styles.date}>{formatDate(currentDate)}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.searchButton}>
            <Feather name="search" size={20} color="#4B5563" />
          </TouchableOpacity>
        </View>

        {/* Daily Challenge Card */}
        <View style={styles.challengeCard}>
          <Text style={styles.challengeTitle}>CaptureFit challenge</Text>
          <Text style={styles.challengeSubtitle}>
            Track your visual progress journey
          </Text>
        </View>

        {/* Week Calendar */}
        <View style={styles.weekRow}>
          {weekDays.map((day, i) => (
            <View key={day} style={styles.dayItem}>
              <Text style={styles.dayLabel}>{day}</Text>
              <View
                style={[
                  styles.dayCircle,
                  i === todayIndex && styles.dayCircleToday,
                ]}
              >
                <Text
                  style={[
                    styles.dayNumber,
                    i === todayIndex && styles.dayNumberToday,
                  ]}
                >
                  {baseDay + i}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Your Progress Section */}
        <Text style={styles.sectionHeader}>Your progress</Text>
        <View style={styles.progressRow}>
          <View style={[styles.progressCard, { marginRight: 12 }]}>
            <Feather name="camera" size={24} color="#9A3412" />
            <Text style={styles.progressTitle}>CaptureFit Analysis</Text>
            <Text style={styles.progressText}>Visual progress tracking</Text>
          </View>
          <View style={styles.progressCard}>
            <Feather name="trending-up" size={24} color="#1E3A8A" />
            <Text style={styles.progressTitle}>Progress Stats</Text>
            <Text style={styles.progressText}>
              {userProgress.weekStreak} week streak
            </Text>
          </View>
        </View>

        {/* Today's Metrics */}
        <Text style={styles.sectionHeader}>This Week&apos;s Progress</Text>
        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricEmoji}>📸</Text>
            <Text style={styles.metricValue}>
              {userProgress.photosThisWeek}
            </Text>
            <Text style={styles.metricLabel}>Photos taken</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricEmoji}>🔥</Text>
            <Text style={styles.metricValue}>{userProgress.weekStreak}</Text>
            <Text style={styles.metricLabel}>Week streak</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricEmoji}>📅</Text>
            <Text style={styles.metricValue}>{userProgress.daysTracked}</Text>
            <Text style={styles.metricLabel}>Days tracked</Text>
          </View>
        </View>

        {/* Photo Comparison Section */}
        <Text style={styles.sectionHeader}>Visual Comparison</Text>
        <View style={styles.comparisonRow}>
          <View style={styles.compareBox}>
            {photoHistory.lastWeek ? (
              <Image
                source={{ uri: photoHistory.lastWeek }}
                style={styles.compareImage}
              />
            ) : (
              <>
                <Feather name="calendar" size={32} color="#9CA3AF" />
                <Text style={styles.compareLabel}>Last week</Text>
              </>
            )}
          </View>
          <View style={styles.compareSpacer} />
          <TouchableOpacity
            style={[styles.compareBox, styles.dashedBox]}
            onPress={handleCameraClick}
          >
            {photoHistory.thisWeek ? (
              <Image
                source={{ uri: photoHistory.thisWeek }}
                style={styles.compareImage}
              />
            ) : (
              <>
                <Feather name="plus" size={32} color="#9CA3AF" />
                <Text style={styles.compareLabel}>This week</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleCameraClick}
          style={styles.captureButton}
          disabled={isAnalyzing}
        >
          <Feather name="camera" size={20} color="#FFFFFF" />
          <Text style={styles.captureText}>
            {isAnalyzing ? "Analyzing..." : "Capture with CaptureFit"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </Layout>
  );
}

const styles = StyleSheet.create({
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 40,
  },
  loadingText: {
    marginTop: 8,
    color: "#4B5563",
    fontWeight: "500",
  },
  statusBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statusText: {
    fontSize: 14,
    color: "#111827",
  },
  statusIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDots: {
    fontSize: 10,
    color: "#111827",
    marginRight: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  profile: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  profileText: {
    justifyContent: "center",
  },
  greeting: {
    color: "#4B5563",
    fontSize: 14,
  },
  date: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "500",
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    elevation: 1,
  },
  challengeCard: {
    backgroundColor: "#60A5FA",
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
  },
  challengeTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
  },
  challengeSubtitle: {
    color: "#DBEAFE",
    fontSize: 14,
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  dayItem: {
    alignItems: "center",
  },
  dayLabel: {
    color: "#6B7280",
    fontSize: 12,
    marginBottom: 4,
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  dayCircleToday: {
    backgroundColor: "#111827",
    borderColor: "#111827",
  },
  dayNumber: {
    color: "#4B5563",
  },
  dayNumberToday: {
    color: "#FFFFFF",
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
  },
  progressRow: {
    flexDirection: "row",
    marginBottom: 24,
  },
  progressCard: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 24,
    padding: 16,
  },
  progressTitle: {
    marginTop: 8,
    fontWeight: "600",
    color: "#111827",
  },
  progressText: {
    color: "#6B7280",
    fontSize: 12,
    marginTop: 4,
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  metricItem: {
    flex: 1,
    alignItems: "center",
  },
  metricEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  metricLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  comparisonRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  compareBox: {
    flex: 1,
    height: 200,
    borderRadius: 16,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
  },
  compareImage: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
  },
  dashedBox: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#E5E7EB",
  },
  compareSpacer: {
    width: 16,
  },
  compareLabel: {
    color: "#6B7280",
    marginTop: 8,
  },
  captureButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111827",
    borderRadius: 16,
    paddingVertical: 12,
  },
  captureText: {
    color: "#FFFFFF",
    fontWeight: "500",
    marginLeft: 8,
  },
});
