import { AuthContext } from "@/app/_layout";
import { theme } from "@/constants/theme";
import { useRouter } from "expo-router";
import React, { useContext, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function LoginScreen() {
  const { signIn } = useContext(AuthContext);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const extractNameFromEmail = (addr: string) => {
    const username = addr.split("@")[0];
    return username
      .split(/[._-]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ");
  };

  const handleLogin = async () => {
    try {
      const userData = {
        fullName: extractNameFromEmail(email),
        email,
      };
      console.log("💾 Saving user data from login:", userData);
      await AsyncStorage.setItem("user", JSON.stringify(userData));
      console.log("✅ User data saved successfully");
    } catch (error) {
      console.log("❌ Login error:", error);
    }

    await signIn("token");
    router.replace("/(tabs)/homepage");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CaptureFit</Text>
      <View style={styles.form}>
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          style={styles.input}
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

