/* eslint-disable import/no-unresolved */
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, Alert, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Camera } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { styles } from '../constants/styles';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export default function CameraScreen({ photos, setPhotos, loading, setLoading }) {
  const [cameraPermission, setCameraPermission] = useState(null);
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    getCameraPermission();
    checkWelcomeStatus();
  }, []);

  const checkWelcomeStatus = async () => {
    try {
      const hasSeenWelcome = await AsyncStorage.getItem('hasSeenWelcome');
      if (hasSeenWelcome === 'true') {
        setShowWelcome(false);
      }
    } catch (error) {
      console.error('Error checking welcome status:', error);
    }
  };

  const handleGetStarted = async () => {
    try {
      await AsyncStorage.setItem('hasSeenWelcome', 'true');
      setShowWelcome(false);
    } catch (error) {
      console.error('Error saving welcome status:', error);
    }
  };

  const getCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setCameraPermission(status === 'granted');
  };

  const takePhoto = async () => {
    if (!cameraPermission) {
      Alert.alert('Camera permission required');
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

      const previousPhoto = photos.length > 0 ? photos[photos.length - 1] : null;

      if (previousPhoto) {
        const analysis = await getAIAnalysis(previousPhoto.uri, permanentUri);
        newPhoto.analysis = analysis;
      } else {
        newPhoto.analysis = "This is your first progress photo! Great job starting your fitness journey. Take another photo in a week to see your progress!";
      }

      const updatedPhotos = [...photos, newPhoto];
      await savePhotos(updatedPhotos);
      setPhotos(updatedPhotos);
    } catch (error) {
      console.error('Error processing photo:', error);
      Alert.alert('Error', 'Failed to save photo. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getAIAnalysis = async (previousPhotoUri, currentPhotoUri) => {
    try {
      const userGoal = await AsyncStorage.getItem('fitnessGoal') || '';

      const previousBase64 = await uriToBase64(previousPhotoUri);
      const currentBase64 = await uriToBase64(currentPhotoUri);

      let goalContext = '';
      if (userGoal) {
        goalContext = `The user's fitness goal is: "${userGoal}". Focus your analysis on progress toward this specific goal. `;
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `${goalContext}Compare these two fitness progress photos. The first is the previous photo, the second is the new one. Analyze visible changes in muscle definition, body composition, posture improvements, and specific areas of progress. Provide encouraging, specific feedback about the journey shown. Keep it positive and motivating.`,
                },
                { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${previousBase64}` } },
                { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${currentBase64}` } },
              ],
            },
          ],
          max_tokens: 300,
        }),
      });

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('AI Analysis Error:', error);
      return "Unable to analyze photos right now. Your progress photo has been saved!";
    }
  };

  const uriToBase64 = async (uri) => {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64;
    } catch (error) {
      console.error('Error converting to base64:', error);
      return null;
    }
  };

  const savePhotos = async (newPhotos) => {
    try {
      await AsyncStorage.setItem('progressPhotos', JSON.stringify(newPhotos));
    } catch (error) {
      console.error('Error saving photos:', error);
    }
  };

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
            <Text style={styles.heroImagePlaceholder}>💪</Text>
            <Text style={styles.heroImageText}>Progress Photo</Text>
          </View>
        </View>
        <View style={styles.welcomeContent}>
          <Text style={styles.welcomeTitle}>Track Your Fitness{'\n'}Journey</Text>
          <Text style={styles.welcomeSubtitle}>
            Capture progress photos and get AI-powered insights to achieve your fitness goals with personalized tracking.
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.modernHeader}>
        <Text style={styles.modernHeaderTitle}>Capture Progress</Text>
        <Text style={styles.modernHeaderSubtitle}>
          {photos.length === 0 ? 'Take your first progress photo' : `Photo ${photos.length + 1} • Keep going!`}
        </Text>
      </View>
      {loading ? (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#4285f4" />
            <Text style={styles.loadingTitle}>Analyzing Your Progress</Text>
            <Text style={styles.loadingSubtext}>AI is comparing your photos...</Text>
            <View style={styles.loadingDots}>
              <View style={[styles.dot, styles.dotActive]} />
              <View style={[styles.dot, styles.dotActive]} />
              <View style={styles.dot} />
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.modernCameraContent}>
          <TouchableOpacity style={styles.modernCameraButton} onPress={takePhoto} activeOpacity={0.8}>
            <View style={styles.modernCameraIcon}>
              <Text style={styles.cameraIconText}>📸</Text>
            </View>
            <Text style={styles.modernCameraButtonText}>Take Progress Photo</Text>
          </TouchableOpacity>
          {photos.length > 0 && (
            <View style={styles.modernLastPhotoContainer}>
              <Text style={styles.modernLastPhotoLabel}>Latest Progress</Text>
              <View style={styles.modernLastPhotoCard}>
                <Image
                  source={{ uri: photos[photos.length - 1].uri }}
                  style={styles.modernLastPhotoImage}
                />
                <View style={styles.modernPhotoOverlay}>
                  <Text style={styles.modernPhotoOverlayText}>
                    {new Date(photos[photos.length - 1].timestamp).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

