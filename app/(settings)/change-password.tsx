import { ThemeContext } from '@/app/_layout';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import React, { useContext, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ChangePasswordScreen() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const themeContext = useContext(ThemeContext);
  const isDarkMode = themeContext?.isDarkMode ?? false;

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      Alert.alert('Error', 'All fields are required.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      Alert.alert('Error', 'New password and confirm new password do not match.');
      return;
    }

    // In a real application, you would send this to your backend for validation and update
    // For this example, we'll simulate a successful change
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      Alert.alert('Success', 'Password changed successfully!');
      router.back();
    } catch (error) {
      console.error('Failed to change password:', error);
      Alert.alert('Error', 'Failed to change password. Please try again.');
    }
  };

  const colors = isDarkMode
    ? {
        primary: '#A855F7',
        primaryDark: '#7C3AED',
        background: '#111827',
        surface: '#1F2937',
        card: '#374151',
        text: '#F9FAFB',
        textSecondary: '#D1D5DB',
        textTertiary: '#9CA3AF',
        border: '#4B5563',
        error: '#EF4444',
      }
    : {
        primary: '#A855F7',
        primaryDark: '#7C3AED',
        background: '#FFFFFF',
        surface: '#F9FAFB',
        card: '#FFFFFF',
        text: '#1F2937',
        textSecondary: '#6B7280',
        textTertiary: '#9CA3AF',
        border: '#E5E7EB',
        error: '#EF4444',
      };

  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Change Password',
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
        <Text style={[styles.label, { color: colors.text }]}>Current Password</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
          value={currentPassword}
          onChangeText={setCurrentPassword}
          placeholder="Enter current password"
          placeholderTextColor={colors.textSecondary}
          secureTextEntry
        />

        <Text style={[styles.label, { color: colors.text, marginTop: 20 }]}>New Password</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="Enter new password"
          placeholderTextColor={colors.textSecondary}
          secureTextEntry
        />

        <Text style={[styles.label, { color: colors.text, marginTop: 20 }]}>Confirm New Password</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
          value={confirmNewPassword}
          onChangeText={setConfirmNewPassword}
          placeholder="Confirm new password"
          placeholderTextColor={colors.textSecondary}
          secureTextEntry
        />

        <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary }]} onPress={handleChangePassword}>
          <Text style={styles.saveButtonText}>Change Password</Text>
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