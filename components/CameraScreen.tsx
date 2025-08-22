import { Colors } from "@/constants/Colors";
import { useTheme } from "@/contexts/ThemeContext";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Camera } from "expo-camera";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  Linking,
  Modal,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { supabase } from '../utils/supabase';

import Layout, {
  EmptyState,
  ModernCard,
  ModernHeader
} from "./Layout";

// No client-side OpenAI key; Edge Function will call OpenAI.
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
  const { isDarkMode, theme } = useTheme();
  const palette = isDarkMode ? Colors.dark : Colors.light;
  const primary = palette.primary;
  const text = theme.colors.text;
  const textSecondary = palette.textSecondary;
  const card = theme.colors.card;
  const border = theme.colors.border;
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [showTips, setShowTips] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // countdown
  const [count, setCount] = useState<number>(0);
  const countdownAnim = useRef(new Animated.Value(0)).current;
  const intervalRef = useRef<any>(null);
  const router = useRouter();

  const requestCameraPermissionWithPrompt = async () => {
    Alert.alert(
      'Camera Access Required',
      'To take progress photos, the app needs access to your camera. Please grant permission.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Allow',
          onPress: async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setCameraPermission(status === 'granted');
            if (status !== 'granted') {
              Alert.alert(
                'Permission Denied',
                'Camera access is required to take progress photos. You can enable it in your device settings.',
                [
                  {
                    text: 'Open Settings',
                    onPress: () => Linking.openSettings(),
                  },
                  { text: 'OK' },
                ]
              );
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    const checkAndRequestPermission = async () => {
      const { status } = await Camera.getCameraPermissionsAsync();
      if (status !== 'granted') {
        await requestCameraPermissionWithPrompt();
      } else {
        setCameraPermission(true);
      }
    };
    checkAndRequestPermission();
    initTipsFlag();
    // OpenAI is handled on the server (Edge Function);
  }, []);

  const initTipsFlag = async () => {
    const seen = await AsyncStorage.getItem(TIPS_SEEN_KEY);
    // Show tips if user hasn't dismissed them yet
    if (!seen) setShowTips(true);
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
      // Always fetch current user ID from Supabase
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      if (!userId) throw new Error("Photo upload failed: user ID not found");
      
      // Upload photo via Edge Function
      let supabaseUrl = "";
      try {
        supabaseUrl = await uploadPhotoViaFunction(photo.uri, userId, "camera_photo_");
      } catch (err) {
        Alert.alert("Photo upload failed", err instanceof Error ? err.message : JSON.stringify(err));
        setLoading(false);
        return;
      }
      // Analyze photo with aicoach
      let analysis = null;
      const previousPhoto = photos.length > 0 ? photos[photos.length - 1] : null;
      if (previousPhoto) {
        analysis = await getAIAnalysis(previousPhoto.uri, supabaseUrl);
      } else {
        analysis = "Great start! This is your first progress photo. Keep going!";
      }
      // Save metadata to Supabase
      const { error } = await supabase.from('photos').insert({
        user_id: user.id,
        url: supabaseUrl,
        timestamp: new Date().toISOString(),
        analysis,
      });
      if (error) throw error;
      // Update local state (optional: fetch from Supabase instead)
      const newPhoto: any = {
        id: Date.now().toString(),
        uri: supabaseUrl,
        date: new Date().toISOString(),
        analysis,
      };
      const updatedPhotos = [...photos, newPhoto];
      setPhotos(updatedPhotos);
      // Navigate to AI Coach screen and pass photo
      router.push('/(tabs)/aicoach?photoUri=' + encodeURIComponent(supabaseUrl));
    } catch (error) {
      console.error("Error processing photo:", error);
      Alert.alert("Error", error instanceof Error ? error.message : JSON.stringify(error));
    } finally {
      setLoading(false);
    }
  };

  const getAIAnalysis = async (
    previousPhotoUrl: string,
    currentPhotoUrl: string
  ): Promise<string> => {
    try {
      const userGoal = (await AsyncStorage.getItem("fitnessGoal")) || "";
      // Send image URLs instead of base64
      const payload = { previousPhotoUrl, currentPhotoUrl, goal: userGoal };
      const res = await supabase.functions.invoke('aicoach', { body: JSON.stringify(payload) });
      if (res.error) {
        console.warn('aicoach function error:', res.error);
        return 'AI analysis failed. Please try again later.';
      }
      const data = res.data as any;
      return data?.feedback ?? 'Progress photo saved! Keep up the great work!';
    } catch (error) {
      console.error("AI Analysis Error:", error);
      return "Progress photo saved! Keep up the great work!";
    }
  };

  const uploadPhotoViaFunction = async (photoUri: string, userId: string, fileNamePrefix: string = 'photo_') => {
    // 1. Read the file and get content type
    const response = await fetch(photoUri);
    const blob = await response.blob();
    const contentType = blob.type || 'image/jpeg';

    // 2. Convert file to base64
    const base64 = await FileSystem.readAsStringAsync(photoUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // 3. Prepare the payload
    const fileName = `${fileNamePrefix}${userId}_${Date.now()}.jpg`;
    const payload = {
      userId,
      fileName,
      fileBase64: base64,
      contentType,
    };

    // 4. Invoke the Edge Function
    const { data, error } = await supabase.functions.invoke('upload-photo', {
      body: JSON.stringify(payload),
    });

    if (error) {
      console.error('Edge function invocation error:', error);
      throw new Error(error.message || 'Failed to upload photo via function.');
    }
    
    if (data.error) {
        console.error('Edge function returned an error:', data.error);
        throw new Error(data.error);
    }

    console.log('Edge function success data:', data);
    if (!data.publicUrl) {
        throw new Error('Upload succeeded but did not return a public URL.');
    }
    return data.publicUrl;
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
      <Feather name="check-circle" size={18} color={palette.success} style={{ marginTop: 2 }} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: "700", color: text }}>{title}</Text>
        <Text style={{ color: textSecondary, marginTop: 2 }}>{body}</Text>
      </View>
    </View>
  );

  const TipsModal = () => (
  <Modal visible={showTips} transparent animationType="fade" onRequestClose={() => setShowTips(false)}>
      <View
        style={{
          flex: 1,
          backgroundColor: isDarkMode ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.35)",
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
              backgroundColor: card,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              padding: 18,
              paddingBottom: Platform.OS === "ios" ? 28 : 18,
          }}
        >
          {/* Grab handle */}
          <View style={{ alignItems: "center", marginBottom: 8 }}>
            <View
              style={{
                width: 42,
                height: 4,
                borderRadius: 2,
                backgroundColor: textSecondary,
                opacity: 0.5,
              }}
            />
          </View>
          <View style={{ alignItems: "center", marginBottom: 8 }}>
      <Feather name="camera" size={24} color={primary} />
      <Text style={{ marginTop: 8, fontSize: 18, fontWeight: "800", color: text }}>
              Nail Consistency Every Time
            </Text>
      <Text style={{ color: textSecondary, marginTop: 4 }}>
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
                color={dontShowAgain ? primary : textSecondary}
              />
              <Text style={{ marginLeft: 8, color: textSecondary }}>Don&apos;t show again</Text>
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
                borderColor: border,
                alignItems: "center",
                opacity: pressed ? 0.8 : 1,
              })}
              accessibilityRole="button"
              accessibilityLabel="Cancel tips"
            >
              <Text style={{ color: text, fontWeight: "600" }}>Cancel</Text>
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
                backgroundColor: primary,
                alignItems: "center",
                opacity: pressed ? 0.8 : 1,
                // Light mode shadow for emphasis
                shadowColor: isDarkMode ? "transparent" : primary,
                shadowOpacity: isDarkMode ? 0 : 0.25,
                shadowRadius: isDarkMode ? 0 : 8,
                shadowOffset: { width: 0, height: isDarkMode ? 0 : 4 },
              })}
              accessibilityRole="button"
              accessibilityLabel="Open camera"
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
  {/* Removed loading card */}
        <TipsModal />
        <CountdownOverlay />
      </Layout>
    );
  }

  // Camera permission notification UI
  const CameraPermissionBanner = () =>
    cameraPermission === false ? (
      <View style={{
        backgroundColor: '#F87171',
        padding: 16,
        borderRadius: 12,
        margin: 16,
        alignItems: 'center',
        flexDirection: 'row',
        gap: 12,
      }}>
        <Feather name="alert-triangle" size={24} color="#fff" />
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
            Camera access is required
          </Text>
          <Text style={{ color: '#fff', marginTop: 4 }}>
            Please enable camera permission in your device settings to take progress photos.
          </Text>
        </View>
        <Pressable
          style={{ backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}
          onPress={() => Linking.openSettings()}
        >
          <Text style={{ color: '#F87171', fontWeight: 'bold' }}>Open Settings</Text>
        </Pressable>
      </View>
    ) : null;

  return (
    <Layout>
      <CameraPermissionBanner />
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
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: palette.surface,
            }}
          >
            <Feather name="camera" size={28} color={primary} />
          </View>
          <Text style={{ marginTop: 12, fontSize: 16, fontWeight: "700", color: primary }}>
            Take Photo
          </Text>
          <Text style={{ marginTop: 6, fontSize: 12, color: textSecondary, textAlign: "center" }}>
            Same pose • Same distance • Same lighting
          </Text>
        </ModernCard>

        <ModernCard
          onPress={importFromLibrary}
          padding={18}
          style={{ alignItems: "center", justifyContent: "center" }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: palette.surface,
            }}
          >
            <Feather name="image" size={20} color={textSecondary} />
          </View>
          <Text style={{ marginTop: 8, fontSize: 14, fontWeight: "600", color: text }}>
            Import from Library
          </Text>
        </ModernCard>
      </View>

  {/* Removed loading card */}
      <TipsModal />
      <CountdownOverlay />
    </Layout>
  );
}

