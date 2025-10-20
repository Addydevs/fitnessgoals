import { theme } from "@/constants/theme";
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from 'expo-linking';
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, useColorScheme, View } from "react-native";
import { supabase } from '../../utils/supabase';

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const inputTextColor = isDark ? "#F3F4F6" : theme.colors.text;
  const inputBgColor = isDark ? "#1F2937" : "#fff";
  const placeholderColor = isDark ? "#9CA3AF" : "#6B7280";

  const handleSendResetEmail = async () => {
    setFeedback("");
    if (!email || !email.includes('@')) {
      setFeedback('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      // Get the redirect URL based on environment
      let redirectTo: string;

      if (__DEV__) {
        // Development mode: Use Expo Go URL
        // For Expo Go, use exp:// scheme with the dev server URL

        // Get the Expo dev server URL from Constants
        const devUrl = Constants.expoConfig?.hostUri || '192.168.1.24:8881';

        // Build the URL for Expo Go
        // Format: exp://IP:PORT/--/(auth)/reset-password
        redirectTo = `exp://${devUrl}/--/(auth)/reset-password`;

        console.log('Development mode - Expo Go URL:', redirectTo);
        console.log('Dev server:', devUrl);
      } else {
        // Production mode: Use custom scheme
        redirectTo = 'capturefit://reset-password';
        console.log('Production mode - Custom scheme:', redirectTo);
      }

      // Use Supabase's password reset with the appropriate redirect
      console.log('==========================================');
      console.log('SENDING PASSWORD RESET EMAIL');
      console.log('Email:', email);
      console.log('Redirect URL:', redirectTo);
      console.log('==========================================');

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) {
        console.error('Reset password error:', error);
      } else {
        console.log('✅ Reset email sent successfully!');
      }

      if (error) {
        // If it fails due to email/SMTP configuration, show helpful message
        if (error.message.includes('email') || error.message.includes('mail') || error.message.includes('sending')) {
          setFeedback('⚠️ Unable to send password reset email.\n\nPossible issues:\n• Custom SMTP not fully configured\n• SMTP credentials expired\n• Email provider blocking requests\n\nPlease contact your administrator or support for assistance.');

          console.error('\n=== SMTP EMAIL ERROR ===');
          console.error('The custom SMTP configuration may have issues:');
          console.error('');
          console.error('Quick Checks:');
          console.error('1. Verify Email provider is ENABLED:');
          console.error('   https://supabase.com/dashboard/project/vpnitpweduycfmndmxsf/auth/providers');
          console.error('');
          console.error('2. Check SMTP settings are complete:');
          console.error('   https://supabase.com/dashboard/project/vpnitpweduycfmndmxsf/settings/auth');
          console.error('   - SMTP Host, Port, Username, Password must all be set');
          console.error('   - Sender Email must be verified with your SMTP provider');
          console.error('');
          console.error('3. Test if signup emails work (if they do, SMTP is OK)');
          console.error('');
          console.error('4. Check Supabase logs for detailed errors:');
          console.error('   https://supabase.com/dashboard/project/vpnitpweduycfmndmxsf/logs/explorer');
          console.error('');
          console.error('5. If using Gmail: Use App Password, not regular password');
          console.error('   Generate at: https://myaccount.google.com/apppasswords');
          console.error('');
          console.error('Admin workaround: Reset user password manually in Supabase Dashboard');
          console.error('https://supabase.com/dashboard/project/vpnitpweduycfmndmxsf/auth/users');
          console.error('========================\n');
        } else {
          throw error;
        }
      } else {
        setEmailSent(true);
        setFeedback('✓ Password reset email sent! Please check your inbox and click the link to reset your password.');
      }
    } catch (error: any) {
      console.error('Send reset email error:', error);
      setFeedback(error.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={["#b0c6ff", "#e0c3fc"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientBg}
    >
      <View style={styles.card}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </Pressable>

        <Text style={styles.title}>Reset Password</Text>

        {!emailSent ? (
          <>
            <Text style={styles.description}>
              Enter your email address and we'll send you instructions to reset your password.
            </Text>

            <TextInput
              placeholder="Email Address"
              value={email}
              onChangeText={setEmail}
              style={[styles.input, { color: inputTextColor, backgroundColor: inputBgColor }]}
              placeholderTextColor={placeholderColor}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />

            <Pressable
              style={[styles.resetButton, loading && styles.resetButtonDisabled]}
              onPress={handleSendResetEmail}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.resetButtonText}>Send Reset Link</Text>
              )}
            </Pressable>
          </>
        ) : (
          <>
            <View style={styles.successIcon}>
              <Ionicons name="mail-outline" size={64} color={theme.colors.primary} />
            </View>
            <Text style={styles.successText}>
              Check your email for password reset instructions.
            </Text>
            <Pressable
              style={styles.resendButton}
              onPress={() => {
                setEmailSent(false);
                setFeedback("");
              }}
            >
              <Text style={styles.resendButtonText}>Didn't receive the email? Try again</Text>
            </Pressable>
          </>
        )}

        {feedback && (
          <Text style={[
            styles.feedback,
            { color: feedback.includes('✓') ? 'green' : 'red' }
          ]}>
            {feedback}
          </Text>
        )}

        <Pressable onPress={() => router.back()} style={styles.backToLogin}>
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
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 8,
    padding: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
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
    marginBottom: 16,
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
  successIcon: {
    alignSelf: 'center',
    marginVertical: 16,
  },
  successText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  resendButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  resendButtonText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '600',
  },
  feedback: {
    textAlign: 'center',
    marginBottom: 12,
    fontSize: 14,
  },
  backToLogin: {
    marginTop: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  backToLoginText: {
    color: '#6B7280',
    fontSize: 15,
    fontWeight: '600',
  },
});

