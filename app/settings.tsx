import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  ScrollView,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useColorSchemeContext } from '@/hooks/useColorScheme';

interface User {
  name: string;
  email?: string;
  avatar?: string;
}

const SettingsScreen = () => {
  const [user, setUser] = useState<User | null>(null);
  const [autoSave, setAutoSave] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const { colorScheme, setColorScheme } = useColorSchemeContext();

  useEffect(() => {
    const loadSettings = async () => {
      const userData = await AsyncStorage.getItem('user');
      if (userData) setUser(JSON.parse(userData));
      const auto = await AsyncStorage.getItem('autoSave');
      if (auto !== null) setAutoSave(auto === 'true');
      const notif = await AsyncStorage.getItem('notifications');
      if (notif !== null) setNotifications(notif === 'true');
    };
    loadSettings();
  }, []);

  useEffect(() => {
    setDarkMode(colorScheme === 'dark');
  }, [colorScheme]);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel' },
      {
        text: 'Logout',
        onPress: async () => {
          await AsyncStorage.removeItem('user');
          router.replace('/(auth)');
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentInsetAdjustmentBehavior="automatic">
      <LinearGradient colors={['#A855F7', '#7C3AED']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={styles.placeholder} />
        </View>
        {user && (
          <View style={styles.userInfo}>
            <Image
              source={
                user.avatar
                  ? { uri: user.avatar }
                  : require('../assets/images/icon.png')
              }
              style={styles.avatar}
            />
            <Text style={styles.userName}>{user.name}</Text>
            {user.email && <Text style={styles.userEmail}>{user.email}</Text>}
          </View>
        )}
      </LinearGradient>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity style={styles.row}>
          <Text style={styles.rowText}>Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.row}>
          <Text style={styles.rowText}>Change Password</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.row}>
          <Text style={styles.rowText}>Privacy & Security</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Camera & Photos</Text>
        <View style={styles.row}>
          <Text style={styles.rowText}>Auto Save to Gallery</Text>
          <Switch
            value={autoSave}
            onValueChange={async (v) => {
              setAutoSave(v);
              await AsyncStorage.setItem('autoSave', v.toString());
            }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Settings</Text>
        <View style={styles.row}>
          <Text style={styles.rowText}>Notifications</Text>
          <Switch
            value={notifications}
            onValueChange={async (v) => {
              setNotifications(v);
              await AsyncStorage.setItem('notifications', v.toString());
            }}
          />
        </View>
        <View style={styles.row}>
          <Text style={styles.rowText}>Dark Mode</Text>
          <Switch
            value={darkMode}
            onValueChange={(v) => {
              setDarkMode(v);
              setColorScheme(v ? 'dark' : 'light');
            }}
          />
        </View>
        <TouchableOpacity style={styles.row}>
          <Text style={styles.rowText}>Language</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        <TouchableOpacity style={styles.row}>
          <Text style={styles.rowText}>Help & Support</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.row}>
          <Text style={styles.rowText}>Terms of Service</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.row}>
          <Text style={styles.rowText}>Privacy Policy</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.row}>
          <Text style={styles.rowText}>About (Version 1.0.0)</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 24,
  },
  userInfo: {
    alignItems: 'center',
    marginTop: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  userName: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 8,
  },
  userEmail: {
    color: 'white',
    opacity: 0.8,
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionTitle: {
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  rowText: {
    color: '#374151',
    fontSize: 16,
  },
  logoutButton: {
    margin: 24,
    paddingVertical: 12,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default SettingsScreen;
