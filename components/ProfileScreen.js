import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  StyleSheet,
  Switch,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Layout, ModernHeader, ModernCard, SectionHeader } from "./Layout";

export default function ProfileScreen({ photos }) {
  const [goal, setGoal] = useState("");
  const [userName, setUserName] = useState("Sandra Glam");
  const [userLocation, setUserLocation] = useState("Denmark, Copenhagen");
  const [startWeight, setStartWeight] = useState("53.3");
  const [goalWeight, setGoalWeight] = useState("50.0");
  const [dailyCalories, setDailyCalories] = useState("740");
  const [followers] = useState(72);
  const [following] = useState(162);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const savedGoal = await AsyncStorage.getItem("fitnessGoal");
      const savedUserName = await AsyncStorage.getItem("userName");
      const savedStartWeight = await AsyncStorage.getItem("startWeight");
      const savedGoalWeight = await AsyncStorage.getItem("goalWeight");

      if (savedGoal) setGoal(savedGoal);
      if (savedUserName) setUserName(savedUserName);
      if (savedStartWeight) setStartWeight(savedStartWeight);
      if (savedGoalWeight) setGoalWeight(savedGoalWeight);
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const saveUserData = async () => {
    try {
      await AsyncStorage.setItem("fitnessGoal", goal);
      await AsyncStorage.setItem("userName", userName);
      await AsyncStorage.setItem("startWeight", startWeight);
      await AsyncStorage.setItem("goalWeight", goalWeight);

      setIsEditingProfile(false);
      Alert.alert(
        "✅ Profile Updated!",
        "Your changes have been saved successfully.",
      );
    } catch (error) {
      console.error("Error saving user data:", error);
      Alert.alert("Error", "Failed to save profile changes.");
    }
  };

  const getJourneyStats = () => {
    if (photos.length === 0) return { days: 0, thisMonth: 0 };

    const firstPhoto = new Date(photos[0].timestamp);
    const now = new Date();
    const days = Math.ceil((now - firstPhoto) / (1000 * 60 * 60 * 24));

    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const thisMonth = photos.filter(
      (photo) => new Date(photo.timestamp) >= monthAgo,
    ).length;

    return { days, thisMonth };
  };

  const stats = getJourneyStats();

  const handleMenuPress = (item) => {
    switch (item) {
      case "physical":
        Alert.alert("Physical Activity", "Track your workouts and activities");
        break;
      case "statistics":
        Alert.alert("Statistics", "View detailed progress analytics");
        break;
      case "routes":
        Alert.alert("Routes", "Explore workout routes and locations");
        break;
      case "bestTime":
        Alert.alert("Best Time", "Find your optimal workout times");
        break;
      case "equipment":
        Alert.alert("Equipment", "Manage your fitness equipment");
        break;
      case "settings":
        Alert.alert("Settings", "App preferences and configuration");
        break;
      default:
        break;
    }
  };

  return (
    <Layout backgroundColor="#FAFAFA">
      <ModernHeader
        title="Profile"
        leftIcon={<Feather name="arrow-left" size={20} color="#666" />}
        rightIcon={<Feather name="settings" size={20} color="#666" />}
        onRightPress={() => handleMenuPress("settings")}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <ModernCard style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={["#8B5FBF", "#6A4C93"]}
                style={styles.avatarGradient}
              >
                <Text style={styles.avatarText}>
                  {userName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </Text>
              </LinearGradient>
            </View>

            <View style={styles.profileInfo}>
              {isEditingProfile ? (
                <View style={styles.editingContainer}>
                  <TextInput
                    style={styles.nameInput}
                    value={userName}
                    onChangeText={setUserName}
                    placeholder="Your name"
                  />
                  <TextInput
                    style={styles.locationInput}
                    value={userLocation}
                    onChangeText={setUserLocation}
                    placeholder="Location"
                  />
                </View>
              ) : (
                <View>
                  <Text style={styles.userName}>{userName}</Text>
                  <Text style={styles.userLocation}>{userLocation}</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.editButton}
              onPress={
                isEditingProfile
                  ? saveUserData
                  : () => setIsEditingProfile(true)
              }
            >
              <Feather
                name={isEditingProfile ? "check" : "edit-2"}
                size={16}
                color="#8B5FBF"
              />
            </TouchableOpacity>
          </View>

          {/* Follow Stats */}
          <View style={styles.followStats}>
            <View style={styles.followItem}>
              <Text style={styles.followNumber}>{followers}</Text>
              <Text style={styles.followLabel}>Followers</Text>
            </View>
            <View style={styles.followDivider} />
            <View style={styles.followItem}>
              <Text style={styles.followNumber}>{following}</Text>
              <Text style={styles.followLabel}>Following</Text>
            </View>
          </View>
        </ModernCard>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statsGrid}>
            {/* Start Weight */}
            <View style={styles.statCard}>
              <LinearGradient
                colors={["#A8E6CF", "#7FCDCD"]}
                style={styles.statGradient}
              >
                <Text style={styles.statLabel}>Start weight</Text>
                {isEditingProfile ? (
                  <TextInput
                    style={styles.statInput}
                    value={startWeight}
                    onChangeText={setStartWeight}
                    keyboardType="numeric"
                    placeholder="0.0"
                  />
                ) : (
                  <Text style={styles.statValue}>{startWeight} kg</Text>
                )}
              </LinearGradient>
            </View>

            {/* Goal Weight */}
            <View style={styles.statCard}>
              <LinearGradient
                colors={["#FFB347", "#FF8C42"]}
                style={styles.statGradient}
              >
                <Text style={styles.statLabel}>Goal</Text>
                {isEditingProfile ? (
                  <TextInput
                    style={styles.statInput}
                    value={goalWeight}
                    onChangeText={setGoalWeight}
                    keyboardType="numeric"
                    placeholder="0.0"
                  />
                ) : (
                  <Text style={styles.statValue}>{goalWeight} kg</Text>
                )}
              </LinearGradient>
            </View>

            {/* Daily Calories */}
            <View style={styles.statCard}>
              <LinearGradient
                colors={["#8B5FBF", "#6A4C93"]}
                style={styles.statGradient}
              >
                <Text style={styles.statLabel}>Daily calories</Text>
                {isEditingProfile ? (
                  <TextInput
                    style={styles.statInput}
                    value={dailyCalories}
                    onChangeText={setDailyCalories}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                ) : (
                  <Text style={styles.statValue}>{dailyCalories} kcal</Text>
                )}
              </LinearGradient>
            </View>
          </View>
        </View>

        {/* Progress Stats */}
        <ModernCard style={styles.progressCard}>
          <SectionHeader
            title="Progress Overview"
            subtitle="Your fitness journey"
          />
          <View style={styles.progressStats}>
            <View style={styles.progressItem}>
              <View style={styles.progressIconContainer}>
                <Feather name="calendar" size={20} color="#8B5FBF" />
              </View>
              <View style={styles.progressContent}>
                <Text style={styles.progressValue}>{stats.days} days</Text>
                <Text style={styles.progressLabel}>Journey started</Text>
              </View>
            </View>

            <View style={styles.progressItem}>
              <View style={styles.progressIconContainer}>
                <Feather name="camera" size={20} color="#FF8C42" />
              </View>
              <View style={styles.progressContent}>
                <Text style={styles.progressValue}>{photos.length} photos</Text>
                <Text style={styles.progressLabel}>Progress captured</Text>
              </View>
            </View>

            <View style={styles.progressItem}>
              <View style={styles.progressIconContainer}>
                <Feather name="trending-up" size={20} color="#A8E6CF" />
              </View>
              <View style={styles.progressContent}>
                <Text style={styles.progressValue}>
                  {stats.thisMonth} this month
                </Text>
                <Text style={styles.progressLabel}>Recent activity</Text>
              </View>
            </View>
          </View>
        </ModernCard>

        {/* Fitness Goal */}
        <ModernCard style={styles.goalCard}>
          <SectionHeader
            title="🎯 Fitness Goal"
            subtitle="What drives your journey"
          />
          {isEditingProfile ? (
            <TextInput
              style={styles.goalInput}
              value={goal}
              onChangeText={setGoal}
              placeholder="Describe your fitness goal... (e.g., Lose 20lbs, Build muscle, Get stronger)"
              multiline
              numberOfLines={4}
            />
          ) : (
            <View style={styles.goalDisplay}>
              <Text style={styles.goalText}>
                {goal ||
                  "Set your fitness goal to get personalized AI feedback!"}
              </Text>
            </View>
          )}
        </ModernCard>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <SectionHeader title="Quick Actions" />

          {/* Physical Activity */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleMenuPress("physical")}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: "#E8F4FD" }]}>
                <Feather name="activity" size={20} color="#4A90E2" />
              </View>
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemTitle}>Physical activity</Text>
                <Text style={styles.menuItemSubtitle}>
                  {stats.thisMonth} days ago
                </Text>
              </View>
            </View>
            <Feather name="chevron-right" size={20} color="#C7C7CC" />
          </TouchableOpacity>

          {/* Statistics */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleMenuPress("statistics")}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: "#FFF3E0" }]}>
                <Feather name="bar-chart-2" size={20} color="#FF8C42" />
              </View>
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemTitle}>Statistics</Text>
                <Text style={styles.menuItemSubtitle}>
                  This year, {Math.floor(stats.days / 30)} months tracking
                </Text>
              </View>
            </View>
            <Feather name="chevron-right" size={20} color="#C7C7CC" />
          </TouchableOpacity>

          {/* Routes */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleMenuPress("routes")}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: "#F3E5F5" }]}>
                <Feather name="map-pin" size={20} color="#8B5FBF" />
              </View>
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemTitle}>Routes</Text>
                <Text style={styles.menuItemSubtitle}>0 km</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={20} color="#C7C7CC" />
          </TouchableOpacity>

          {/* Best Time */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleMenuPress("bestTime")}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: "#E8F5E8" }]}>
                <Feather name="clock" size={20} color="#4CAF50" />
              </View>
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemTitle}>Best time</Text>
                <Text style={styles.menuItemSubtitle}>Show all</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={20} color="#C7C7CC" />
          </TouchableOpacity>

          {/* Equipment */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleMenuPress("equipment")}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: "#FDE7E7" }]}>
                <Feather name="target" size={20} color="#E57373" />
              </View>
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemTitle}>Equipment</Text>
                <Text style={styles.menuItemSubtitle}>
                  Nike Pegasus 3000-130.4 km
                </Text>
              </View>
            </View>
            <Feather name="chevron-right" size={20} color="#C7C7CC" />
          </TouchableOpacity>
        </View>

        {/* Settings */}
        <ModernCard style={styles.settingsCard}>
          <SectionHeader title="Preferences" />

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Feather name="bell" size={20} color="#8B5FBF" />
              <Text style={styles.settingText}>Push Notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: "#E0E0E0", true: "#8B5FBF" }}
              thumbColor={notificationsEnabled ? "white" : "#f4f3f4"}
            />
          </View>
        </ModernCard>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </Layout>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },

  // Profile Card
  profileCard: {
    marginBottom: 20,
    padding: 20,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatarGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "white",
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 4,
  },
  userLocation: {
    fontSize: 14,
    color: "#666",
  },
  editingContainer: {
    flex: 1,
  },
  nameInput: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    paddingVertical: 4,
    marginBottom: 8,
  },
  locationInput: {
    fontSize: 14,
    color: "#666",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    paddingVertical: 4,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F8F9FF",
    justifyContent: "center",
    alignItems: "center",
  },
  followStats: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  followItem: {
    flex: 1,
    alignItems: "center",
  },
  followNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
  followLabel: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  followDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#E0E0E0",
    marginHorizontal: 20,
  },

  // Stats Cards
  statsContainer: {
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 15,
    overflow: "hidden",
    boxShadow: "0px 4px 8px rgba(0,0,0,0.1)",
    elevation: 5,
  },
  statGradient: {
    padding: 16,
    alignItems: "center",
    minHeight: 80,
    justifyContent: "center",
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 8,
    textAlign: "center",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
  statInput: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.5)",
    paddingVertical: 4,
    minWidth: 60,
  },

  // Progress Card
  progressCard: {
    marginBottom: 20,
    padding: 20,
  },
  progressStats: {
    marginTop: 12,
  },
  progressItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  progressIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F8F9FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  progressContent: {
    flex: 1,
  },
  progressValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  progressLabel: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },

  // Goal Card
  goalCard: {
    marginBottom: 24,
    padding: 20,
  },
  goalInput: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
    backgroundColor: "#F8F9FA",
    marginTop: 12,
  },
  goalDisplay: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  goalText: {
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
  },

  // Menu Section
  menuSection: {
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    boxShadow: "0px 2px 8px rgba(0,0,0,0.05)",
    elevation: 2,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },

  // Settings Card
  settingsCard: {
    marginBottom: 20,
    padding: 20,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingText: {
    fontSize: 16,
    color: "#000",
    marginLeft: 12,
  },

  bottomSpacing: {
    height: 30,
  },
});
