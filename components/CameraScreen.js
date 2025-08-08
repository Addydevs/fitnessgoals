import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Camera } from "expo-camera";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import { Alert, Text, View } from "react-native";

import Layout, { ModernHeader, EmptyState, ModernLoading, ModernCard } from "./Layout";

const OPENAI_API_KEY = "your-api-key-here"; // Replace with your actual key

export default function CameraScreen({ photos, setPhotos, loading, setLoading }) {
  const [cameraPermission, setCameraPermission] = useState(null);

  useEffect(() => {
    getCameraPermission();
  }, []);

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
      await FileSystem.copyAsync({ from: photo.uri, to: permanentUri });

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
        newPhoto.analysis =
          "Great start! This is your first progress photo. Keep going!";
      }

      const updatedPhotos = [...photos, newPhoto];
      await AsyncStorage.setItem("progressPhotos", JSON.stringify(updatedPhotos));
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
                    image_url: { url: `data:image/jpeg;base64,${previousBase64}` },
                  },
                  {
                    type: "image_url",
                    image_url: { url: `data:image/jpeg;base64,${currentBase64}` },
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

  if (photos.length === 0) {
    return (
      <Layout>
        <ModernHeader title="Progress" subtitle="Your fitness journey" />
        <EmptyState
          icon="📷✨"
          title="No Progress Yet"
          subtitle="Start your fitness journey by taking your first progress photo. Track your transformation over time!"
          buttonText="Take First Photo"
          onButtonPress={takePhoto}
        />
        {loading && (
          <ModernLoading title="Analyzing Progress" subtitle="AI is working..." />
        )}
      </Layout>
    );
  }

  return (
    <Layout>
      <ModernHeader title="Progress" subtitle="Your fitness journey" />
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 40 }}>
        <ModernCard
          onPress={takePhoto}
          padding={30}
          style={{ alignItems: "center", justifyContent: "center" }}
        >
          <Feather name="camera" size={32} color="#8B5FBF" />
          <Text style={{ marginTop: 12, fontSize: 16, fontWeight: "600", color: "#8B5FBF" }}>
            Take Photo
          </Text>
        </ModernCard>
      </View>
      {loading && (
        <ModernLoading title="Analyzing Progress" subtitle="AI is working..." />
      )}
    </Layout>
  );
}

