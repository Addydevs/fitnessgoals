import { ThemeContext } from '@/app/_layout';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, router } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function EditProfileScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const themeContext = useContext(ThemeContext);
  const isDarkMode = themeContext?.isDarkMode ?? false;
  const { theme } = useTheme();

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setFullName(parsedUser.fullName || '');
        setEmail(parsedUser.email || '');
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
      Alert.alert('Error', 'Failed to load user profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!fullName || !email) {
      Alert.alert('Error', 'Full Name and Email cannot be empty.');
      return;
    }

    try {
      const updatedUser = { fullName, email };
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      Alert.alert('Success', 'Profile updated successfully!');
      router.back();
    } catch (error) {
      console.error('Failed to save user profile:', error);
      Alert.alert('Error', 'Failed to save profile.');
    }
  };

  // Use a direct fallback value for 'surface'
  const colors = isDarkMode
    ? {
        primary: theme.colors.primary,
        background: theme.colors.background,
        card: theme.colors.card,
        text: theme.colors.text,
        border: theme.colors.border,
        notification: theme.colors.notification,
        surface: '#1F2937',
        textSecondary: theme.colors.text || '#D1D5DB',
        textTertiary: theme.colors.text || '#9CA3AF',
        error: '#EF4444',
      }
    : {
        primary: theme.colors.primary,
        background: theme.colors.background,
        surface: '#0c0b0bff',
        card: theme.colors.card || '#FFFFFF',
        text: theme.colors.text || '#1d1d1eff',
        textSecondary: theme.colors.text || '#0e0e0eff',
        textTertiary: theme.colors.text || '#000000ff',
        border: theme.colors.border || '#E5E7EB',
        error: '#EF4444',
      };

  const insets = useSafeAreaInsets();

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.text, fontSize: 16 }}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Edit Profile',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: 'white',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
          ),
        }}
      />
      <View style={[styles.formContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.label, { color: colors.text }]}>Full Name</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
          value={fullName}
          onChangeText={setFullName}
          placeholder="Enter your full name"
          placeholderTextColor={isDarkMode ? '#161616ff' : colors.textSecondary || '#191919ff'}
        />

        <Text style={[styles.label, { color: colors.text, marginTop: 20 }]}>Email</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email"
          placeholderTextColor={isDarkMode ? '#000000ff' : colors.textSecondary || '#000000ff'}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary }]} onPress={handleSaveProfile}>
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  formContainer: {
    margin: 24,
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  saveButton: {
    marginTop: 30,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});