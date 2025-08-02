import React, { createContext, useState, useEffect } from 'react';
import { Text } from 'react-native';
import { Tabs } from 'expo-router';
// eslint-disable-next-line import/no-unresolved
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

export const PhotoContext = createContext({
  photos: [],
  setPhotos: () => {},
  loading: false,
  setLoading: () => {},
});

export default function TabLayout() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);

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
      <Tabs initialRouteName="homepage" screenOptions={{ headerShown: false }}>
        <Tabs.Screen
          name="homepage"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 24, color }}>🏠</Text>,
          }}
        />
        <Tabs.Screen
          name="camera"
          options={{
            title: 'Camera',
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 24, color }}>📸</Text>,
          }}
        />
        <Tabs.Screen
          name="progress"
          options={{
            title: 'Progress',
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 24, color }}>📊</Text>,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 24, color }}>👤</Text>,
          }}
        />
      </Tabs>
    </PhotoContext.Provider>
  );
}
