import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import * as FileSystem from 'expo-file-system';

import CameraScreen from './components/CameraScreen';
import ProgressScreen from './components/ProgressScreen';
import ProfileScreen from './components/ProfileScreen';
import AICoachPage from './components/AICoachPage';
import { styles } from './constants/styles';

const Tab = createBottomTabNavigator();

export default function App() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPhotos();
    console.log('App Documents Directory:', FileSystem.documentDirectory);
    console.log('App Cache Directory:', FileSystem.cacheDirectory);
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
            } else {
              console.log('Photo file not found, removing from list:', photo.uri);
            }
          } catch (error) {
            console.log('Error checking photo file:', error);
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
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#4285f4',
          tabBarInactiveTintColor: '#8E8E93',
          headerShown: false,
          tabBarStyle: {
            backgroundColor: 'white',
            borderTopColor: 'transparent',
            elevation: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
            height: 90,
            paddingBottom: 25,
            paddingTop: 10,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
          },
        }}
      >
        <Tab.Screen
          name="Camera"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.tabIcon, focused && styles.tabIconFocused]}>
                <Text style={{ fontSize: 24, color }}>📸</Text>
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
          name="Progress"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.tabIcon, focused && styles.tabIconFocused]}>
                <Text style={{ fontSize: 24, color }}>📊</Text>
              </View>
            ),
          }}
        >
          {() => <ProgressScreen photos={photos} setPhotos={setPhotos} />}
        </Tab.Screen>
        <Tab.Screen
          name="AI Coach"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.tabIcon, focused && styles.tabIconFocused]}>
                <Text style={{ fontSize: 24, color }}>🤖</Text>
              </View>
            ),
          }}
        >
          {() => <AICoachPage />}
        </Tab.Screen>
        <Tab.Screen
          name="Profile"
          options={{
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.tabIcon, focused && styles.tabIconFocused]}>
                <Text style={{ fontSize: 24, color }}>👤</Text>
              </View>
            ),
          }}
        >
          {() => <ProfileScreen photos={photos} />}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}

