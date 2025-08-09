import React, { useEffect, useState } from "react";
import { View, Text, Switch, StyleSheet, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

export default function SettingsScreen() {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const user = await AsyncStorage.getItem("user");
        if (user) {
          const parsed = JSON.parse(user);
          setName(parsed.fullName);
        }
        const savedDark = await AsyncStorage.getItem("settings:darkMode");
        const savedNotifications = await AsyncStorage.getItem("settings:notifications");
        if (savedDark !== null) setDarkMode(savedDark === "true");
        if (savedNotifications !== null) setNotifications(savedNotifications === "true");
      } catch (e) {
        console.log("Load settings error", e);
      }
    };
    loadSettings();
  }, []);

  const toggleDarkMode = async () => {
    const next = !darkMode;
    setDarkMode(next);
    await AsyncStorage.setItem("settings:darkMode", JSON.stringify(next));
  };

  const toggleNotifications = async () => {
    const next = !notifications;
    setNotifications(next);
    await AsyncStorage.setItem("settings:notifications", JSON.stringify(next));
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    router.replace("/(auth)/login");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      {name ? <Text style={styles.subtitle}>{name}</Text> : null}

      <View style={styles.row}>
        <Text style={styles.label}>Dark Mode</Text>
        <Switch value={darkMode} onValueChange={toggleDarkMode} />
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Notifications</Text>
        <Switch value={notifications} onValueChange={toggleNotifications} />
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 32,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  label: {
    fontSize: 16,
    color: "#374151",
  },
  logoutButton: {
    marginTop: 32,
    backgroundColor: "#EF4444",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  logoutText: {
    color: "#fff",
    fontWeight: "600",
  },
});

