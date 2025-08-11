import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Animated,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
// import * as Haptics from "expo-haptics"; // optional

/**
 * Capturefit – AI Coach (Premium)
 *
 * Highlights
 * - Gradient header with avatar + streak pill
 * - Quick actions row
 * - Smart suggestion chips
 * - Inverted, performant FlatList chat
 * - Typing indicator (animated dots)
 * - Micro-interactions: send pulse, press scale
 * - Dark-mode aware
 */

type Sender = "ai" | "user";

type Message = {
  id: string;
  type: Sender;
  text: string;
  ts: number;
};

const SUGGESTIONS_BASE = [
  "What should I do this week?",
  "Analyze my latest photo",
  "Why did my weight stall?",
  "Give me a 20‑min workout",
];

const AICoachScreen: React.FC = () => {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "m1",
      type: "ai",
      text:
        "Hey, I’m your AI Coach. Upload a progress photo or ask me anything—training, nutrition, or recovery. Let’s lock in your next win.",
      ts: Date.now(),
    },
  ]);

  // animated send scale
  const sendScale = useRef(new Animated.Value(1)).current;
  const bumpSend = useCallback(() => {
    Animated.sequence([
      Animated.timing(sendScale, { toValue: 0.9, duration: 70, useNativeDriver: true }),
      Animated.spring(sendScale, { toValue: 1, useNativeDriver: true, bounciness: 14 }),
    ]).start();
  }, [sendScale]);

  const theme = useMemo(
    () => ({
      bg: isDark ? "#0B0F14" : "#F8FAFC",
      card: isDark ? "#101722" : "#FFFFFF",
      text: isDark ? "#E6EDF5" : "#0F172A",
      sub: isDark ? "#9FB0C3" : "#475569",
      stroke: isDark ? "#1C2633" : "#E2E8F0",
      userBubble: isDark ? ["#2563eb", "#0ea5e9"] : ["#0ea5e9", "#22d3ee"],
      aiBubble: isDark ? "#0F172A" : "#FFFFFF",
      inputBg: isDark ? "#0F172A" : "#F1F5F9",
      chipBg: isDark ? "rgba(255,255,255,0.06)" : "#F1F5F9",
    }),
    [isDark]
  );

  const addMessage = useCallback((text: string, type: Sender) => {
    const msg: Message = { id: `${Date.now()}-${Math.random()}`, type, text, ts: Date.now() };
    setMessages((prev) => [msg, ...prev]); // inverted list (newest on top)
  }, []);

  // TODO: replace with your real API call
  const fakeAIReply = useCallback(
    (userText: string) => {
      setIsTyping(true);
      setTimeout(() => {
        const reply =
          userText.toLowerCase().includes("photo")
            ? "Nice—once you upload, I’ll compare posture, waist taper, and muscle definition trends. Want tips to make photos consistent?"
            : "Solid. Based on your recent momentum, aim for 2 strength days + your hoops. Keep protein at ~0.8–1g/lb and walk 7–9k steps.";
        addMessage(reply, "ai");
        setIsTyping(false);
      }, 700);
    },
    [addMessage]
  );

  const handleSend = useCallback(() => {
    const value = input.trim();
    if (!value) return;
    // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    addMessage(value, "user");
    setInput("");
    bumpSend();
    fakeAIReply(value);
  }, [input, addMessage, fakeAIReply, bumpSend]);

  const onLongPressBubble = useCallback((text: string) => {
    Alert.alert("Message", text, [
      // you can hook your clipboard here
      { text: "Close" },
    ]);
  }, []);

  const suggestions = useMemo(() => {
    const hint = messages[0]?.text ?? "";
    const rotated = [...SUGGESTIONS_BASE];
    if (hint.toLowerCase().includes("photo")) rotated.unshift("Compare today vs last month");
    return rotated.slice(0, 4);
  }, [messages]);

  const renderItem = useCallback(
    ({ item }: { item: Message }) => (
      <ChatBubble item={item} theme={theme} onLongPress={onLongPressBubble} />
    ),
    [theme, onLongPressBubble]
  );

  const keyExtractor = useCallback((item: Message) => item.id, []);
  const getItemLayout = useCallback(
    (_: any, index: number) => ({ length: 88, offset: 88 * index, index }),
    []
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={["top", "left", "right"]}>
      {/* Header */}
      <LinearGradient
        colors={isDark ? ["#0B1220", "#0B0F14"] : ["#ECFEFF", "#F8FAFC"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGrad}
      >
        <View style={styles.headerRow}>
          <View style={styles.avatar}>
            <MaterialCommunityIcons name="robot-excited" size={24} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: theme.text }]}>AI Coach</Text>
            <Text style={[styles.subtitle, { color: theme.sub }]}>Personalized training & photo insights</Text>
          </View>
          <View style={[styles.streakPill, { borderColor: theme.stroke }]}>
            <MaterialCommunityIcons name="fire" size={14} color={isDark ? "#FDE68A" : "#EA580C"} />
            <Text style={[styles.streakText, { color: theme.text }]}>3‑day</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickRow}>
          <QuickAction label="Upload Photo" icon="cloud-upload" onPress={() => addMessage("Upload progress photo", "user")} />
          <QuickAction label="Compare" icon="compare" onPress={() => addMessage("Compare my latest two photos", "user")} />
          <QuickAction label="Plan" icon="calendar-check" onPress={() => addMessage("What’s my plan for this week?", "user")} />
          <QuickAction label="Nutrition" icon="food-apple-outline" onPress={() => addMessage("Give me a nutrition tip", "user")} />
        </View>
      </LinearGradient>

      {/* Suggestions */}
      <View style={styles.suggestionWrap}>
        <ScrollChips items={suggestions} bg={theme.chipBg} onPress={(t) => setInput(t)} />
      </View>

      {/* Chat */}
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

        {/* Typing indicator */}
        {isTyping && (
          <View style={styles.typingRow}>
            <TypingDots isDark={isDark} />
            <Text style={{ marginLeft: 6, color: theme.sub, fontSize: 12 }}>Coach is typing…</Text>
          </View>
        )}

        {/* Input */}
        <View style={[styles.inputRow, { borderTopColor: theme.stroke, backgroundColor: theme.card }]}>
          <Pressable onPress={() => addMessage("Attach: progress_photo.jpg", "user")} style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.6 : 1 }]}
          >
            <MaterialCommunityIcons name="paperclip" size={20} color={isDark ? "#9FB0C3" : "#64748B"} />
          </Pressable>

          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text }]}
            value={input}
            onChangeText={setInput}
            placeholder="Ask your coach…"
            placeholderTextColor={isDark ? "#637A93" : "#94A3B8"}
            autoCorrect
            multiline
            maxLength={800}
          />

          <Animated.View style={{ transform: [{ scale: sendScale }] }}>
            <TouchableOpacity onPress={handleSend} activeOpacity={0.8} style={styles.sendButton} accessibilityLabel="Send message">
              <MaterialCommunityIcons name="send" size={18} color="#fff" />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AICoachScreen;

/** ---------- Subcomponents ---------- */

const QuickAction = React.memo(function QuickAction({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: any;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.quickCard, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}
    >
      <View style={styles.quickIcon}>
        <MaterialCommunityIcons name={icon} size={18} color="#0EA5E9" />
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </Pressable>
  );
});

const ChatBubble = React.memo(function ChatBubble({
  item,
  theme,
  onLongPress,
}: {
  item: Message;
  theme: any;
  onLongPress: (t: string) => void;
}) {
  const isUser = item.type === "user";
  return (
    <View style={[styles.bubbleRow, { justifyContent: isUser ? "flex-end" : "flex-start" }]}> 
      {!isUser && (
        <View style={styles.aiAvatarMini}>
          <MaterialCommunityIcons name="robot-happy" color="#fff" size={14} />
        </View>
      )}
      {isUser ? (
        <LinearGradient colors={theme.userBubble} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.userBubble}>
          <Pressable onLongPress={() => onLongPress(item.text)}>
            <Text style={styles.userText}>{item.text}</Text>
          </Pressable>
        </LinearGradient>
      ) : (
        <Pressable onLongPress={() => onLongPress(item.text)} style={[styles.aiBubble, { backgroundColor: theme.aiBubble, borderColor: theme.stroke }]}
        >
          <Text style={[styles.aiText, { color: theme.text }]}>{item.text}</Text>
        </Pressable>
      )}
    </View>
  );
});

const ScrollChips = React.memo(function ScrollChips({
  items,
  bg,
  onPress,
}: {
  items: string[];
  bg: string;
  onPress: (t: string) => void;
}) {
  return (
    <FlatList
      data={items}
      keyExtractor={(t) => t}
      showsHorizontalScrollIndicator={false}
      renderItem={({ item }) => (
        <Pressable onPress={() => onPress(item)} style={({ pressed }) => [styles.chip, { backgroundColor: bg, opacity: pressed ? 0.7 : 1 }]}
        >
          <MaterialCommunityIcons name="lightbulb-on-outline" size={14} color="#10B981" />
          <Text style={styles.chipText}>{item}</Text>
        </Pressable>
      )}
      horizontal
      contentContainerStyle={{ paddingHorizontal: 16 }}
    />
  );
});

const TypingDots: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const d1 = useRef(new Animated.Value(0)).current;
  const d2 = useRef(new Animated.Value(0)).current;
  const d3 = useRef(new Animated.Value(0)).current;

  const animate = useCallback((v: Animated.Value, delay: number) => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: 400, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  React.useEffect(() => {
    animate(d1, 0);
    animate(d2, 150);
    animate(d3, 300);
  }, [animate, d1, d2, d3]);

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
  );

  return <View style={{ flexDirection: "row", alignItems: "center" }}>{[dot(d1, "1"), dot(d2, "2"), dot(d3, "3")]}</View>;
};

/** ---------- Styles ---------- */
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

  quickRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  quickCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  quickIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#ECFEFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  quickLabel: { fontSize: 12, fontWeight: "600", color: "#0F172A" },

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
});

