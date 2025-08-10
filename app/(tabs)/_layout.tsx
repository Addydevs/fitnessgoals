import { Colors } from "@/constants/Colors";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import { Tabs } from "expo-router";
import React, { createContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type RootStackParamList = {
  homepage: undefined;
  camera: undefined;
  aicoach: undefined;
  progress: undefined;
  profile: undefined;
  settings: undefined;
};

export interface Photo {
  id: string;
  uri: string;
  timestamp: string;
  analysis: string | null;
  analyzed: boolean;
  progressScore: number | null;
}

export const PhotoContext = createContext<{
  photos: Photo[];
  setPhotos: React.Dispatch<React.SetStateAction<Photo[]>>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}>({
  photos: [],
  setPhotos: () => {},
  loading: false,
  setLoading: () => {},
});

export default function TabLayout() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();

  useEffect(() => {
    loadPhotos();
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
            }
          } catch {
            // ignore
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
    <PhotoContext.Provider value={{ photos, setPhotos, loading, setLoading }}>
      <Tabs
        initialRouteName="homepage"
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
          tabBarInactiveTintColor: "#9AA1B9",
          tabBarStyle: {
            backgroundColor: Colors[colorScheme ?? "light"].background,
            borderTopWidth: 0,
            elevation: 5,
            height: 60 + insets.bottom,
            paddingBottom: insets.bottom,
          },
        }}
      >
        <Tabs.Screen
          name="homepage"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => (
              <Feather name="home" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="camera"
          options={{
            title: "Camera",
            tabBarIcon: ({ color, size }) => (
              <Feather name="camera" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="aicoach"
          options={{
            title: "AI Coach",
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="robot" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="progress"
          options={{
            title: "Progress",
            tabBarIcon: ({ color, size }) => (
              <Feather name="bar-chart-2" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size }) => (
              <Feather name="user" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarIcon: ({ color, size }) => (
              <Feather name="settings" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </PhotoContext.Provider>
  );
}

