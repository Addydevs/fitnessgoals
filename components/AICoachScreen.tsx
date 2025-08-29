"use client"

import { Colors } from "@/constants/Colors"
import { useTheme } from "@/contexts/ThemeContext"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as FileSystem from "expo-file-system"
import * as ImagePicker from "expo-image-picker"
import { LinearGradient } from "expo-linear-gradient"
import { useLocalSearchParams } from "expo-router"
import React, { useCallback, useMemo, useRef, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { PhotoContext } from "../app/(tabs)/_layout"
import { supabase } from "../utils/supabase"

type Sender = "ai" | "user"

type Message = {
  id: string
  type: Sender
  text: string
  ts: number
  imageUris?: string[]
}

const SUGGESTIONS_BASE = [
  "What should I do this week?",
  "Analyze my latest photos",
  "Why did my weight stall?",
  "Give me a 20‑min workout",
]

const SUPABASE_URL = "https://vpnitpweduycfmndmxsf.supabase.co"

const AICoachScreen: React.FC = () => {
  const { photoUri } = useLocalSearchParams()
  const { isDarkMode: isDark, theme: navTheme } = useTheme()
  const palette = isDark ? Colors.dark : Colors.light
  const { setPhotos } = React.useContext(PhotoContext)

  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "m1",
      type: "ai",
      text: "Hey, I’m your AI Coach. Upload progress photos or ask me anything—training, nutrition, or recovery. Let’s lock in your next win.",
      ts: Date.now(),
    },
  ])
  const [quickLoading, setQuickLoading] = useState<string | null>(null)

  // Animated send scale
  const sendScale = useRef(new Animated.Value(1)).current
  const bumpSend = useCallback(() => {
    Animated.sequence([
      Animated.timing(sendScale, { toValue: 0.9, duration: 70, useNativeDriver: true }),
      Animated.spring(sendScale, { toValue: 1, useNativeDriver: true, bounciness: 14 }),
    ]).start()
  }, [sendScale])

  const ui = useMemo(
    () => ({
      bg: navTheme.colors.background,
      card: navTheme.colors.card,
      text: navTheme.colors.text,
      sub: palette.textSecondary,
      stroke: navTheme.colors.border,
      userBubble: isDark ? ["#2563eb", "#0ea5e9"] : ["#0ea5e9", "#22d3ee"],
      aiBubble: navTheme.colors.card,
      inputBg: isDark ? "#0F172A" : "#F1F5F9",
      chipBg: isDark ? "rgba(255,255,255,0.06)" : palette.surface,
      primary: palette.primary,
      success: palette.success,
      quickIconBg: isDark ? "rgba(14,165,233,0.12)" : "#ECFEFF",
    }),
    [isDark, navTheme, palette],
  )

  const formatAIResponse = (text: string): string => {
    if (!text) return text

    // Remove any JSON formatting artifacts
    let formatted = text.replace(/^\{.*?\}$/, (match) => {
      try {
        const parsed = JSON.parse(match)
        return parsed.content || parsed.text || parsed.message || match
      } catch {
        return match
      }
    })

    // Format different types of content
    formatted = formatted
      // Format headers with emojis (make them bold-looking with spacing)
      .replace(/^(.*[🏋️💪🎯📊🔥⭐️✨🌟💯🚀].*?)$/gmu, "\n$1\n")
      // Format bullet points with proper spacing
      .replace(/^[•·▪️▫️]\s*/gm, "  • ")
      // Format numbered lists
      .replace(/^(\d+\.)\s*/gm, "$1 ")
      // Format metrics and percentages (highlight important numbers)
      .replace(/(\d+(?:\.\d+)?%)/g, "📈 $1")
      .replace(/(\d+(?:\.\d+)?\s*(?:lbs?|kg|calories|reps|sets))/gi, "💪 $1")
      // Add spacing around sections
      .replace(/\n\n+/g, "\n\n")
      // Clean up extra whitespace
      .trim()

    return formatted
  }

  const addMessage = useCallback((text: string, type: Sender, imageUris?: string[]) => {
    const formattedText = type === "ai" ? formatAIResponse(text) : text
    const msg: Message = { id: `${Date.now()}-${Math.random()}`, type, text: formattedText, ts: Date.now(), imageUris }
    setMessages((prev) => [msg, ...prev])
  }, [])

  const sendPromptToBackend = useCallback(
    async (prompt: string, imageUris?: string[]) => {
      addMessage(prompt, "user", imageUris)
      setIsTyping(true)
      try {
        // Log full session
        const session = await supabase.auth.getSession()
        console.log("Session:", JSON.stringify(session, null, 2))

        // Refresh session
        const { error: refreshError } = await supabase.auth.refreshSession()
        if (refreshError) {
          console.error("Session refresh error:", JSON.stringify(refreshError, null, 2))
          setIsTyping(false)
          addMessage("Please log in again to continue.", "ai")
          return
        }

        const { data: sessionData } = await supabase.auth.getSession()
        const accessToken = sessionData?.session?.access_token

        if (!accessToken) {
          console.error("No access token found")
          setIsTyping(false)
          addMessage("Please log in again to continue.", "ai")
          return
        }

        const userGoal = (await AsyncStorage.getItem("fitnessGoal")) || ""
        const userProfile = {
          fitnessLevel: (await AsyncStorage.getItem("fitnessLevel")) || "beginner",
          injuries: JSON.parse((await AsyncStorage.getItem("injuries")) || "[]"),
          age: Number.parseInt((await AsyncStorage.getItem("age")) || "0") || undefined,
        }
        const payload = { text: prompt, imageUrls: imageUris, goal: userGoal, userProfile }

        console.log("Invoking aicoach with payload:", JSON.stringify(payload, null, 2))
        console.log("Access token:", accessToken.slice(0, 10) + "...")

        try {
          const response = await fetch(`${SUPABASE_URL}/functions/v1/aicoach`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
              Accept: "text/event-stream", // Request streaming
            },
            body: JSON.stringify(payload),
          })

          console.log("Streaming response status:", response.status, "Headers:", Object.fromEntries(response.headers))

          if (response.ok && response.headers.get("content-type")?.includes("text/event-stream")) {
            // Handle streaming response with XMLHttpRequest for React Native compatibility
            return new Promise<void>((resolve) => {
              const xhr = new XMLHttpRequest()
              xhr.open("POST", `${SUPABASE_URL}/functions/v1/aicoach`)
              xhr.setRequestHeader("Content-Type", "application/json")
              xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`)
              xhr.setRequestHeader("Accept", "text/event-stream")

              let streamingMessage = ""
              const currentMessageId = `${Date.now()}-${Math.random()}`
              let lastProcessedLength = 0

              // Add initial empty message for streaming
              const initialMsg: Message = {
                id: currentMessageId,
                type: "ai",
                text: "",
                ts: Date.now(),
              }
              setMessages((prev) => [initialMsg, ...prev])
              setIsTyping(false)

              xhr.onprogress = () => {
                const responseText = xhr.responseText
                const newData = responseText.slice(lastProcessedLength)
                lastProcessedLength = responseText.length

                const lines = newData.split("\n")

                for (const line of lines) {
                  if (line.startsWith("data: ")) {
                    const data = line.slice(6).trim()
                    console.log("[v0] Received streaming data:", data) // Added debug logging

                    if (data === "[DONE]") {
                      console.log("[v0] Streaming completed")
                      resolve()
                      return
                    }

                    if (data) {
                      try {
                        let content = ""
                        try {
                          const parsed = JSON.parse(data)
                          content = parsed.content || parsed.text || parsed.message || ""
                        } catch (jsonError) {
                          // If not JSON, treat as plain text
                          content = data
                        }

                        if (content) {
                          streamingMessage += content
                          console.log("[v0] Updated streaming message:", streamingMessage.slice(-50)) // Debug last 50 chars

                          const formattedStreamingMessage = formatAIResponse(streamingMessage)
                          // Update the streaming message in real-time
                          setMessages((prev) =>
                            prev.map((msg) =>
                              msg.id === currentMessageId ? { ...msg, text: formattedStreamingMessage } : msg,
                            ),
                          )
                        }
                      } catch (e) {
                        console.log("[v0] Failed to parse streaming data:", data, "Error:", e)
                      }
                    }
                  }
                }
              }

              xhr.onload = () => {
                console.log("[v0] Streaming request completed")
                resolve()
              }

              xhr.onerror = () => {
                console.error("[v0] Streaming request failed")
                // Remove the streaming message and add error message
                setMessages((prev) => prev.filter((msg) => msg.id !== currentMessageId))
                addMessage("Streaming interrupted. Please try again.", "ai")
                resolve()
              }

              xhr.send(JSON.stringify(payload))
            })
          }
        } catch (streamingError) {
          console.log("Streaming failed, falling back to non-streaming:", streamingError)
        }

        const { data, error } = await supabase.functions.invoke("aicoach", {
          body: JSON.stringify(payload),
        })

        if (error) {
          console.error("Invoke error:", JSON.stringify(error, null, 2))
          // Fallback to fetch
          console.log("Falling back to fetch")
          const response = await fetch(`${SUPABASE_URL}/functions/v1/aicoach`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(payload),
          })
          console.log("Fetch response status:", response.status, "Headers:", Object.fromEntries(response.headers))
          const responseText = await response.text()
          console.log("Fetch response body:", responseText)
          setIsTyping(false)
          if (!response.ok) {
            addMessage(`Error connecting to AI Coach: ${response.status} ${responseText}`, "ai")
            return
          }
          addMessage(responseText || "AI Coach responded, but no content was received.", "ai")
          return
        }

        setIsTyping(false)
        const responseText =
          typeof data === "string"
            ? data
            : data?.content || data?.text || data?.message || "AI Coach responded, but no content was received."
        console.log("Invoke response:", responseText)
        addMessage(responseText, "ai")
      } catch (err) {
        setIsTyping(false)
        console.error("sendPromptToBackend failed:", JSON.stringify(err, null, 2))
        addMessage(`Error connecting to AI Coach: ${err.message || "Unknown error"}`, "ai")
      }
    },
    [addMessage],
  )

  const addImageMessage = useCallback((imageUris: string[], type: Sender, text = "") => {
    const msg: Message = { id: `${Date.now()}-${Math.random()}`, type, text, ts: Date.now(), imageUris }
    setMessages((prev) => [msg, ...prev])
  }, [])

  const handleSend = useCallback(() => {
    const value = input.trim()
    if (!value) return
    sendPromptToBackend(value)
    setInput("")
    bumpSend()
  }, [input, sendPromptToBackend, bumpSend])

  const onLongPressBubble = useCallback((text: string) => {
    Alert.alert("Message", text, [{ text: "Close" }])
  }, [])

  const suggestions = useMemo(() => {
    const hint = messages[0]?.text ?? ""
    const rotated = [...SUGGESTIONS_BASE]
    if (hint.toLowerCase().includes("photo")) rotated.unshift("Compare my latest photos")
    return rotated.slice(0, 4)
  }, [messages])

  const renderItem = useCallback(
    ({ item }: { item: Message }) => (
      <View style={{ marginBottom: 12 }}>
        {item.imageUris && item.imageUris.length > 0 ? (
          <View style={{ alignItems: item.type === "user" ? "flex-end" : "flex-start" }}>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                borderRadius: 12,
                overflow: "hidden",
                borderWidth: 2,
                borderColor: item.type === "user" ? ui.primary : ui.stroke,
                marginBottom: 4,
                maxWidth: 220,
              }}
            >
              {item.imageUris.map((uri, index) => (
                <Animated.Image
                  key={`${item.id}-${index}`}
                  source={{ uri }}
                  style={{ width: 120, height: 160, resizeMode: "cover", margin: 2 }}
                  onError={() => console.log("Image failed to load:", uri)}
                />
              ))}
            </View>
            {item.text ? <Text style={{ color: ui.text, fontSize: 12 }}>{item.text}</Text> : null}
          </View>
        ) : (
          <ChatBubble item={item} theme={ui} onLongPress={onLongPressBubble} />
        )}
      </View>
    ),
    [ui, onLongPressBubble],
  )

  const keyExtractor = useCallback((item: Message) => item.id, [])
  const getItemLayout = useCallback((_: any, index: number) => ({ length: 88, offset: 88 * index, index }), [])

  const uploadAndAnalyzePhotos = async (fromCamera: boolean) => {
    const action = fromCamera ? "camera" : "upload"
    setQuickLoading(action)
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !sessionData?.session) {
        console.error("Session error:", JSON.stringify(sessionError, null, 2))
        addMessage("You must be logged in to analyze photos.", "ai")
        return
      }

      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 0.5,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
          })

      if (!result.canceled && result.assets.length > 0) {
        const user = await supabase.auth.getUser()
        const userId = user?.data?.user?.id
        if (!userId) {
          addMessage("Photo upload failed: user ID not found", "ai")
          return
        }

        const accessToken = sessionData.session.access_token
        const uploadedUrls: string[] = []

        for (const photo of result.assets) {
          try {
            addMessage("Uploading photo...", "ai")

            console.log("[v0] Starting photo upload for:", photo.uri)
            const file = await FileSystem.readAsStringAsync(photo.uri, { encoding: FileSystem.EncodingType.Base64 })
            const fileName = `aicoach_photo_${Date.now()}.jpg`

            console.log("[v0] Uploading to:", `${SUPABASE_URL}/functions/v1/upload-photo`)
            console.log("[v0] Upload payload:", { userId, fileName, contentType: "image/jpeg", fileSize: file.length })

            const response = await fetch(`${SUPABASE_URL}/functions/v1/upload-photo`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify({
                userId,
                fileName,
                fileBase64: file,
                contentType: "image/jpeg",
              }),
            })

            console.log("[v0] Upload response status:", response.status)
            console.log("[v0] Upload response headers:", Object.fromEntries(response.headers))

            const responseText = await response.text()
            console.log("[v0] Upload response body:", responseText)

            if (!response.ok) {
              const errorMsg = `Photo upload failed: ${response.status} - ${responseText}`
              console.error("[v0] Upload error:", errorMsg)
              addMessage(errorMsg, "ai")
              continue
            }

            let responseData
            try {
              responseData = JSON.parse(responseText)
            } catch (parseError) {
              console.error("[v0] Failed to parse response JSON:", parseError)
              addMessage("Photo upload failed: Invalid response format", "ai")
              continue
            }

            const uploadedUrl = responseData.publicUrl || responseData.url
            if (uploadedUrl) {
              console.log("[v0] Photo uploaded successfully:", uploadedUrl)
              uploadedUrls.push(uploadedUrl)
            } else {
              console.error("[v0] No URL in response:", responseData)
              addMessage("Photo upload failed: No URL returned", "ai")
            }
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err)
            console.error("[v0] Photo upload error:", errorMessage, err)
            addMessage(`Photo upload failed: ${errorMessage}`, "ai")
          }
        }

        if (uploadedUrls.length === 0) {
          addMessage("No photos were uploaded successfully.", "ai")
          return
        }

        setPhotos((prevPhotos: any[]) => {
          const newPhotos = uploadedUrls.map((url) => ({
            id: `${Date.now()}-${Math.random()}`,
            uri: url,
            timestamp: new Date().toISOString(),
            analysis: null,
            analyzed: false,
            progressScore: null,
          }))
          const updatedPhotos = [...(prevPhotos || []), ...newPhotos]
          addImageMessage(
            uploadedUrls,
            "user",
            `[Uploaded ${uploadedUrls.length} photo${uploadedUrls.length > 1 ? "s" : ""}]`,
          )
          setIsTyping(true)
          addMessage("Analyzing photos...", "ai")
          ;(async () => {
            const userGoal = (await AsyncStorage.getItem("fitnessGoal")) || ""
            const feedback = await analyzePhotoWithBackend(uploadedUrls, userGoal)
            setIsTyping(false)
            if (
              !feedback ||
              typeof feedback !== "string" ||
              feedback.trim().length === 0 ||
              feedback.toLowerCase().includes("error")
            ) {
              addMessage("Sorry, I couldn't analyze your photos. Please try again later.", "ai")
            } else {
              addMessage(feedback, "ai")
            }
          })()

          return updatedPhotos
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error("[v0] uploadAndAnalyzePhotos error:", errorMessage, error)
      addMessage(`Photo upload failed: ${errorMessage}`, "ai")
    } finally {
      setQuickLoading(null)
    }
  }

  const analyzePhotoWithBackend = async (imageUrls: string[], goal?: string) => {
    try {
      // Log full session
      const session = await supabase.auth.getSession()
      console.log("Session:", JSON.stringify(session, null, 2))

      // Refresh session
      const { error: refreshError } = await supabase.auth.refreshSession()
      if (refreshError) {
        console.error("Session refresh error:", JSON.stringify(refreshError, null, 2))
        return "Please log in again to continue."
      }

      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData?.session?.access_token

      if (!accessToken) {
        console.error("No access token found")
        return "Please log in again to continue."
      }

      const userProfile = {
        fitnessLevel: (await AsyncStorage.getItem("fitnessLevel")) || "beginner",
        injuries: JSON.parse((await AsyncStorage.getItem("injuries")) || "[]"),
        age: Number.parseInt((await AsyncStorage.getItem("age")) || "0") || undefined,
      }
      const payload = { imageUrls, goal, userProfile }

      console.log("Invoking aicoach with payload:", JSON.stringify(payload, null, 2))
      console.log("Access token:", accessToken.slice(0, 10) + "...")

      try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/aicoach`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
            Accept: "text/event-stream", // Request streaming
          },
          body: JSON.stringify(payload),
        })

        if (response.ok && response.headers.get("content-type")?.includes("text/event-stream")) {
          return new Promise((resolve) => {
            const xhr = new XMLHttpRequest()
            xhr.open("POST", `${SUPABASE_URL}/functions/v1/aicoach`)
            xhr.setRequestHeader("Content-Type", "application/json")
            xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`)
            xhr.setRequestHeader("Accept", "text/event-stream")

            let streamingAnalysis = ""
            const currentMessageId = `${Date.now()}-${Math.random()}`
            let lastProcessedLength = 0

            // Add initial empty message for streaming
            const initialMsg: Message = {
              id: currentMessageId,
              type: "ai",
              text: "",
              ts: Date.now(),
            }
            setMessages((prev) => [initialMsg, ...prev])
            setIsTyping(false)

            xhr.onprogress = () => {
              const responseText = xhr.responseText
              const newData = responseText.slice(lastProcessedLength)
              lastProcessedLength = responseText.length

              const lines = newData.split("\n")

              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  const data = line.slice(6).trim()
                  console.log("[v0] Photo analysis streaming data:", data)

                  if (data === "[DONE]") {
                    console.log("[v0] Photo analysis streaming completed")
                    resolve(streamingAnalysis)
                    return
                  }

                  if (data) {
                    try {
                      let content = ""
                      try {
                        const parsed = JSON.parse(data)
                        content = parsed.content || parsed.text || parsed.message || ""
                      } catch (jsonError) {
                        content = data
                      }

                      if (content) {
                        streamingAnalysis += content
                        console.log("[v0] Updated photo analysis:", streamingAnalysis.slice(-50))

                        const formattedAnalysis = formatAIResponse(streamingAnalysis)
                        setMessages((prev) =>
                          prev.map((msg) => (msg.id === currentMessageId ? { ...msg, text: formattedAnalysis } : msg)),
                        )
                      }
                    } catch (e) {
                      console.log("[v0] Failed to parse photo analysis data:", data, "Error:", e)
                    }
                  }
                }
              }
            }

            xhr.onload = () => {
              console.log("[v0] Streaming request completed")
              resolve(streamingAnalysis || "AI Coach could not analyze your photos. Please try again.")
            }

            xhr.onerror = () => {
              console.error("[v0] Streaming request failed")
              setMessages((prev) => prev.filter((msg) => msg.id !== currentMessageId))
              setIsTyping(false)
              addMessage("Streaming interrupted. Please try again.", "ai")
              resolve("")
            }

            xhr.send(JSON.stringify(payload))
          })
        }
      } catch (streamingError) {
        console.log("Photo analysis streaming failed, falling back to non-streaming:", streamingError)
      }

      const { data, error } = await supabase.functions.invoke("aicoach", {
        body: JSON.stringify(payload),
      })

      if (error) {
        console.error("Invoke error:", JSON.stringify(error, null, 2))
        // Fallback to fetch
        console.log("Falling back to fetch")
        const response = await fetch(`${SUPABASE_URL}/functions/v1/aicoach`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(payload),
        })
        console.log("Fetch response status:", response.status, "Headers:", Object.fromEntries(response.headers))
        const responseText = await response.text()
        console.log("Fetch response body:", responseText)
        if (!response.ok) {
          return `AI Coach could not analyze your photos: ${response.status} ${responseText}`
        }
        return responseText || "AI Coach could not analyze your photos. Please try again."
      }

      const responseText =
        typeof data === "string"
          ? data
          : data?.content || data?.text || data?.message || "AI Coach could not analyze your photos. Please try again."
      console.log("Invoke response:", responseText)
      return responseText
    } catch (error) {
      console.error("analyzePhotoWithBackend failed:", JSON.stringify(error, null, 2))
      return error.message || "Error connecting to AI Coach backend."
    }
  }

  // Handle single photoUri from navigation
  React.useEffect(() => {
    if (photoUri && typeof photoUri === "string") {
      addImageMessage([photoUri], "user", "[Photo uploaded]")
      setPhotos((prevPhotos: any[]) => {
        const newPhoto = {
          id: `${Date.now()}-${Math.random()}`,
          uri: photoUri,
          timestamp: new Date().toISOString(),
          analysis: null,
          analyzed: false,
          progressScore: null,
        }
        const updatedPhotos = [...(prevPhotos || []), newPhoto]
        setIsTyping(true)
        addMessage("Analyzing photo...", "ai")
        ;(async () => {
          const userGoal = (await AsyncStorage.getItem("fitnessGoal")) || ""
          const feedback = await analyzePhotoWithBackend([photoUri], userGoal)
          setIsTyping(false)
          if (
            !feedback ||
            typeof feedback !== "string" ||
            feedback.trim().length === 0 ||
            feedback.toLowerCase().includes("error")
          ) {
            addMessage("Sorry, I couldn't analyze your photo. Please try again later.", "ai")
          } else {
            addMessage(feedback, "ai")
          }
        })()
        return updatedPhotos
      })
    }
  }, [photoUri, addImageMessage, addMessage, setPhotos])

  // Keep Supabase Edge Function warm
  React.useEffect(() => {
    const ping = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("aicoach", {
          body: JSON.stringify({ text: "ping" }),
        })
        if (error) {
          console.error("Ping error:", JSON.stringify(error, null, 2))
        } else {
          console.log("Ping successful:", data)
        }
      } catch (err) {
        console.error("Ping failed:", JSON.stringify(err, null, 2))
      }
    }
    ping()
    const pingInterval = setInterval(ping, 120000)
    return () => clearInterval(pingInterval)
  }, [])

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: ui.bg }]} edges={["top", "left", "right"]}>
      <LinearGradient
        colors={isDark ? ["#0B1220", "#0B0F14"] : ["#ECFEFF", "#F8FAFC"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGrad}
      >
        <View style={styles.headerRow}>
          <View style={[styles.avatar, { backgroundColor: ui.primary }]}>
            <MaterialCommunityIcons name="robot-excited" size={24} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: ui.text }]}>AI Coach</Text>
            <Text style={[styles.subtitle, { color: ui.sub }]}>Personalized training & photo insights</Text>
          </View>
          <View style={[styles.streakPill, { borderColor: ui.stroke }]}>
            <MaterialCommunityIcons name="fire" size={14} color={isDark ? "#FDE68A" : "#EA580C"} />
            <Text style={[styles.streakText, { color: ui.text }]}>3‑day</Text>
          </View>
        </View>

        <View style={styles.quickRow}>
          <QuickAction
            ui={ui}
            label="Take Photos"
            icon="camera"
            onPress={() => uploadAndAnalyzePhotos(true)}
            loading={quickLoading === "camera"}
          />
          <QuickAction
            ui={ui}
            label="Nutrition Plan"
            icon="food-apple"
            onPress={() => sendPromptToBackend("Create a personalized nutrition plan for my fitness goals")}
          />
          <QuickAction
            ui={ui}
            label="Compare"
            icon="compare"
            onPress={() => sendPromptToBackend("Compare my latest photos")}
          />
          <QuickAction
            ui={ui}
            label="Plan"
            icon="calendar-check"
            onPress={() => sendPromptToBackend("What's my plan for this week?")}
          />
        </View>
      </LinearGradient>

      <View style={styles.suggestionWrap}>
        <ScrollChips
          items={suggestions}
          bg={ui.chipBg}
          textColor={ui.text}
          borderColor={ui.stroke}
          onPress={(t) => setInput(t)}
        />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <FlatList
          data={messages}
          inverted
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 8 }}
          removeClippedSubviews
          initialNumToRender={12}
          maxToRenderPerBatch={8}
          windowSize={10}
          getItemLayout={getItemLayout}
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
        />

        {isTyping && (
          <View style={styles.typingRow}>
            <TypingDots isDark={isDark} />
            <Text style={{ marginLeft: 6, color: ui.sub, fontSize: 12 }}>Coach is typing…</Text>
          </View>
        )}

        <View style={[styles.inputRow, { borderTopColor: ui.stroke, backgroundColor: ui.card }]}>
          <Pressable
            onPress={() => uploadAndAnalyzePhotos(false)}
            style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.6 : 1 }]}
          >
            <MaterialCommunityIcons name="paperclip" size={20} color={isDark ? "#9FB0C3" : "#64748B"} />
          </Pressable>

          <TextInput
            style={[styles.input, { backgroundColor: ui.inputBg, color: ui.text }]}
            value={input}
            onChangeText={setInput}
            placeholder="Ask your coach…"
            placeholderTextColor={isDark ? "#637A93" : "#94A3B8"}
            autoCorrect
            multiline
            maxLength={800}
          />

          <Animated.View style={{ transform: [{ scale: sendScale }] }}>
            <TouchableOpacity
              onPress={handleSend}
              activeOpacity={0.8}
              style={[
                styles.sendButton,
                { backgroundColor: ui.primary, shadowColor: isDark ? "transparent" : ui.primary },
              ]}
              accessibilityLabel="Send message"
            >
              <MaterialCommunityIcons name="send" size={18} color="#fff" />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const QuickAction = React.memo(function QuickAction({
  label,
  icon,
  onPress,
  ui,
  loading = false,
}: {
  label: string
  icon: any
  onPress: () => void
  ui: any
  loading?: boolean
}) {
  return (
    <Pressable
      onPress={loading ? undefined : onPress}
      style={({ pressed }) => [
        styles.quickCard,
        {
          transform: [{ scale: pressed ? 0.98 : 1 }],
          backgroundColor: ui.card,
          borderColor: ui.stroke,
          opacity: loading ? 0.6 : 1,
        },
      ]}
    >
      <View style={[styles.quickIcon, { backgroundColor: ui.quickIconBg }]}>
        {loading ? (
          <ActivityIndicator size={16} color={ui.primary} />
        ) : (
          <MaterialCommunityIcons name={icon} size={18} color={ui.primary} />
        )}
      </View>
      <Text style={[styles.quickLabel, { color: ui.text }]}>{label}</Text>
    </Pressable>
  )
})

const ChatBubble = React.memo(function ChatBubble({
  item,
  theme: ui,
  onLongPress,
}: {
  item: Message
  theme: any
  onLongPress: (t: string) => void
}) {
  const isUser = item.type === "user"
  return (
    <View style={[styles.bubbleRow, { justifyContent: isUser ? "flex-end" : "flex-start" }]}>
      {!isUser && (
        <View style={[styles.aiAvatarMini, { backgroundColor: ui.primary }]}>
          <MaterialCommunityIcons name="robot-happy" color="#fff" size={14} />
        </View>
      )}
      {isUser ? (
        <LinearGradient colors={ui.userBubble} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.userBubble}>
          <Pressable onLongPress={() => onLongPress(item.text)}>
            <Text style={styles.userText}>{item.text}</Text>
          </Pressable>
        </LinearGradient>
      ) : (
        <Pressable
          onLongPress={() => onLongPress(item.text)}
          style={[styles.aiBubble, { backgroundColor: ui.aiBubble, borderColor: ui.stroke }]}
        >
          <Text style={[styles.aiText, { color: ui.text }]}>{item.text}</Text>
        </Pressable>
      )}
    </View>
  )
})

const ScrollChips = React.memo(function ScrollChips({
  items,
  bg,
  textColor,
  borderColor,
  onPress,
}: {
  items: string[]
  bg: string
  textColor: string
  borderColor: string
  onPress: (t: string) => void
}) {
  return (
    <FlatList
      data={items}
      keyExtractor={(t) => t}
      showsHorizontalScrollIndicator={false}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => onPress(item)}
          style={({ pressed }) => [styles.chip, { backgroundColor: bg, borderColor, opacity: pressed ? 0.7 : 1 }]}
        >
          <MaterialCommunityIcons name="lightbulb-on-outline" size={14} color="#10B981" />
          <Text style={[styles.chipText, { color: textColor }]}>{item}</Text>
        </Pressable>
      )}
      horizontal
      contentContainerStyle={{ paddingHorizontal: 16 }}
    />
  )
})

const TypingDots: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const d1 = useRef(new Animated.Value(0)).current
  const d2 = useRef(new Animated.Value(0)).current
  const d3 = useRef(new Animated.Value(0)).current

  const animate = useCallback((v: Animated.Value, delay: number) => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ).start()
  }, [])

  React.useEffect(() => {
    animate(d1, 0)
    animate(d2, 150)
    animate(d3, 300)
  }, [animate, d1, d2, d3])

  const dot = (v: Animated.Value, key: string) => (
    <Animated.View
      key={key}
      style={{
        width: 6,
        height: 6,
        marginHorizontal: 2,
        borderRadius: 3,
        backgroundColor: isDark ? "#A5B4FC" : "#64748B",
        opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
        transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -2] }) }],
      }}
    />
  )

  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>{[dot(d1, "1"), dot(d2, "2"), dot(d3, "3")]}</View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGrad: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0EA5E9",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
  title: { fontSize: 18, fontWeight: "700" },
  subtitle: { fontSize: 12, marginTop: 2 },
  streakPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  streakText: { fontSize: 12, fontWeight: "600" },
  quickRow: { flexDirection: "row", gap: 12, marginTop: 16, paddingHorizontal: 2 },
  quickCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#ECFEFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  quickLabel: { fontSize: 12, fontWeight: "600", color: "#0F172A", textAlign: "center", lineHeight: 16 },
  suggestionWrap: { paddingVertical: 10 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  chipText: { fontSize: 12, color: "#0F172A" },
  bubbleRow: { paddingHorizontal: 12, marginVertical: 6, flexDirection: "row", alignItems: "flex-end" },
  aiAvatarMini: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#0EA5E9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  userBubble: {
    maxWidth: "78%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderBottomRightRadius: 6,
  },
  aiBubble: {
    maxWidth: "85%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  userText: { color: "#FFFFFF", fontSize: 15, lineHeight: 20 },
  aiText: { fontSize: 15, lineHeight: 20 },
  typingRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 6 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  input: {
    flex: 1,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxHeight: 110,
    fontSize: 15,
    marginHorizontal: 6,
  },
  sendButton: {
    backgroundColor: "#0EA5E9",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    shadowColor: "#0EA5E9",
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
})

export default AICoachScreen
