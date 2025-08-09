import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Switch, ScrollView, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

interface User {
  name: string;
  email: string;
}

export default function SettingsScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [autoSave, setAutoSave] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const userData = await AsyncStorage.getItem('user');
      if (userData) setUser(JSON.parse(userData));
    };
    loadUser();
  }, []);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('user');
          router.replace('/(auth)');
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, isDarkMode && styles.darkContainer]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <LinearGradient colors={['#A855F7', '#7C3AED']} style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Settings</Text>
          </View>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'U'}</Text>
            </View>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email || ''}</Text>
          </View>
        </LinearGradient>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <TouchableOpacity style={styles.item}>
            <Text style={styles.itemText}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.item}>
            <Text style={styles.itemText}>Change Password</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.item}>
            <Text style={styles.itemText}>Privacy & Security</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Camera & Photos</Text>
          <View style={styles.item}>
            <Text style={styles.itemText}>Auto Save to Gallery</Text>
            <Switch value={autoSave} onValueChange={setAutoSave} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          <View style={styles.item}>
            <Text style={styles.itemText}>Notifications</Text>
            <Switch value={notifications} onValueChange={setNotifications} />
          </View>
          <View style={styles.item}>
            <Text style={styles.itemText}>Dark Mode</Text>
            <Switch value={isDarkMode} onValueChange={setIsDarkMode} />
          </View>
          <TouchableOpacity style={styles.item}>
            <Text style={styles.itemText}>Language</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <TouchableOpacity style={styles.item}>
            <Text style={styles.itemText}>Help & Support</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.item}>
            <Text style={styles.itemText}>Terms of Service</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.item}>
            <Text style={styles.itemText}>Privacy Policy</Text>
          </TouchableOpacity>
          <View style={styles.item}>
            <Text style={styles.itemText}>About</Text>
            <Text style={styles.versionText}>Version 1.0.0</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  darkContainer: {
    backgroundColor: '#1F2937',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginRight: 40,
  },
  userInfo: {
    marginTop: 24,
    alignItems: 'center',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#C4B5FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '700',
  },
  userName: {
    marginTop: 12,
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  userEmail: {
    marginTop: 4,
    color: '#E9D5FF',
    fontSize: 14,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 12,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
  },
  itemText: {
    fontSize: 16,
    color: '#111827',
  },
  versionText: {
    fontSize: 14,
    color: '#6B7280',
  },
  logoutButton: {
    marginTop: 32,
    marginHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

