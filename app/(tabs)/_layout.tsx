import React, { createContext, useState, useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@/constants/theme';

export const PhotoContext = createContext({
  photos: [],
  setPhotos: () => {},
  loading: false,
  setLoading: () => {},
});

export default function TabLayout() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    try {
      const savedPhotos = await AsyncStorage.getItem('progressPhotos');
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
          await AsyncStorage.setItem('progressPhotos', JSON.stringify(validPhotos));
        }
        setPhotos(validPhotos);
      }
    } catch (error) {
      console.error('Error loading photos:', error);
    }
  };

  return (
    <PhotoContext.Provider value={{ photos, setPhotos, loading, setLoading }}>
      <Tabs
        initialRouteName="homepage"
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: '#9AA1B9',
          tabBarStyle: {
            backgroundColor: '#fff',
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
            title: 'Home',
            tabBarIcon: ({ color, size }) => <Feather name="home" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="camera"
          options={{
            title: 'Camera',
            tabBarIcon: ({ color, size }) => <Feather name="camera" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="progress"
          options={{
            title: 'Progress',
            tabBarIcon: ({ color, size }) => <Feather name="bar-chart-2" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => <Feather name="user" size={size} color={color} />,
          }}
        />
      </Tabs>
    </PhotoContext.Provider>
  );
}
