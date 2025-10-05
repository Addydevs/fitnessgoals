"use client"

import { Ionicons } from "@expo/vector-icons"
import * as ImagePicker from "expo-image-picker"
import { LinearGradient } from "expo-linear-gradient"
import { useEffect, useRef, useState, useContext } from "react"
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View
} from "react-native"
import Markdown from "react-native-markdown-display"
import { SafeAreaView } from "react-native-safe-area-context"
import Constants from 'expo-constants'
import Paywall from "./Paywall"
import { useTheme } from "../contexts/ThemeContext"
import AsyncStorage from '@react-native-async-storage/async-storage'
import { SubscriptionContext } from "@/contexts/SubscriptionContext"
import { ImageAnalysis } from "../utils/imageAnalysis"
import { supabase, SupabaseService } from "../utils/supabase"
// ...existing code...

interface Message {
  id: string
  type: "user" | "ai"
  text: string
  timestamp: number
  images?: string[]
  isStreaming?: boolean
  analysisData?: any
}

interface UserProfile {
  fitnessGoal: string
  fitnessLevel: string
  age: string
  weight: string
  targetWeight: string
  injuries: string[]
}

interface ProgressData {
  currentPhoto?: string
  previousPhoto?: string
  analysisResults?: any
  comparisonResults?: any
}

const { width: screenWidth, height: screenHeight } = Dimensions.get("window")

export default function AICoachScreen() {
  // Status for analysis and comparison
  const [statusMessage, setStatusMessage] = useState<string>("")
  const colorScheme = useColorScheme()
  const isDark = colorScheme === "dark"

  // Theme colors
  const { isDarkMode, theme } = useTheme()
  const subCtx = useContext(SubscriptionContext)
  const styles = getStyles(isDarkMode, theme, screenWidth)

  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [progressData, setProgressData] = useState<ProgressData>({})
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  // Trial UI state (no checkout)
  const [trialExpired, setTrialExpired] = useState(false)
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null)
  const TRIAL_DAYS = 7
  const [paywallDismissed, setPaywallDismissed] = useState(false)
  const [showCameraTip, setShowCameraTip] = useState(false)
  const [hasAnyPhoto, setHasAnyPhoto] = useState<boolean>(false)
  // ...existing code...

  const scrollViewRef = useRef<ScrollView>(null)
  const imageAnalysis = useRef(new ImageAnalysis())
  const streamingAnimation = useRef(new Animated.Value(0)).current

  useEffect(() => {
    initializeCoach();
    loadUserProfile();
    startStreamingAnimation();
    computeTrial();
    (async () => {
      try {
        const seen = await AsyncStorage.getItem('hasSeenCameraTip')
        if (seen !== 'true') setShowCameraTip(true)
      } catch {}
    })()
    // refresh the badge at next local midnight
    const now = new Date();
    const next = new Date(now); next.setHours(24,0,0,0);
    const t = setTimeout(() => computeTrial(), next.getTime() - now.getTime());
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    // Check if the user has any photos uploaded already
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.id) return;
        const { count } = await supabase
          .from('photos')
          .select('id', { head: true, count: 'exact' })
          .eq('user_id', user.id);
        setHasAnyPhoto((count ?? 0) > 0);
      } catch {}
    })();
  }, []);

  // Recompute trial badge when subscription state changes
  useEffect(() => {
    computeTrial();
    setPaywallDismissed(false)
  }, [subCtx?.isSubscribed])

  const computeTrial = async () => {
    try {
      const { data } = await supabase.auth.getUser();
      const createdAtISO = data?.user?.created_at;
      if (!createdAtISO) { setTrialExpired(true); setTrialDaysLeft(null); return; }
      const DAY = 24*60*60*1000;
      const start = new Date(createdAtISO); start.setHours(0,0,0,0);
      const today = new Date(); today.setHours(0,0,0,0);
      const diffDays = Math.floor((today.getTime() - start.getTime())/DAY);
      const left = Math.max(0, TRIAL_DAYS - diffDays);
      const trialEnd = new Date(start); trialEnd.setDate(trialEnd.getDate()+TRIAL_DAYS);
      const expired = today.getTime() >= trialEnd.getTime();
      // If user is subscribed, treat as not expired and hide badge
      if (subCtx?.isSubscribed) {
        setTrialExpired(false);
        setTrialDaysLeft(null);
      } else {
        setTrialExpired(expired);
        setTrialDaysLeft(left);
      }
    } catch {}
  }

  const startStreamingAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(streamingAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(streamingAnimation, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start()
  }  

  const initializeCoach = async () => {
    try {
      const welcomeMessage: Message = {
        id: "welcome",
        type: "ai",
        text: "🏋️‍♂️ Welcome to your AI Fitness Coach! I'm here to help you achieve your fitness goals through:\n\n• 📸 Advanced photo progress analysis using AI\n• 💪 Personalized workout recommendations\n• 🥗 Nutrition guidance\n• 📊 Real-time progress tracking\n\nUpload a progress photo or ask me anything about fitness!",
        timestamp: Date.now(),
        images: [],
      }

      setMessages([welcomeMessage])

      // Initialize TensorFlow.js
      await imageAnalysis.current.initialize()

      console.log("AI Coach initialized successfully")
    } catch (error) {
      console.error("AI Coach initialization failed:", error)
    }
  }

  const loadUserProfile = async () => {
    try {
      const profile = await SupabaseService.getUserProfile()
      if (profile) {
        setUserProfile({
          fitnessGoal: profile.fitness_goal || "",
          fitnessLevel: profile.fitness_level || "beginner",
          age: profile.age?.toString() || "",
          weight: profile.weight?.toString() || "",
          targetWeight: profile.target_weight?.toString() || "",
          injuries: profile.injuries || [],
        })
      }
    } catch (error) {
      console.error("Failed to load user profile:", error)
    }
  }

  const handleSendMessage = async () => {
    if (showPaywall) {
      try { setPaywallDismissed(false) } catch {}
      Alert.alert('Subscription required', 'Your free trial has ended. Subscribe to continue using the AI Coach.')
      return
    }
    const text = inputText.trim()
    if (!text || isTyping) return

    try {
      const userMessage: Message = {
        id: generateMessageId(),
        type: "user",
        text,
        timestamp: Date.now(),
        images: [],
      }

      setMessages((prev) => [...prev, userMessage])
      setInputText("")
      setIsStreaming(true)

      // Create streaming AI message placeholder
      const streamingMessage: Message = {
        id: generateMessageId(),
        type: "ai",
        text: "",
        timestamp: Date.now(),
        images: [],
        isStreaming: true,
      }

      setMessages((prev) => [...prev, streamingMessage])

      const payload = await preparePayload(text)
      await sendToAIWithStreaming(payload, streamingMessage.id)
    } catch (error) {
      console.error("Failed to send message:", error)
      setIsStreaming(false)

      const errorMessage: Message = {
        id: generateMessageId(),
        type: "ai",
        text: "I'm temporarily unavailable. Please try again in a moment. 🔄",
        timestamp: Date.now(),
        images: [],
      }

      setMessages((prev) => [...prev, errorMessage])
    }
  }

  const sendToAIWithStreaming = async (payload: any, messageId: string) => {
    try {
      console.log("Invoking Supabase Edge Function 'aicoach' with payload:", payload)
      const { data, error } = await supabase.functions.invoke("aicoach", {
        body: payload,
      })

      console.log("Supabase Edge Function 'aicoach' response - data:", data)
      console.log("Supabase Edge Function 'aicoach' response - error:", error)

      if (error) {
        console.error("Supabase function invocation error:", error)
        throw error
      }

      setIsStreaming(false)

      let responseText = ""
      if (typeof data === "string") {
        responseText = data
      } else if (data?.response) {
        responseText = data.response
      } else {
        responseText = "I received your message but couldn't generate a proper response. Please try again. 🤔"
      }

      // Simulate streaming effect
      await simulateStreamingText(responseText, messageId)
    } catch (error: any) {
      console.error("AI request failed:", error.message || error)
      setIsStreaming(false)
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                text:
                  (msg.text || "") +
                  `\n\nI'm temporarily unavailable. Please try again in a moment. 🔄 Error: ${error.message || "Unknown error"}`,
                isStreaming: false,
              }
            : msg,
        ),
      )
    }
  }

  const simulateStreamingText = async (fullText: string, messageId: string) => {
    const words = fullText.split(" ")
    let currentText = ""

    for (let i = 0; i < words.length; i++) {
      currentText += (i > 0 ? " " : "") + words[i]

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, text: currentText, isStreaming: i < words.length - 1 } : msg,
        ),
      )

      // Add delay for streaming effect
      await new Promise((resolve) => setTimeout(resolve, 50))
    }
  }

  const preparePayload = async (text: string) => {
    let enhancedText = text

    if (progressData.analysisResults) {
      enhancedText += `\n\nLatest Photo Analysis Results:\n${JSON.stringify(progressData.analysisResults, null, 2)}`
    }

    if (progressData.comparisonResults) {
      enhancedText += `\n\nProgress Comparison:\n${JSON.stringify(progressData.comparisonResults, null, 2)}`
    }

    if (userProfile?.fitnessGoal) {
      enhancedText += `\n\nUser's fitness goal: ${userProfile.fitnessGoal}`
    }
    if (userProfile?.fitnessLevel) {
      enhancedText += `\nFitness level: ${userProfile.fitnessLevel}`
    }

    const payload: RequestPayload = {
      text: enhancedText,
      streaming: false, // Frontend will simulate streaming from a complete response
    }

    if (userProfile) {
      payload.userProfile = {
        fitnessLevel: userProfile.fitnessLevel,
        age: parseInt(userProfile.age),
        injuries: userProfile.injuries,
      }
    }

    if (userProfile?.fitnessGoal) {
      payload.goal = userProfile.fitnessGoal
    }

    if (progressData.analysisResults) {
      payload.analysisData = progressData.analysisResults
    }

    return payload
  }

  const handlePhotoUpload = async () => {
    if (showPaywall) {
      try { setPaywallDismissed(false) } catch {}
      Alert.alert('Subscription required', 'Your free trial has ended. Subscribe to analyze photos.')
      return
    }
    try {
      console.log(" Starting photo upload process ===")

      console.log("Requesting media library permissions...")
      const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync()

      console.log("Requesting camera permissions...")
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync()

      console.log("Media library permission:", mediaStatus)
      console.log("Camera permission:", cameraStatus)

      if (mediaStatus !== "granted") {
        console.log("Media library permission denied")
        Alert.alert("Permission needed", "We need access to your photos to analyze your fitness progress.")
        return
      }

      console.log("Launching image picker with enhanced options...")
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
        allowsMultipleSelection: false,
        selectionLimit: 1,
        exif: false,
        base64: true, // Request base64 directly from ImagePicker
      })

      console.log("Image picker result:", {
        canceled: result.canceled,
        assetsLength: result.assets?.length,
        firstAsset: result.assets?.[0]
          ? {
              uri: result.assets[0].uri,
              width: result.assets[0].width,
              height: result.assets[0].height,
              fileSize: result.assets[0].fileSize,
              type: result.assets[0].type,
              hasBase64: !!result.assets[0].base64,
            }
          : null,
      })

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0]
        console.log("✓ Image selected successfully:", asset.uri)
        console.log("Image dimensions:", asset.width, "x", asset.height)
        console.log("File size:", asset.fileSize, "bytes")

        if (!asset.base64) {
          console.error("❌ No base64 data available from ImagePicker")
          Alert.alert("Upload Error", "Failed to process image data. Please try again.")
          return
        }

        setIsAnalyzing(true)

        try {
          console.log("Getting current user...")
          const user = await SupabaseService.getCurrentUser()
          if (!user) {
            console.log("❌ User not authenticated")
            Alert.alert("Authentication Error", "Please sign in to upload photos.")
            setIsAnalyzing(false)
            return
          }
          console.log("✓ User authenticated:", user.id)

          console.log("Fetching previous photos for comparison...")
          const { data: lastPhoto, error: fetchError } = await supabase
            .from("photos")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single()

          let previousPhotoUrl = null
          if (!fetchError && lastPhoto) {
            previousPhotoUrl = lastPhoto.url || SupabaseService.getPhotoUrl(lastPhoto.file_name)
            console.log("✓ Found previous photo for comparison:", previousPhotoUrl)
          } else {
            console.log("No previous photo found, this will be the first photo")
            if (fetchError && fetchError.code !== "PGRST116") {
              console.log("Previous photo fetch error:", fetchError)
            }
          }

          const fileName = `${user.id}/${Date.now()}_progress.jpg`
          console.log("Preparing file upload via Edge Function:", fileName)

          console.log("✓ Base64 data available from ImagePicker, length:", asset.base64.length)

          const uploadPayload = {
            userId: user.id,
            fileName,
            fileBase64: asset.base64,
            contentType: "image/jpeg",
          }

          console.log("Invoking upload-photo Edge Function with payload structure:", {
            userId: uploadPayload.userId,
            fileName: uploadPayload.fileName,
            contentType: uploadPayload.contentType,
            base64Length: uploadPayload.fileBase64.length,
          })

          const { data: uploadData, error: uploadError } = await supabase.functions.invoke("upload-photo", {
            body: uploadPayload,
          })

          if (uploadError) {
            console.error("❌ Upload-photo Edge Function error:", uploadError)
            throw new Error(`Edge Function upload failed: ${uploadError.message}`)
          }

          console.log("Edge Function response:", uploadData)

          if (!uploadData?.publicUrl) {
            console.error("❌ No public URL returned from Edge Function:", uploadData)
            throw new Error("Edge Function did not return a valid public URL")
          }

            const photoUrl = uploadData.publicUrl
            setStatusMessage("Starting image analysis...")
            const currentAnalysis = await imageAnalysis.current.analyzeSingleImage(asset.uri)
            setStatusMessage("")

          let comparisonAnalysis = null
          let progressMessage = ""

          if (previousPhotoUrl) {
            setStatusMessage("Performing progress comparison...")
            comparisonAnalysis = await imageAnalysis.current.compareImages(previousPhotoUrl, asset.uri)
            setStatusMessage("")

            progressMessage =
              `\n\n📊Progress Comparison Results\n` +
              `• Overall Progress Score: ${comparisonAnalysis.progressScore}/100\n` +
              `• Total Change: ${comparisonAnalysis.changePercentage}%\n` +
              `• Upper Body: ${comparisonAnalysis.regionAnalysis.upper.score}/100\n` +
              `• Core: ${comparisonAnalysis.regionAnalysis.middle.score}/100\n` +
              `• Lower Body: ${comparisonAnalysis.regionAnalysis.lower.score}/100\n\n` +
              `🎯Recommendations\n${comparisonAnalysis.recommendations.map((r) => `• ${r}`).join("\n")}`
          } else {
            progressMessage =
              "\n\n📸First Progress Photo\nThis is your baseline photo. Upload another photo later to see your progress comparison!"
          }

          // Update progress data with Edge Function photo URL
          setProgressData({
            previousPhoto: previousPhotoUrl,
            currentPhoto: photoUrl,
            analysisResults: currentAnalysis,
            comparisonResults: comparisonAnalysis,
          })

          const photoMessage =
            `📸New Progress Photo Analyzed\n\n` +
            `🔍Image Analysis\n` +
            `• Muscle Definition Score: ${currentAnalysis.muscleDefinitionScore.toFixed(1)}/100\n` +
            `• Image Quality: ${currentAnalysis.imageQuality.quality} (${currentAnalysis.imageQuality.score}/100)\n` +
            `• Lighting Quality: ${currentAnalysis.lightingQuality.quality}\n` +
            `• Edge Intensity: ${currentAnalysis.edgeIntensity.toFixed(3)}\n` +
            `• Contrast: ${currentAnalysis.contrast.toFixed(3)}` +
            progressMessage +
            `\n\nPlease provide personalized coaching advice based on these results! 💪`

          // Add user message with photo
          const userMessage: Message = {
            id: generateMessageId(),
            type: "user",
            text: "I uploaded a new progress photo for analysis! 📸",
            timestamp: Date.now(),
            images: [asset.uri],
            analysisData: { currentAnalysis, comparisonAnalysis },
          }

          setMessages((prev) => [...prev, userMessage])
          setIsAnalyzing(false)
          console.log("✓ Photo upload and analysis completed successfully")

          // Send analysis to AI coach with streaming
          const payload = await preparePayload(photoMessage)

          const streamingMessage: Message = {
            id: generateMessageId(),
            type: "ai",
            text: "",
            timestamp: Date.now(),
            images: [],
            isStreaming: true,
          }

          setMessages((prev) => [...prev, streamingMessage])
          await sendToAIWithStreaming(payload, streamingMessage.id)
        } catch (error) {
          console.error("❌ Photo analysis failed:", error)
          setIsAnalyzing(false)

          let errorMessage = "Failed to analyze photo. Please try again."
          if (error.message?.includes("fetch")) {
            errorMessage = "Failed to process the image file. Please try selecting a different photo."
          } else if (error.message?.includes("Edge Function")) {
            errorMessage = "Failed to upload photo via Edge Function. Please check your internet connection."
          } else if (error.message?.includes("Database")) {
            errorMessage = "Failed to save photo record. Please try again."
          }

          Alert.alert("Analysis Error", errorMessage)
        }
      } else {
        console.log("Image picker was canceled or no image selected")
      }
    } catch (error) {
      console.error("❌ Photo upload failed:", error)

      let errorMessage = "Failed to upload photo. Please try again."
      if (error.message?.includes("permission")) {
        errorMessage = "Camera or photo library permission denied. Please enable permissions in Settings."
      } else if (error.message?.includes("picker")) {
        errorMessage = "Failed to open image picker. Please restart the app and try again."
      }

      Alert.alert("Upload Error", errorMessage)
    }
  }

  const generateMessageId = (): string => {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const renderMessage = (message: Message) => {
    const isUser = message.type === "user"

    return (
      <View key={message.id} style={[styles.messageContainer, isUser ? styles.userMessage : styles.aiMessage]}>
        <View
          style={[
            styles.messageBubble,
            {
              backgroundColor: isUser ? theme.colors.primary : theme.colors.surface,
            },
          ]}
        >
          {message.text ? (
            isUser ? (
              <Text
                style={[
                  styles.messageText,
                  {
                    color: theme.colors.background,
                  },
                ]}
              >
                {message.text}
              </Text>
            ) : (
              <Markdown
                style={{
                  body: {
                    color: theme.colors.text,
                    fontSize: 15,
                    lineHeight: 22,
                  },
                  heading1: { color: theme.colors.text, fontSize: 20, fontWeight: "bold", marginBottom: 6 },
                  heading2: { color: theme.colors.text, fontSize: 18, fontWeight: "bold", marginBottom: 4 },
                  bullet_list: { marginVertical: 6 },
                  list_item: { color: theme.colors.text },
                  strong: { fontWeight: "700" },
                  paragraph: { marginTop: 4, marginBottom: 8 },
                  code_inline: { backgroundColor: theme.colors.card, color: theme.colors.text },
                  link: { color: theme.colors.primary },
                }}
              >
                {message.text}
              </Markdown>
            )
          ) : null}

          {/* Render all numerical analysis data if available */}
          {message.analysisData && (
            <View style={{ marginTop: 8 }}>
              {Object.entries(message.analysisData).map(([key, value]) => {
                // Only render if value is a number or a simple object with numbers
                if (typeof value === "number") {
                  return (
                    <Text key={key} style={{ fontSize: 13, color: isUser ? "#333" : "#007AFF" }}>
                      {key}: {value}
                    </Text>
                  )
                }
                if (typeof value === "object" && value !== null) {
                  return Object.entries(value)
                    .filter(([k, v]) => typeof v === "number")
                    .map(([k, v]) => (
                      <Text key={key + k} style={{ fontSize: 13, color: isUser ? "#333" : "#007AFF" }}>
                        {key} - {k}: {v}
                      </Text>
                    ))
                }
                return null
              })}
            </View>
          )}

          {message.isStreaming && (
            <Animated.View
              style={[
                styles.streamingIndicator,
                {
                  opacity: streamingAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 1],
                  }),
                },
              ]}
            >
              <ActivityIndicator size="small" color={isDark ? "#64FFDA" : "#007AFF"} />
              <Text style={styles.streamingText}>AI is thinking...</Text>
            </Animated.View>
          )}

          <Text style={styles.timestamp}>{formatTimestamp(message.timestamp)}</Text>
        </View>
      </View>
    )
  }

  // Determine if paywall should be shown (trial ended and not subscribed)
  const disablePaywall = (Constants?.expoConfig as any)?.extra?.EXPO_PUBLIC_DISABLE_PAYWALL === 'true' || process.env.EXPO_PUBLIC_DISABLE_PAYWALL === 'true'
  const allowDismiss = (Constants?.expoConfig as any)?.extra?.EXPO_PUBLIC_ALLOW_PAYWALL_DISMISS === 'true' || process.env.EXPO_PUBLIC_ALLOW_PAYWALL_DISMISS === 'true'
  const showPaywall = !disablePaywall && trialExpired && !(subCtx?.isSubscribed)
  const paywallVisible = showPaywall && !(allowDismiss && paywallDismissed)

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        {/* Payment and trial overlays removed */}

        {statusMessage ? (
          <View style={{ padding: 12, backgroundColor: theme.colors.card, borderRadius: 10, margin: 10, marginTop: 60 }}>
            <Text style={{ color: theme.colors.primary, fontWeight: 'bold', fontSize: 15 }}>{statusMessage}</Text>
          </View>
        ) : null}
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

        <LinearGradient
          colors={isDarkMode ? [theme.colors.background, theme.colors.background] : ["#fff", "#fff"]}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
              style={[styles.headerTitle, { color: isDarkMode ? theme.colors.text : theme.colors.primary }]}
            >
              AI Fitness Coach
            </Text>
          </View>
          <View style={styles.headerMetaRow}>
            {!trialExpired && trialDaysLeft !== null && (
              <View style={[styles.trialPill, isDarkMode ? { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.18)' } : { backgroundColor: '#E6F0FF', borderColor: theme.colors.primary } ]}>
                <Ionicons name="time-outline" size={14} color={isDarkMode ? theme.colors.text : theme.colors.primary} />
                <Text style={[styles.trialPillText, { color: isDarkMode ? theme.colors.text : theme.colors.primary }]}>
                  Trial: {trialDaysLeft} day{trialDaysLeft === 1 ? '' : 's'} left
                </Text>
              </View>
            )}
            <View style={[styles.statusBadge, isDarkMode ? { backgroundColor: 'rgba(255,255,255,0.10)', borderColor: 'rgba(255,255,255,0.18)', borderWidth: 1 } : { backgroundColor: theme.colors.accent } ]}>
              <View style={[styles.statusDot, { backgroundColor: isDarkMode ? '#22C55E' : theme.colors.primary }]} />
              <Text style={[styles.statusText, { color: isDarkMode ? theme.colors.text : theme.colors.primary }]}>Online</Text>
            </View>
          </View>

          {progressData.currentPhoto && (
            <View style={styles.progressIndicator}>
              <Ionicons name="trending-up" size={16} color="white" />
              <Text style={styles.progressText}>
                {progressData.comparisonResults
                  ? `Progress Score: ${progressData.comparisonResults.progressScore}/100`
                  : "Ready for comparison"}
              </Text>
            </View>
          )}
        </LinearGradient>

        <ScrollView
          ref={scrollViewRef}
          style={[styles.messagesContainer, { minHeight: 0, flexGrow: 1, backgroundColor: isDarkMode ? theme.colors.background : theme.colors.card }]}
          contentContainerStyle={[styles.messagesContent, { paddingBottom: 140, minHeight: 0, flexGrow: 1 }]}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        >
          {!hasAnyPhoto && !paywallVisible && (
            <View style={{ margin: 14, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: isDarkMode ? theme.colors.surface : '#F8FAFF' }}>
              <Text style={{ fontWeight: '700', color: theme.colors.text, marginBottom: 6 }}>Upload a progress photo</Text>
              <Text style={{ color: theme.colors.subtitle, marginBottom: 10 }}>
                The AI Coach gives the best guidance when you upload a progress photo. Tap below to add your first photo.
              </Text>
              <TouchableOpacity onPress={handlePhotoUpload} style={{ alignSelf: 'flex-start', backgroundColor: theme.colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 }}>
                <Text style={{ color: theme.colors.background, fontWeight: '700' }}>Upload Photo</Text>
              </TouchableOpacity>
            </View>
          )}
          {messages.map((message) => (
            <View key={message.id} style={[styles.messageContainer, message.type === "user" ? styles.userMessage : styles.aiMessage]}>
              <View
                style={[
                  styles.messageBubble,
                  {
                    backgroundColor: message.type === "user"
                      ? (isDarkMode ? theme.colors.primary : theme.colors.primary)
                      : (isDarkMode ? theme.colors.surface : theme.colors.card),
                    minHeight: undefined, // Remove forced minHeight
                    maxHeight: undefined, // Remove forced maxHeight
                  },
                ]}
              >
                {message.text ? (
                  message.type === "user" ? (
                    <Text
                      style={[
                        styles.messageText,
                        { color: isDarkMode ? theme.colors.background : theme.colors.background },
                      ]}
                    >
                      {message.text}
                    </Text>
                  ) : (
                    <Markdown
                      style={{
                        body: { color: theme.colors.text, fontSize: 15, lineHeight: 22 },
                        heading1: { color: theme.colors.text, fontSize: 20, fontWeight: "bold", marginBottom: 6 },
                        heading2: { color: theme.colors.text, fontSize: 18, fontWeight: "bold", marginBottom: 4 },
                        bullet_list: { marginVertical: 6 },
                        list_item: { color: theme.colors.text },
                        strong: { fontWeight: "700" },
                        paragraph: { marginTop: 4, marginBottom: 8 },
                        code_inline: { backgroundColor: theme.colors.card, color: theme.colors.text },
                        link: { color: theme.colors.primary },
                      }}
                    >
                      {message.text}
                    </Markdown>
                  )
                ) : null}
                {/* ...existing code for analysisData, streaming, timestamp... */}
              </View>
            </View>
          ))}

          {isAnalyzing && (
            <View style={styles.analyzingContainer}>
              <View style={styles.analyzingBubble}>
                <ActivityIndicator size="small" color={isDark ? "#64FFDA" : "#007AFF"} />
                <Text style={styles.analyzingText}>Analyzing your photo with AI... 🔍</Text>
              </View>
            </View>
          )}

          {isStreaming || isAnalyzing ? (
            <View style={{ alignItems: 'center', marginTop: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.card, borderRadius: 16, padding: 10 }}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={{ marginLeft: 10, color: theme.colors.text, fontWeight: 'bold' }}>
                  {isAnalyzing ? 'AI is analyzing your photo...' : 'AI is thinking...'}
                </Text>
              </View>
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.inputContainer}>
          <View style={styles.inputRow}>
            <TouchableOpacity
              style={[styles.photoButton, { backgroundColor: isDarkMode ? theme.colors.surface : theme.colors.card }]}
              onPress={handlePhotoUpload}
            >
              <Ionicons name="camera" size={24} color={isDarkMode ? theme.colors.primary : theme.colors.accent} />
            </TouchableOpacity>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: isDarkMode ? theme.colors.surface : theme.colors.background,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                  fontSize: 15,
                  minHeight: 36,
                  maxHeight: 60,
                  paddingVertical: 6,
                },
              ]}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask about training, nutrition, or upload a photo..."
              placeholderTextColor={isDarkMode ? theme.colors.textSecondary : theme.colors.subtitle}
              multiline
              maxLength={2000}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                { backgroundColor: isDarkMode ? theme.colors.primary : theme.colors.accent },
                (!inputText.trim() || isStreaming) && styles.sendButtonDisabled,
              ]}
              onPress={handleSendMessage}
              disabled={!inputText.trim() || isStreaming}
            >
              <Ionicons name="send" size={20} color={isDarkMode ? theme.colors.background : theme.colors.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.quickActions}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {quickActionButtons(handlePhotoUpload).map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.quickActionButton,
                    {
                      backgroundColor: isDarkMode ? theme.colors.surface : theme.colors.card,
                      borderColor: theme.colors.border,
                    },
                  ]}
                  onPress={() => {
                    if (action.onPress) { action.onPress(); }
                    else if (action.text) { setInputText(action.text); }
                  }}
                >
                  <Text
                    style={[
                      styles.quickActionText,
                      {
                        color: isDarkMode ? theme.colors.primary : theme.colors.primary,
                      },
                    ]}
                  >
                    {action.icon} {action.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
        {/* One-time onboarding nudge to upload a photo */}
        {showCameraTip && !paywallVisible && (
          <View style={{ position: 'absolute', bottom: 140, left: 16, right: 16, alignItems: 'center' }}>
            <View style={{ backgroundColor: theme.colors.card, borderColor: theme.colors.border, borderWidth: 1, padding: 12, borderRadius: 12 }}>
              <Text style={{ color: theme.colors.text, fontWeight: '600', textAlign: 'center' }}>
                Tip: Tap the camera to upload a progress photo for AI analysis.
              </Text>
              <TouchableOpacity
                onPress={async () => { setShowCameraTip(false); try { await AsyncStorage.setItem('hasSeenCameraTip', 'true') } catch {} }}
                style={{ marginTop: 8, alignSelf: 'center' }}
              >
                <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>Got it</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        <Paywall
          visible={paywallVisible}
          priceText={(subCtx?.monthly?.price ? `${subCtx.monthly.price}/month` : "$4.99/month")}
          purchasing={!!subCtx?.purchasing}
          onPurchase={() => subCtx?.purchaseMonthly?.()}
          onRestore={() => subCtx?.restore?.()}
          onClose={allowDismiss ? () => setPaywallDismissed(true) : undefined}
        />
      </SafeAreaView>
    </KeyboardAvoidingView>
  )
}

type QuickAction = { icon: string; label: string; text?: string; onPress?: () => void }
const quickActionButtons = (onUpload: () => void): QuickAction[] => [
  { icon: "📸", label: "Upload Photo", onPress: onUpload },
  { icon: "💪", label: "Weekly Plan", text: "Create my weekly workout plan" },
  { icon: "🥗", label: "Nutrition", text: "What should I eat for my goals?" },
  { icon: "📊", label: "Progress", text: "Analyze my fitness progress" },
  { icon: "🏃‍♂️", label: "Cardio", text: "Best cardio for fat loss?" },
  { icon: "🎯", label: "Form Check", text: "How can I improve my form?" },
  { icon: "💤", label: "Recovery", text: "Recovery and rest day advice" },
]

const getStyles = (isDarkMode: boolean, theme: any, screenWidth: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    // ...existing code...
    header: {
      paddingHorizontal: 20,
      paddingTop: 60,
      paddingBottom: 20,
    },
    headerContent: {
      flexDirection: "row",
      justifyContent: "flex-start",
      alignItems: "flex-end",
    },
    headerMetaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 8,
      marginTop: 6,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: "bold",
      color: theme.colors.text,
      // Remove shadow in dark mode
      textShadowColor: isDarkMode ? 'transparent' : theme.colors.border,
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 0,
      flexShrink: 1,
    },
    trialPill: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      borderWidth: 1,
      marginRight: 6,
    },
    trialPillText: {
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 6,
    },
    statusBadge: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: theme.colors.accent,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.primary,
      marginRight: 6,
    },
    statusText: {
      color: theme.colors.primary,
      fontSize: 12,
      fontWeight: "600",
    },
    progressIndicator: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 10,
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      alignSelf: "flex-start",
    },
    progressText: {
      color: theme.colors.text,
      fontSize: 12,
      marginLeft: 6,
      fontWeight: "500",
    },
    messagesContainer: {
      flex: 1,
      backgroundColor: theme.colors.card,
      borderTopLeftRadius: 25,
      borderTopRightRadius: 25,
    },
    messagesContent: {
      padding: 20,
      paddingBottom: 80, // Match inputContainer height to prevent overlap
    },
    messageContainer: {
      marginBottom: 16,
    },
    userMessage: {
      alignItems: "flex-end",
    },
    aiMessage: {
      alignItems: "flex-start",
    },
    messageBubble: {
      maxWidth: screenWidth * 0.8,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 16,
      shadowColor: isDarkMode ? 'transparent' : theme.colors.border,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDarkMode ? 0 : 0.08,
      shadowRadius: isDarkMode ? 0 : 3,
      elevation: isDarkMode ? 0 : 2,
      backgroundColor: theme.colors.card,
    },
    messageText: {
      fontSize: 14,
      lineHeight: 18,
      color: theme.colors.text,
    },
    timestamp: {
      fontSize: 12,
      color: theme.colors.subtitle,
      marginTop: 6,
    },
    streamingIndicator: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 8,
    },
    streamingText: {
      marginLeft: 8,
      color: theme.colors.subtitle,
      fontSize: 14,
      fontStyle: "italic",
    },
    analyzingContainer: {
      alignItems: "flex-start",
      marginBottom: 16,
    },
    analyzingBubble: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.card,
      padding: 12,
      borderRadius: 20,
      borderBottomLeftRadius: 4,
    },
    analyzingText: {
      marginLeft: 8,
      color: theme.colors.text,
      fontSize: 14,
      fontWeight: "500",
    },
    inputContainer: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: isDarkMode ? theme.colors.background : theme.colors.card,
      paddingHorizontal: 12,
      paddingVertical: 10,
      paddingBottom: 16,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      shadowColor: isDarkMode ? 'transparent' : theme.colors.border,
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: isDarkMode ? 0 : 0.07,
      shadowRadius: isDarkMode ? 0 : 8,
      elevation: isDarkMode ? 0 : 6,
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      marginBottom: 12,
    },
    photoButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
      shadowColor: theme.colors.border,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      backgroundColor: theme.colors.card,
    },
    textInput: {
      flex: 1,
      borderWidth: 1,
      borderRadius: 18,
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 15,
      maxHeight: 80,
      backgroundColor: theme.colors.background,
      color: theme.colors.text,
      borderColor: theme.colors.border,
    },
    sendButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: "center",
      alignItems: "center",
      marginLeft: 12,
      shadowColor: theme.colors.border,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
      backgroundColor: theme.colors.accent,
    },
    sendButtonDisabled: {
      opacity: 0.5,
    },
    quickActions: {
      height: 44,
    },
    quickActionButton: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 22,
      marginRight: 8,
      borderWidth: 1,
      shadowColor: theme.colors.border,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
      backgroundColor: theme.colors.card,
      borderColor: theme.colors.border,
    },
    quickActionText: {
      fontSize: 14,
      fontWeight: "500",
      color: theme.colors.primary,
    },
  })
