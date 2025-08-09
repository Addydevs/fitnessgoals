import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

interface User {
  name: string;
  email: string;
}

interface ThemeColors {
  background: string;
  card: string;
  text: string;
}

const lightTheme: ThemeColors = {
  background: "#FFFFFF",
  card: "#F3F4F6",
  text: "#1F2937",
};

const darkTheme: ThemeColors = {
  background: "#1F2937",
  card: "#374151",
  text: "#FFFFFF",
};

export default function SettingsScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [autoSave, setAutoSave] = useState(false);
  const [theme, setTheme] = useState<ThemeColors>(lightTheme);

  useEffect(() => {
    loadUserData();
    loadPreferences();
  }, []);

  const loadUserData = async () => {
    try {
      const storedUser = await AsyncStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch {
      // ignore
    }
  };

  const loadPreferences = async () => {
    try {
      const [notif, dark, auto] = await Promise.all([
        AsyncStorage.getItem("pref_notifications"),
        AsyncStorage.getItem("pref_darkMode"),
        AsyncStorage.getItem("pref_autoSave"),
      ]);
      if (notif !== null) setNotifications(JSON.parse(notif));
      if (dark !== null) {
        const enabled = JSON.parse(dark);
        setDarkMode(enabled);
        setTheme(enabled ? darkTheme : lightTheme);
      }
      if (auto !== null) setAutoSave(JSON.parse(auto));
    } catch {
      // ignore
    }
  };

  const toggleNotifications = async () => {
    const value = !notifications;
    setNotifications(value);
    await AsyncStorage.setItem("pref_notifications", JSON.stringify(value));
  };

  const toggleDarkMode = async () => {
    const value = !darkMode;
    setDarkMode(value);
    setTheme(value ? darkTheme : lightTheme);
    await AsyncStorage.setItem("pref_darkMode", JSON.stringify(value));
  };

  const toggleAutoSave = async () => {
    const value = !autoSave;
    setAutoSave(value);
    await AsyncStorage.setItem("pref_autoSave", JSON.stringify(value));
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure?", [
      { text: "Cancel" },
      {
        text: "Logout",
        onPress: async () => {
          await AsyncStorage.removeItem("user");
          await AsyncStorage.removeItem("userToken");
          router.replace("/(auth)");
        },
        style: "destructive",
      },
    ]);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <LinearGradient
        colors={["#A855F7", "#7C3AED"]}
        style={styles.header}
      >
        <Ionicons name="person-circle" size={64} color="#fff" />
        <Text style={styles.name}>{user?.name ?? "User"}</Text>
        <Text style={styles.email}>{user?.email ?? "user@example.com"}</Text>
      </LinearGradient>

      <View style={[styles.section, { backgroundColor: theme.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Account</Text>
        <TouchableOpacity style={styles.item}>
          <Text style={[styles.itemText, { color: theme.text }]}>Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.item}>
          <Text style={[styles.itemText, { color: theme.text }]}>Change Password</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.item}>
          <Text style={[styles.itemText, { color: theme.text }]}>Privacy & Security</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { backgroundColor: theme.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Camera & Photos</Text>
        <View style={styles.itemRow}>
          <Text style={[styles.itemText, { color: theme.text }]}>Auto Save to Gallery</Text>
          <Switch value={autoSave} onValueChange={toggleAutoSave} />
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: theme.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>App Settings</Text>
        <View style={styles.itemRow}>
          <Text style={[styles.itemText, { color: theme.text }]}>Notifications</Text>
          <Switch value={notifications} onValueChange={toggleNotifications} />
        </View>
        <View style={styles.itemRow}>
          <Text style={[styles.itemText, { color: theme.text }]}>Dark Mode</Text>
          <Switch value={darkMode} onValueChange={toggleDarkMode} />
        </View>
        <TouchableOpacity style={styles.item}>
          <Text style={[styles.itemText, { color: theme.text }]}>Language</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { backgroundColor: theme.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Support</Text>
        <TouchableOpacity style={styles.item}>
          <Text style={[styles.itemText, { color: theme.text }]}>Help & Support</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.item}>
          <Text style={[styles.itemText, { color: theme.text }]}>Terms of Service</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.item}>
          <Text style={[styles.itemText, { color: theme.text }]}>Privacy Policy</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.item}>
          <Text style={[styles.itemText, { color: theme.text }]}>About</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingVertical: 40,
    alignItems: "center",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 16,
  },
  name: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 8,
  },
  email: {
    color: "#E5E7EB",
    fontSize: 14,
    marginTop: 4,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  item: {
    paddingVertical: 12,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  itemText: {
    fontSize: 16,
  },
  logoutButton: {
    marginHorizontal: 16,
    backgroundColor: "#F87171",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  logoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

