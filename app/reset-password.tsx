import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../utils/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/constants/theme';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { access_token, refresh_token } = useLocalSearchParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (access_token && refresh_token) {
      // Set the session with the tokens from the URL
      supabase.auth.setSession({
        access_token: access_token as string,
        refresh_token: refresh_token as string,
      });
    }
  }, [access_token, refresh_token]);

  const validatePassword = (pwd: string) => {
    if (pwd.length < 8) return "Password must be at least 8 characters.";
    if (!/[A-Z]/.test(pwd)) return "Password must include an uppercase letter.";
    if (!/[a-z]/.test(pwd)) return "Password must include a lowercase letter.";
    if (!/[0-9]/.test(pwd)) return "Password must include a number.";
    if (!/[!@#$%^&*(),.?\":{}|<>\[\]\\/;'`~_-]/.test(pwd)) return "Password must include a special character.";
    return "";
  };

  const handleResetPassword = async () => {
    setLoading(true);
    setMessage('');

    // Validate password
    const passwordValidation = validatePassword(newPassword);
    if (passwordValidation) {
      setMessage(passwordValidation);
      setLoading(false);
      return;
    }

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      Alert.alert(
        'Success',
        'Your password has been reset successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(auth)/auth')
          }
        ]
      );
    } catch (error: any) {
      setMessage(error.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
    >
      <View style={styles.form}>
        <Text style={styles.title}>Reset Your Password</Text>
        <Text style={styles.subtitle}>Enter your new password below</Text>

        <TextInput
          placeholder="New Password"
          value={newPassword}
          onChangeText={setNewPassword}
          style={styles.input}
          placeholderTextColor="#9CA3AF"
          secureTextEntry
          autoCapitalize="none"
        />

        <TextInput
          placeholder="Confirm New Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          style={styles.input}
          placeholderTextColor="#9CA3AF"
          secureTextEntry
          autoCapitalize="none"
        />

        {message ? (
          <Text style={[styles.message, { color: message.includes('Success') ? 'green' : 'red' }]}>
            {message}
          </Text>
        ) : null}

        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleResetPassword}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Updating...' : 'Reset Password'}
          </Text>
        </Pressable>

        <Pressable
          style={styles.cancelButton}
          onPress={() => router.replace('/(auth)/auth')}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  form: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 15,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
  },
  message: {
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 14,
  },
  button: {
    backgroundColor: theme.colors.primary,
    padding: 15,
    borderRadius: 8,
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  cancelButton: {
    padding: 12,
  },
  cancelText: {
    color: '#6B7280',
    fontSize: 16,
    textAlign: 'center',
  },
});