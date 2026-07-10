"use client"

import { Ionicons } from "@expo/vector-icons"
import * as ImagePicker from "expo-image-picker"
import { LinearGradient } from "expo-linear-gradient"
import { useEffect, useRef, useState, useContext } from "react"
import {
  ActivityIndicator,
  Alert,
  ActionSheetIOS,
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
import ProgressCamera from "./ProgressCamera"
import { supabase, SupabaseService } from "../utils/supabase"

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
  const streamingAnimation = useRef(new Animated.Value(0)).current
  const [progressCameraVisible, setProgressCameraVisible] = useState(false)
  const [ghostUri, setGhostUri] = useState<string | null>(null)
  const USAGE_KEY = "aicoach_usage_v1"
  const DAILY_CHAT_LIMIT = 10
  const DAILY_PHOTO_LIMIT = 3

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
    } catch (error) {
      console.error("AI Coach initialization failed:", error)
    }
  }

  type UsageCounters = {
    date: string
    chat: number
    photo: number
  }

  const loadUsage = async (): Promise<UsageCounters> => {
    try {
      const raw = await AsyncStorage.getItem(USAGE_KEY)
      const today = new Date().toISOString().slice(0, 10)
      if (!raw) {
        return { date: today, chat: 0, photo: 0 }
      }
      const parsed = JSON.parse(raw) as UsageCounters
      if (parsed.date !== today) {
        return { date: today, chat: 0, photo: 0 }
      }
      return parsed
    } catch {
      const today = new Date().toISOString().slice(0, 10)
      return { date: today, chat: 0, photo: 0 }
    }
  }

  const saveUsage = async (usage: UsageCounters) => {
    try {
      await AsyncStorage.setItem(USAGE_KEY, JSON.stringify(usage))
    } catch {
      // ignore
    }
  }

  const checkAndIncrementUsage = async (kind: "chat" | "photo"): Promise<boolean> => {
    // Subscribed users and disabled paywall builds are unlimited
    if (subCtx?.isSubscribed) return true
    const usage = await loadUsage()
    const limit = kind === "chat" ? DAILY_CHAT_LIMIT : DAILY_PHOTO_LIMIT
    const current = kind === "chat" ? usage.chat : usage.photo
    if (current >= limit) {
      return false
    }
    const next: UsageCounters =
      kind === "chat"
        ? { ...usage, chat: current + 1 }
        : { ...usage, photo: current + 1 }
    await saveUsage(next)
    return true
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

    const allowed = await checkAndIncrementUsage("chat")
    if (!allowed) {
      Alert.alert(
        "Daily chat limit reached",
        `You’ve reached the free daily limit of ${DAILY_CHAT_LIMIT} AI messages. Subscribe to CaptureFit Pro for unlimited chats.`
      )
      return
    }

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
      const { data, error } = await supabase.functions.invoke("aicoach", {
        body: payload,
      })

      if (error) throw error

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
    } catch (error) {
      console.error("AI request failed:", error)
      setIsStreaming(false)
      throw error
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

    // Build conversation history from recent messages (last 10)
    const conversationHistory = messages.slice(-10).map(msg => ({
      role: msg.type === "user" ? "user" : "assistant",
      content: msg.text
    }))

    return {
      text: enhancedText,
      goal: userProfile?.fitnessGoal || "",
      userProfile: {
        fitnessLevel: userProfile?.fitnessLevel || "beginner",
        age: userProfile?.age ? Number.parseInt(userProfile.age) : undefined,
        injuries: userProfile?.injuries || [],
      },
      conversationHistory, // Add conversation memory
    }
  }

  const pickFromLibrary = async () => {
    return ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
      allowsMultipleSelection: false,
      selectionLimit: 1,
      exif: false,
      base64: true,
    })
  }

  const pickFromCamera = async () => {
    return ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
      base64: true,
    })
  }

  // Fetch the latest photo (for the ghost overlay) and open the progress camera
  const openProgressCamera = async () => {
    try {
      const user = await SupabaseService.getCurrentUser()
      if (user) {
        const { data: lastPhoto } = await supabase
          .from("photos")
          .select("url")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
        setGhostUri(lastPhoto?.url || null)
      } else {
        setGhostUri(null)
      }
    } catch {
      setGhostUri(null)
    }
    setProgressCameraVisible(true)
  }

  // Upload a captured/picked photo, then have the coach analyze the actual
  // image (with the previous photo as a labeled baseline when one exists).
  const processProgressPhoto = async (asset: { uri: string; base64?: string | null }) => {
    if (!asset.base64) {
      Alert.alert("Upload Error", "Failed to process image data. Please try again.")
      return
    }

    setIsAnalyzing(true)
    try {
      const user = await SupabaseService.getCurrentUser()
      if (!user) {
        Alert.alert("Authentication Error", "Please sign in to upload photos.")
        setIsAnalyzing(false)
        return
      }

      // Previous photo becomes the comparison baseline for the AI
      const { data: lastPhoto } = await supabase
        .from("photos")
        .select("url")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
      const previousPhotoUrl: string | null = lastPhoto?.url || null

      setStatusMessage("Uploading photo...")
      const { data: uploadData, error: uploadError } = await supabase.functions.invoke("upload-photo", {
        body: {
          fileName: `${Date.now()}_progress.jpg`,
          fileBase64: asset.base64,
          contentType: "image/jpeg",
        },
      })
      if (uploadError) throw new Error(`Edge Function upload failed: ${uploadError.message}`)
      if (!uploadData?.publicUrl) throw new Error("Edge Function did not return a valid public URL")
      const photoUrl = uploadData.publicUrl as string
      setStatusMessage("")

      setProgressData({
        previousPhoto: previousPhotoUrl || undefined,
        currentPhoto: photoUrl,
      })

      const userMessage: Message = {
        id: generateMessageId(),
        type: "user",
        text: "I uploaded a new progress photo for analysis! 📸",
        timestamp: Date.now(),
        images: [asset.uri],
      }
      setMessages((prev) => [...prev, userMessage])
      setIsAnalyzing(false)

      const photoPrompt = previousPhotoUrl
        ? "I just uploaded a new progress photo. Compare it with my previous photo and give me honest, specific feedback on what changed and what to focus on next. 💪"
        : "I just uploaded my first progress photo — my baseline. Assess my starting point and tell me what to focus on. 💪"

      const payload = {
        ...(await preparePayload(photoPrompt)),
        imageUrl: photoUrl,
        previousImageUrl: previousPhotoUrl || undefined,
      }

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
      setStatusMessage("")

      let errorMessage = "Failed to analyze photo. Please try again."
      if ((error as Error)?.message?.includes("Edge Function")) {
        errorMessage = "Failed to upload photo. Please check your internet connection."
      }
      Alert.alert("Analysis Error", errorMessage)
    }
  }

  const handlePhotoUpload = async () => {
    if (showPaywall) {
      try { setPaywallDismissed(false) } catch {}
      Alert.alert('Subscription required', 'Your free trial has ended. Subscribe to analyze photos.')
      return
    }
    const allowed = await checkAndIncrementUsage("photo")
    if (!allowed) {
      Alert.alert(
        "Daily photo limit reached",
        `You’ve reached the free daily limit of ${DAILY_PHOTO_LIMIT} photo analyses. Subscribe to CaptureFit Pro for unlimited photo insights.`
      )
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

      // Let the user choose Camera or Library
      let result: ImagePicker.ImagePickerResult
      if (Platform.OS === 'ios') {
        const idx = await new Promise<number>((resolve) => {
          ActionSheetIOS.showActionSheetWithOptions(
            {
              options: ['Take Photo', 'Choose from Library', 'Cancel'],
              cancelButtonIndex: 2,
              userInterfaceStyle: isDarkMode ? 'dark' : 'light',
            },
            (buttonIndex) => resolve(buttonIndex),
          )
        })
        if (idx === 2) { console.log('Picker cancelled from action sheet'); return }
        if (idx === 0) { await openProgressCamera(); return }
        result = await pickFromLibrary()
      } else {
        // Simple Alert for Android and other platforms
        const choice = await new Promise<'camera' | 'library' | 'cancel'>((resolve) => {
          Alert.alert('Add Photo', 'Choose a source', [
            { text: 'Take Photo', onPress: () => resolve('camera') },
            { text: 'Choose from Library', onPress: () => resolve('library') },
            { text: 'Cancel', onPress: () => resolve('cancel'), style: 'cancel' },
          ])
        })
        if (choice === 'cancel') { console.log('Picker cancelled'); return }
        if (choice === 'camera') { await openProgressCamera(); return }
        result = await pickFromLibrary()
      }

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
        await processProgressPhoto(result.assets[0])
      } else {
        console.log("Image picker was canceled or no image selected")
      }
    } catch (error) {
      console.error("❌ Photo upload failed:", error)

      let errorMessage = "Failed to upload photo. Please try again."
      if ((error as Error)?.message?.includes("permission")) {
        errorMessage = "Camera or photo library permission denied. Please enable permissions in Settings."
      } else if ((error as Error)?.message?.includes("picker")) {
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
          {!subCtx?.isSubscribed && !showPaywall && (
            <View style={{ marginHorizontal: 14, marginTop: 4, marginBottom: 8 }}>
              <Text style={{ fontSize: 13, color: theme.colors.subtitle }}>
                Pro unlocks unlimited AI chats and deeper photo insights.{" "}
                <Text
                  style={{ color: theme.colors.primary, fontWeight: "600" }}
                  onPress={() => {
                    try { setPaywallDismissed(false) } catch {}
                    if (!trialExpired) {
                      // let trial run; user will see paywall once it ends
                      return
                    }
                  }}
                >
                  Learn more
                </Text>
              </Text>
            </View>
          )}
          {!hasAnyPhoto && !paywallVisible && (
            <View style={{ margin: 14, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: isDarkMode ? theme.colors.surface : '#F8FAFF' }}>
              <Text style={{ fontWeight: '700', color: theme.colors.text, marginBottom: 6 }}>Upload your first progress photo</Text>
              <Text style={{ color: theme.colors.subtitle, marginBottom: 10 }}>
                Add a photo so the AI Coach can measure things like muscle definition, image quality and lighting, and then compare future photos to show your progress score and give targeted advice.
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
        <ProgressCamera
          visible={progressCameraVisible}
          ghostUri={ghostUri}
          onClose={() => setProgressCameraVisible(false)}
          onCapture={(a) => {
            setProgressCameraVisible(false)
            processProgressPhoto(a)
          }}
        />
        <Paywall
          visible={paywallVisible}
          priceText={(subCtx?.monthly?.price ? `${subCtx.monthly.price}/month` : "$4.99/month")}
          annualPriceText={subCtx?.annual?.price ? `${subCtx.annual.price}/year` : undefined}
          purchasing={!!subCtx?.purchasing}
          onPurchase={() => subCtx?.purchaseMonthly?.()}
          onPurchaseAnnual={subCtx?.annual ? () => subCtx?.purchaseAnnual?.() : undefined}
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
  {
    icon: "💪",
    label: "3‑Day Plan",
    text:
      "Create a 3‑day per week full‑body workout plan based on my current goal and fitness level. Use only bodyweight and dumbbells and keep each session under 45 minutes.",
  },
  {
    icon: "🏋️‍♀️",
    label: "Home Plan",
    text:
      "Design a 4‑week home workout plan I can follow with minimal equipment (dumbbells and a chair). Include 3 sessions per week with warm‑up suggestions.",
  },
  { icon: "🥗", label: "Nutrition", text: "What should I eat for my goals?" },
  { icon: "📊", label: "Progress", text: "Analyze my fitness progress" },
  { icon: "🎯", label: "Form Check", text: "How can I improve my form?" },
  { icon: "💤", label: "Recovery", text: "Recovery and rest day advice" },
]

const getStyles = (isDarkMode: boolean, theme: any, screenWidth: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
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
