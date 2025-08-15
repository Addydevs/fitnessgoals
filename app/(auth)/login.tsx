import { AuthContext } from "@/app/_layout";
import { theme } from "@/constants/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useContext, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, useColorScheme, View } from "react-native";
import { apiRequest } from "../../utils/api";
import { emitUserChange } from '../../utils/userEvents';

export default function LoginScreen() {
  const auth = useContext(AuthContext);
  const signIn = auth?.signIn;
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState("");
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const inputTextColor = isDark ? "#F3F4F6" : theme.colors.text;
  const inputBgColor = isDark ? "#1F2937" : "#fff";
  const placeholderColor = isDark ? "#9CA3AF" : "#6B7280";

  const handleLogin = async () => {
    setFeedback("");
    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      await AsyncStorage.setItem('user', JSON.stringify(data.user));
  try { emitUserChange({ fullName: data.user.fullName || data.user.name, email: data.user.email, avatar: data.user.avatar || null }); } catch (e) { console.warn('emitUserChange failed:', e); }
  if (!signIn) throw new Error('Auth context not available');
  await signIn(data.token);
      setFeedback('Login successful!');
      router.replace('/(tabs)/homepage');
    } catch (error: any) {
      setFeedback(error.message || 'Network error. Please try again.');
      console.log('❌ Login error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CaptureFit</Text>
      <View style={styles.form}>
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          style={[styles.input, { color: inputTextColor, backgroundColor: inputBgColor }]}
          placeholderTextColor={placeholderColor}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          style={[styles.input, { color: inputTextColor, backgroundColor: inputBgColor }]}
          placeholderTextColor={placeholderColor}
          secureTextEntry
        />
        <Pressable style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Sign In</Text>
        </Pressable>
        <Pressable onPress={() => router.push("/(auth)/signup")}>
          <Text style={styles.switchText}>
            Don{'\''}t have an account? <Text style={styles.link}>Sign Up</Text>
          </Text>
        </Pressable>
        <Text style={{ color: feedback.includes('successful') ? 'green' : 'red', textAlign: 'center', marginBottom: 10 }}>{feedback}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "white",
    justifyContent: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 40,
    color: theme.colors.text,
  },
  form: {
    gap: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  button: {
    backgroundColor: theme.colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  switchText: {
    textAlign: "center",
    marginTop: 16,
    color: "#6B7280",
  },
  link: {
    color: theme.colors.primary,
    fontWeight: "600",
  },
});

