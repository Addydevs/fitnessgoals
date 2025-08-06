import React, { useState, useEffect } from "react";
import { View, Text, Platform, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as FileSystem from "expo-file-system";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";

import CameraScreen from "./components/CameraScreen";
import ProgressScreen from "./components/ProgressScreen";
import ProfileScreen from "./components/ProfileScreen";
import AICoachScreen from "./components/AICoachScreen";
import { theme } from "./constants/theme";

const Tab = createBottomTabNavigator();

const tabStyles = StyleSheet.create({
  tabIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  tabIconFocused: {
    backgroundColor: "rgba(66, 133, 244, 0.1)",
    transform: [{ scale: 1.1 }],
  },
});

export default function App() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPhotos();
    console.log("App Documents Directory:", FileSystem.documentDirectory);
    console.log("App Cache Directory:", FileSystem.cacheDirectory);
  }, []);

  const loadPhotos = async () => {
    try {
      const savedPhotos = await AsyncStorage.getItem("progressPhotos");
      if (savedPhotos) {
        const parsedPhotos = JSON.parse(savedPhotos);
        const validPhotos = [];
        for (const photo of parsedPhotos) {
          try {
            const fileInfo = await FileSystem.getInfoAsync(photo.uri);
            if (fileInfo.exists) {
              validPhotos.push(photo);
            } else {
              console.log(
                "Photo file not found, removing from list:",
                photo.uri,
              );
            }
          } catch (error) {
            console.log("Error checking photo file:", error);
          }
        }
        if (validPhotos.length !== parsedPhotos.length) {
          await AsyncStorage.setItem(
            "progressPhotos",
            JSON.stringify(validPhotos),
          );
        }
        setPhotos(validPhotos);
      }
    } catch (error) {
      console.error("Error loading photos:", error);
    }
  };

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            tabBarActiveTintColor: theme.colors.primary,
            tabBarInactiveTintColor: "#8E8E93",
            headerShown: false,
            tabBarStyle: {
              backgroundColor: theme.colors.background,
              borderTopColor: "transparent",
              elevation: 10,
              boxShadow: "0px -2px 10px rgba(0,0,0,0.1)",
              // Dynamic height and padding based on platform
              height: Platform.OS === "ios" ? 90 : 80,
              paddingBottom: Platform.OS === "ios" ? 25 : 15,
              paddingTop: 10,
              // Ensure tab bar stays above system navigation
              position: "relative",
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: "600",
              marginBottom: Platform.OS === "ios" ? 5 : 8,
            },
            // Add safe area handling to tab bar items
            tabBarItemStyle: {
              paddingVertical: 5,
            },
          }}
        >
          <Tab.Screen
            name="Camera"
            options={{
              tabBarIcon: ({ color, size, focused }) => (
                <View
                  style={[
                    tabStyles.tabIcon,
                    focused && tabStyles.tabIconFocused,
                  ]}
                >
                  <Feather name="camera" size={size} color={color} />
                </View>
              ),
            }}
          >
            {() => (
              <CameraScreen
                photos={photos}
                setPhotos={setPhotos}
                loading={loading}
                setLoading={setLoading}
              />
            )}
          </Tab.Screen>
          <Tab.Screen
            name="AI Coach"
            options={{
              tabBarIcon: ({ color, size, focused }) => (
                <View
                  style={[
                    tabStyles.tabIcon,
                    focused && tabStyles.tabIconFocused,
                  ]}
                >
                  <MaterialCommunityIcons name="robot-outline" size={size} color={color} />
                </View>
              ),
            }}
          >
            {() => <AICoachScreen />}
          </Tab.Screen>
          <Tab.Screen
            name="Progress"
            options={{
              tabBarIcon: ({ color, size, focused }) => (
                <View
                  style={[
                    tabStyles.tabIcon,
                    focused && tabStyles.tabIconFocused,
                  ]}
                >
                  <Feather name="bar-chart-2" size={size} color={color} />
                </View>
              ),
            }}
          >
            {() => <ProgressScreen photos={photos} setPhotos={setPhotos} />}
          </Tab.Screen>
          <Tab.Screen
            name="Profile"
            options={{
              tabBarIcon: ({ color, size, focused }) => (
                <View
                  style={[
                    tabStyles.tabIcon,
                    focused && tabStyles.tabIconFocused,
                  ]}
                >
                  <Feather name="user" size={size} color={color} />
                </View>
              ),
            }}
          >
            {() => <ProfileScreen photos={photos} />}
          </Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
