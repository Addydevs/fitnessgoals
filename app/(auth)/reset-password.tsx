import { theme } from "@/constants/theme";
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, useColorScheme, View } from "react-native";
import { supabase } from '../../utils/supabase';

export default function ResetPassword() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [sessionChecked, setSessionChecked] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const inputTextColor = isDark ? "#F3F4F6" : theme.colors.text;
  const inputBgColor = isDark ? "#1F2937" : "#fff";
  const placeholderColor = isDark ? "#9CA3AF" : "#6B7280";

  // Check if user has a valid session for password reset
  React.useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('Reset password - checking session:', session?.user?.email);

        if (session) {
          setHasSession(true);
          console.log('✅ Valid session found for password reset');
        } else {
          console.log('❌ No session found');
          setFeedback('Session expired or invalid. Please request a new password reset link.');
        }
      } catch (error) {
        console.error('Error checking session:', error);
        setFeedback('Error verifying session. Please try again.');
      } finally {
        setSessionChecked(true);
      }
    };

    checkSession();
  }, []);

  // Password validation function
  const validatePassword = (pwd: string) => {
    if (pwd.length < 8) return "Password must be at least 8 characters.";
    if (!/[A-Z]/.test(pwd)) return "Password must include an uppercase letter.";
    if (!/[a-z]/.test(pwd)) return "Password must include a lowercase letter.";
    if (!/[0-9]/.test(pwd)) return "Password must include a number.";
    if (!/[!@#$%^&*(),.?\":{}|<>\[\]\\/;'`~_-]/.test(pwd)) return "Password must include a special character.";
    return "";
  };

  const handlePasswordChange = (pwd: string) => {
    setNewPassword(pwd);
    setPasswordError(validatePassword(pwd));
    if (confirmPassword && pwd !== confirmPassword) {
      setConfirmError("Passwords do not match.");
    } else {
      setConfirmError("");
    }
  };

  const handleConfirmPasswordChange = (pwd: string) => {
    setConfirmPassword(pwd);
    if (newPassword !== pwd) {
      setConfirmError("Passwords do not match.");
    } else {
      setConfirmError("");
    }
  };

  const handleResetPassword = async () => {
    setFeedback("");
    
    // Validate password
    const validationError = validatePassword(newPassword);
    if (validationError) {
      setFeedback(validationError);
      return;
    }
    
    // Check if passwords match
    if (newPassword !== confirmPassword) {
      setConfirmError("Passwords do not match.");
      setFeedback("Passwords do not match.");
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      
      if (error) throw error;

      setFeedback('Password updated successfully! Redirecting to login...');

      // Clear password recovery flag
      await AsyncStorage.removeItem('passwordRecovery');

      // Sign out to clear the temporary recovery session
      await supabase.auth.signOut();

      // Redirect to login after 1.5 seconds
      setTimeout(() => {
        router.replace('/(auth)/auth');
      }, 1500);
    } catch (error: any) {
      setFeedback(error.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking session
  if (!sessionChecked) {
    return (
      <LinearGradient
        colors={["#b0c6ff", "#e0c3fc"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBg}
      >
        <View style={styles.card}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.description, { marginTop: 16 }]}>
            Verifying your session...
          </Text>
        </View>
      </LinearGradient>
    );
  }

  // Show error if no session
  if (!hasSession) {
    return (
      <LinearGradient
        colors={["#b0c6ff", "#e0c3fc"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBg}
      >
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
          </View>

          <Text style={styles.title}>Session Expired</Text>
          <Text style={styles.description}>
            {feedback || 'Your password reset link has expired or is invalid. Please request a new one.'}
          </Text>

          <Pressable
            style={styles.resetButton}
            onPress={() => router.replace('/(auth)/forgot-password')}
          >
            <Text style={styles.resetButtonText}>Request New Link</Text>
          </Pressable>

          <Pressable onPress={() => router.replace('/(auth)/auth')} style={styles.backToLogin}>
            <Text style={styles.backToLoginText}>Back to Login</Text>
          </Pressable>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#b0c6ff", "#e0c3fc"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientBg}
    >
      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <Ionicons name="lock-closed-outline" size={48} color={theme.colors.primary} />
        </View>

        <Text style={styles.title}>Set New Password</Text>
        <Text style={styles.description}>
          Please enter your new password below.
        </Text>
        
        <TextInput
          placeholder="New Password"
          value={newPassword}
          onChangeText={handlePasswordChange}
          style={[styles.input, { color: inputTextColor, backgroundColor: inputBgColor }]}
          placeholderTextColor={placeholderColor}
          secureTextEntry
          editable={!loading}
        />
        {passwordError ? (
          <Text style={styles.errorText}>{passwordError}</Text>
        ) : null}
        
        <TextInput
          placeholder="Confirm New Password"
          value={confirmPassword}
          onChangeText={handleConfirmPasswordChange}
          style={[styles.input, { color: inputTextColor, backgroundColor: inputBgColor }]}
          placeholderTextColor={placeholderColor}
          secureTextEntry
          editable={!loading}
        />
        {confirmError ? (
          <Text style={styles.errorText}>{confirmError}</Text>
        ) : null}
        
        <View style={styles.requirementsBox}>
          <Text style={styles.requirementsTitle}>Password must contain:</Text>
          <Text style={styles.requirementItem}>• At least 8 characters</Text>
          <Text style={styles.requirementItem}>• One uppercase letter</Text>
          <Text style={styles.requirementItem}>• One lowercase letter</Text>
          <Text style={styles.requirementItem}>• One number</Text>
          <Text style={styles.requirementItem}>• One special character</Text>
        </View>
        
        <Pressable
          style={[styles.resetButton, loading && styles.resetButtonDisabled]}
          onPress={handleResetPassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.resetButtonText}>Update Password</Text>
          )}
        </Pressable>
        
        {feedback && (
          <Text style={[
            styles.feedback, 
            { color: feedback.includes('successfully') ? 'green' : 'red' }
          ]}>
            {feedback}
          </Text>
        )}
        
        <Pressable onPress={() => router.replace('/(auth)/auth')} style={styles.backToLogin}>
          <Text style={styles.backToLoginText}>Back to Login</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientBg: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  card: {
    width: 340,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 10,
    alignItems: 'stretch',
    marginVertical: 32,
  },
  iconContainer: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    color: theme.colors.text,
  },
  description: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 8,
  },
  errorText: {
    color: 'red',
    fontSize: 13,
    marginBottom: 8,
    marginLeft: 4,
  },
  requirementsBox: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  requirementsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  requirementItem: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  resetButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  resetButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  resetButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  feedback: {
    textAlign: 'center',
    marginBottom: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  backToLogin: {
    marginTop: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  backToLoginText: {
    color: '#6B7280',
    fontSize: 15,
    fontWeight: '600',
  },
});

