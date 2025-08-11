import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Camera } from "expo-camera";
import Constants from 'expo-constants';
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Text,
  View,
  Modal,
  Pressable,
  Animated,
  Easing,
  Platform,
} from "react-native";

import Layout, {
  EmptyState,
  ModernCard,
  ModernHeader,
  ModernLoading,
} from "./Layout";

// Get API key from environment variables
const OPENAI_API_KEY = Constants.expoConfig?.extra?.openaiApiKey || process.env.EXPO_PUBLIC_OPENAI_API_KEY;
const TIPS_SEEN_KEY = "cf_tips_seen";

interface CameraScreenProps {
  photos: any[];
  setPhotos: (photos: any[]) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export default function CameraScreen({
  photos,
  setPhotos,
  loading,
  setLoading,
}: CameraScreenProps) {
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [showTips, setShowTips] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // countdown
  const [count, setCount] = useState<number>(0);
  const countdownAnim = useRef(new Animated.Value(0)).current;
  const intervalRef = useRef<any>(null);

  useEffect(() => {
    getCameraPermission();
    initTipsFlag();
    checkApiKey();
  }, []);

  const checkApiKey = () => {
    if (!OPENAI_API_KEY) {
      console.warn('OpenAI API key not found. AI analysis will be disabled.');
    }
  };

  const initTipsFlag = async () => {
    const seen = await AsyncStorage.getItem(TIPS_SEEN_KEY);
    // Show tips if user hasn't dismissed them yet
    if (!seen) setShowTips(true);
  };

  const getCameraPermission = async (): Promise<void> => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setCameraPermission(status === "granted");
  };

  const openCameraFlow = async () => {
    // If the user wants to see tips, show modal first
    const seen = await AsyncStorage.getItem(TIPS_SEEN_KEY);
    if (!seen) {
      setShowTips(true);
      return;
    }
    startCountdown();
  };

  const startCountdown = () => {
    // 3-2-1 overlay then open camera
    setCount(3);
    animateCount();
    intervalRef.current = setInterval(() => {
      setCount((c) => {
        if (c <= 1) {
          clearInterval(intervalRef.current);
          setTimeout(() => {
            setCount(0);
            takePhoto();
          }, 200); // tiny pause for UX
          return 0;
        }
        animateCount();
        return c - 1;
      });
    }, 900);
  };

  const animateCount = () => {
    countdownAnim.setValue(0);
    Animated.timing(countdownAnim, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  const takePhoto = async (): Promise<void> => {
    if (!cameraPermission) {
      Alert.alert("Camera permission required");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.9,
    });

    if (!result.canceled) {
      await processNewPhoto(result.assets[0]);
    }
  };

  const importFromLibrary = async (): Promise<void> => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.9,
    });
    if (!result.canceled) {
      await processNewPhoto(result.assets[0]);
    }
  };

  const processNewPhoto = async (photo: any): Promise<void> => {
    setLoading(true);
    try {
      const fileName = `progress_photo_${Date.now()}.jpg`;
      const permanentUri = FileSystem.documentDirectory + fileName;
      await FileSystem.copyAsync({ from: photo.uri, to: permanentUri });

      const newPhoto: any = {
        id: Date.now().toString(),
        uri: permanentUri,
        date: new Date().toISOString(),
        analysis: null as string | null,
      };

      const previousPhoto = photos.length > 0 ? photos[photos.length - 1] : null;
      if (previousPhoto && OPENAI_API_KEY) {
        const analysis = await getAIAnalysis(previousPhoto.uri, permanentUri);
        newPhoto.analysis = analysis;
      } else if (!OPENAI_API_KEY) {
        newPhoto.analysis = "Photo saved! AI analysis is currently unavailable.";
      } else {
        newPhoto.analysis = "Great start! This is your first progress photo. Keep going!";
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

  const getAIAnalysis = async (
    previousPhotoUri: string,
    currentPhotoUri: string
  ): Promise<string> => {
    if (!OPENAI_API_KEY) {
      console.warn('OpenAI API key not available');
      return "Photo saved! AI analysis is currently unavailable.";
    }

    try {
      const userGoal = (await AsyncStorage.getItem("fitnessGoal")) || "";
      const previousBase64 = await uriToBase64(previousPhotoUri);
      const currentBase64 = await uriToBase64(currentPhotoUri);

      const goalContext = userGoal
        ? `The user's fitness goal is: "${userGoal}". `
        : "";

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
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
                  text:
                    goalContext +
                    "Compare these two progress photos and provide encouraging, specific feedback.",
                },
                { type: "image_url", image_url: { url: `data:image/jpeg;base64,${previousBase64}` } },
                { type: "image_url", image_url: { url: `data:image/jpeg;base64,${currentBase64}` } },
              ],
            },
          ],
          max_tokens: 200,
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      return data?.choices?.[0]?.message?.content ?? "Progress photo saved! Keep up the great work!";
    } catch (error) {
      console.error("AI Analysis Error:", error);
      return "Progress photo saved! Keep up the great work!";
    }
  };

  const uriToBase64 = async (uri: string): Promise<string> => {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return base64;
  };

  /** ---------- UI ---------- */

  const TipItem = ({ title, body }: { title: string; body: string }) => (
    <View
      style={{
        flexDirection: "row",
        gap: 10,
        paddingVertical: 8,
        alignItems: "flex-start",
      }}
    >
      <Feather name="check-circle" size={18} color="#10B981" style={{ marginTop: 2 }} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: "700", color: "#0F172A" }}>{title}</Text>
        <Text style={{ color: "#334155", marginTop: 2 }}>{body}</Text>
      </View>
    </View>
  );

  const TipsModal = () => (
    <Modal visible={showTips} transparent animationType="fade" onRequestClose={() => setShowTips(false)}>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.35)",
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            padding: 18,
            paddingBottom: Platform.OS === "ios" ? 28 : 18,
          }}
        >
          <View style={{ alignItems: "center", marginBottom: 8 }}>
            <Feather name="camera" size={24} color="#0EA5E9" />
            <Text style={{ marginTop: 8, fontSize: 18, fontWeight: "800", color: "#0F172A" }}>
              Nail Consistency Every Time
            </Text>
            <Text style={{ color: "#475569", marginTop: 4 }}>
              Consistent photos = accurate AI comparisons.
            </Text>
          </View>

          <TipItem
            title="Same Pose"
            body="Face the same direction, hands in the same position (e.g., by your sides), neutral posture. Use front/side/back consistently."
          />
          <TipItem
            title="Same Distance & Framing"
            body="Place your feet on a floor mark. Keep the camera ~6–8 ft away, hips centered, top of head to knees in frame."
          />
          <TipItem
            title="Same Lighting"
            body="Use bright, even light (window or bathroom lights). Avoid backlight and harsh shadows."
          />
          <TipItem
            title="Same Background"
            body="Plain wall or door is best. Remove clutter to help the AI read contours."
          />
          <TipItem
            title="Same Time of Day"
            body="Morning before food/water gives the most consistent look."
          />

          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
            <Pressable
              onPress={() => {
                const next = !dontShowAgain;
                setDontShowAgain(next);
              }}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Feather
                name={dontShowAgain ? "check-square" : "square"}
                size={18}
                color={dontShowAgain ? "#0EA5E9" : "#94A3B8"}
              />
              <Text style={{ marginLeft: 8, color: "#475569" }}>Don&apos;t show again</Text>
            </Pressable>
          </View>

          <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
            <Pressable
              onPress={() => setShowTips(false)}
              style={({ pressed }) => ({
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#E2E8F0",
                alignItems: "center",
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Text style={{ color: "#0F172A", fontWeight: "600" }}>Cancel</Text>
            </Pressable>

            <Pressable
              onPress={async () => {
                if (dontShowAgain) await AsyncStorage.setItem(TIPS_SEEN_KEY, "1");
                setShowTips(false);
                startCountdown();
              }}
              style={({ pressed }) => ({
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: "#0EA5E9",
                alignItems: "center",
                opacity: pressed ? 0.8 : 1,
                shadowColor: "#0EA5E9",
                shadowOpacity: 0.25,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 4 },
              })}
            >
              <Text style={{ color: "white", fontWeight: "700" }}>Open Camera</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );

  const CountdownOverlay = () =>
    count > 0 ? (
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(0,0,0,0.25)",
        }}
      >
        <Animated.Text
          style={{
            fontSize: 120,
            fontWeight: "900",
            color: "white",
            opacity: countdownAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }),
            transform: [
              {
                scale: countdownAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.1] }),
              },
            ],
          }}
        >
          {count}
        </Animated.Text>
      </View>
    ) : null;

  /** ---------- Render ---------- */

  if (photos.length === 0) {
    return (
      <Layout>
        <ModernHeader title="Progress" subtitle="Your fitness journey" />
        <EmptyState
          icon="📷✨"
          title="No Progress Yet"
          subtitle="Take your first photo. Use the same pose, distance, lighting, and background each time for accurate comparisons."
          buttonText="Take First Photo"
          onButtonPress={openCameraFlow}
          // Optional secondary action
          secondaryButtonText="Import from Library"
          onSecondaryButtonPress={importFromLibrary}
        />
        {loading && <ModernLoading title="Analyzing Progress" subtitle="AI is working..." />}
        <TipsModal />
        <CountdownOverlay />
      </Layout>
    );
  }

  return (
    <Layout>
      <ModernHeader title="Progress" subtitle="Your fitness journey" />
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 40,
          gap: 14,
        }}
      >
        <ModernCard
          onPress={openCameraFlow}
          padding={30}
          style={{ alignItems: "center", justifyContent: "center" }}
        >
          <Feather name="camera" size={32} color="#0EA5E9" />
          <Text style={{ marginTop: 12, fontSize: 16, fontWeight: "700", color: "#0EA5E9" }}>
            Take Photo
          </Text>
          <Text style={{ marginTop: 6, fontSize: 12, color: "#64748B", textAlign: "center" }}>
            Same pose • Same distance • Same lighting
          </Text>
        </ModernCard>

        <ModernCard
          onPress={importFromLibrary}
          padding={18}
          style={{ alignItems: "center", justifyContent: "center" }}
        >
          <Feather name="image" size={22} color="#64748B" />
          <Text style={{ marginTop: 8, fontSize: 14, fontWeight: "600", color: "#334155" }}>
            Import from Library
          </Text>
        </ModernCard>
      </View>

      {loading && <ModernLoading title="Analyzing Progress" subtitle="AI is working..." />}
      <TipsModal />
      <CountdownOverlay />
    </Layout>
  );
}

