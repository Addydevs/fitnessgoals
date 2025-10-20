import { AuthContext } from "@/app/_layout";
import { theme } from "@/constants/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useContext, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, useColorScheme, View } from "react-native";
import { supabase } from '../../utils/supabase';
import { emitUserChange } from '../../utils/userEvents';

export default function Auth() {
  const auth = useContext(AuthContext);
  const signIn = auth?.signIn;
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendError, setResendError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const inputTextColor = isDark ? "#F3F4F6" : theme.colors.text;
  const inputBgColor = isDark ? "#1F2937" : "#fff";
  const placeholderColor = isDark ? "#9CA3AF" : "#6B7280";

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
    setPassword(pwd);
    if (mode === 'signup') {
      setPasswordError(validatePassword(pwd));
      if (confirmPassword && pwd !== confirmPassword) {
        setConfirmError("Passwords do not match.");
      } else {
        setConfirmError("");
      }
    }
  };

  const handleForgotPassword = async () => {
    setResetLoading(true);
    setResetMessage("");
    
    if (!resetEmail.trim()) {
      setResetMessage("Please enter your email address.");
      setResetLoading(false);
      return;
    }

    try {
      console.log('Attempting to send reset email to:', resetEmail);
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: __DEV__ ? 'http://localhost:8081/reset-password' : 'capturefit://reset-password'
      });
      
      if (error) {
        console.error('Reset email error:', error);
        throw error;
      }
      
      console.log('Reset email sent successfully');
      setResetMessage("Password reset email sent! Check your inbox and follow the link to reset your password.");
      setTimeout(() => {
        setShowResetModal(false);
        setResetEmail("");
        setResetMessage("");
      }, 3000);
    } catch (error: any) {
      console.error('Catch block error:', error);
      setResetMessage(error.message || "Failed to send reset email. Please try again.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleLogin = async () => {
    setFeedback("");
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const session = data.session;
      const user = data.user;
      await AsyncStorage.setItem('user', JSON.stringify({ fullName: user?.user_metadata?.fullName || user?.user_metadata?.full_name || '', email: user?.email }));
      try { emitUserChange({ fullName: user?.user_metadata?.fullName || user?.user_metadata?.full_name || '', email: user?.email, avatar: null }); } catch (e) { console.warn('emitUserChange failed:', e); }
      if (!signIn) throw new Error('Auth context not available');
      await signIn(session?.access_token ?? '');
      setFeedback('Login successful!');
      router.replace('/(tabs)/homepage');
    } catch (error: any) {
      setFeedback(error.message || 'Network error. Please try again.');
  // ...removed console.log...
    }
  };

  const handleSignup = async () => {
  setFeedback("");
  setResendError("");
  if (validatePassword(password)) {
    setFeedback(validatePassword(password));
    return;
  }
  if (password !== confirmPassword) {
    setConfirmError("Passwords do not match.");
    setFeedback("Passwords do not match.");
    return;
  }
    try {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { fullName: name } } });
      if (error) throw error;
      let user = (data as any)?.user ?? null;
      let session = (data as any)?.session ?? null;
      if (!session) {
        try {
          const signInRes = await supabase.auth.signInWithPassword({ email, password });
          if (!signInRes.error) {
            session = signInRes.data.session ?? null;
            user = signInRes.data.user ?? user;
          }
        } catch (inner) {
          console.warn('signInWithPassword after signUp failed:', inner);
        }
      }
      if (user?.id && session?.access_token) {
        try {
          await supabase.from('profiles').upsert({ id: user.id, full_name: name });
        } catch (upsertErr) {
          console.warn('Failed to upsert profile immediately after signup:', upsertErr);
        }
      } else {
  // ...removed console.log...
      }
      await AsyncStorage.setItem('user', JSON.stringify({ fullName: name, email }));
      try { emitUserChange({ fullName: name, email, avatar: null }); } catch (e) { console.warn('emitUserChange failed:', e); }
      if (session?.access_token) {
        if (!signIn) throw new Error('Auth context not available');
        await signIn(session.access_token);
        setFeedback('Signup successful!');
        router.replace('/(tabs)/homepage');
      } else {
        setShowConfirmModal(true);
        setMode('login');
      }
    } catch (error: any) {
      setFeedback(error.message || 'Network error. Please try again.');
  // ...removed console.log...
    }
  // Resend confirmation email
  const handleResendEmail = async () => {
    setResendLoading(true);
    setResendError("");
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) throw error;
      setResendError("Confirmation email resent! Check your inbox.");
    } catch (err: any) {
      setResendError(err.message || "Failed to resend email.");
    } finally {
      setResendLoading(false);
    }
  };
  };

  return (
    <LinearGradient
      colors={["#b0c6ff", "#e0c3fc"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientBg}
    >
      <View style={styles.card}>
        <Text style={styles.title}>CAPTUREFIT</Text>
        <View style={styles.toggleRow}>
          <Pressable
            style={[styles.toggleButton, mode === 'login' && styles.toggleActive]}
            onPress={() => setMode('login')}
          >
            <Text style={[styles.toggleText, mode === 'login' && styles.toggleTextActive]}>Login</Text>
          </Pressable>
          <Pressable
            style={[styles.toggleButton, mode === 'signup' && styles.toggleActive]}
            onPress={() => setMode('signup')}
          >
            <Text style={[styles.toggleText, mode === 'signup' && styles.toggleTextActive]}>Signup</Text>
          </Pressable>
        </View>
        {mode === 'signup' && (
        
          <>
            <TextInput
              placeholder="Full Name"
              value={name}
              onChangeText={setName}
              style={[styles.input, { color: inputTextColor, backgroundColor: inputBgColor }]}
              placeholderTextColor={placeholderColor}
            />
            <TextInput
              placeholder="Email Address"
              value={email}
              onChangeText={setEmail}
              style={[styles.input, { color: inputTextColor, backgroundColor: inputBgColor }]}
              placeholderTextColor={placeholderColor}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              placeholder="Password"
              value={password}
              onChangeText={handlePasswordChange}
              style={[styles.input, { color: inputTextColor, backgroundColor: inputBgColor }]}
              placeholderTextColor={placeholderColor}
              secureTextEntry
            />
            <TextInput
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={text => {
                setConfirmPassword(text);
                if (password !== text) {
                  setConfirmError("Passwords do not match.");
                } else {
                  setConfirmError("");
                }
              }}
              style={[styles.input, { color: inputTextColor, backgroundColor: inputBgColor }]}
              placeholderTextColor={placeholderColor}
              secureTextEntry
            />
            {confirmError ? (
              <Text style={{ color: 'red', marginBottom: 4 }}>{confirmError}</Text>
            ) : null}
            {passwordError ? (
              <Text style={{ color: 'red', marginBottom: 4 }}>{passwordError}</Text>
            ) : null}
          </>
        )}
        {mode === 'login' && (
          <>
            <TextInput
              placeholder="Email Address"
              value={email}
              onChangeText={setEmail}
              style={[styles.input, { color: inputTextColor, backgroundColor: inputBgColor }]}
              placeholderTextColor={placeholderColor}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              placeholder="Password"
              value={password}
              onChangeText={handlePasswordChange}
              style={[styles.input, { color: inputTextColor, backgroundColor: inputBgColor }]}
              placeholderTextColor={placeholderColor}
              secureTextEntry
            />
          </>
        )}
        {mode === 'login' && (
          <Pressable onPress={() => setShowResetModal(true)}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </Pressable>
        )}
        <Pressable
          style={styles.loginButton}
          onPress={mode === 'login' ? handleLogin : handleSignup}
        >
          <Text style={styles.loginButtonText}>{mode === 'login' ? 'Login' : 'Signup'}</Text>
        </Pressable>
        <Text style={{ color: feedback.includes('successful') ? 'green' : 'red', textAlign: 'center', marginBottom: 10 }}>{feedback}</Text>
        <Text style={styles.switchRow}>
          {mode === 'login' ? (
            <>Create an account <Text style={styles.link} onPress={() => setMode('signup')}>Signup now</Text></>
          ) : (
            <>Already have an account? <Text style={styles.link} onPress={() => setMode('login')}>Login</Text></>
          )}
        </Text>
        {/* Confirmation Modal */}
        {/*
        {showConfirmModal && (
          <View style={styles.confirmModal}>
            <Text style={styles.confirmTitle}>Confirm your email</Text>
            <Text style={styles.confirmText}>
              We&apos;ve sent a confirmation link to your email address. Please check your inbox and click the link to activate your account. After confirming, you can log in.
            </Text>
            <Pressable style={styles.resendButton} onPress={handleResendEmail} disabled={resendLoading}>
              <Text style={styles.resendButtonText}>{resendLoading ? 'Resending...' : 'Resend confirmation email'}</Text>
            </Pressable>
            {resendError ? <Text style={{ color: resendError.includes('resent') ? 'green' : 'red', marginTop: 6 }}>{resendError}</Text> : null}
            <Pressable style={styles.closeModalButton} onPress={() => setShowConfirmModal(false)}>
              <Text style={styles.closeModalText}>Close</Text>
            </Pressable>
          </View>
        )}
        */}
        
        {/* Reset Password Modal */}
        {showResetModal && (
          <View style={styles.confirmModal}>
            <View style={styles.resetModalContent}>
              <Text style={styles.confirmTitle}>Reset Password</Text>
              <Text style={styles.confirmText}>
                Enter your email address and we'll send you a link to reset your password.
              </Text>
              <TextInput
                placeholder="Email Address"
                value={resetEmail}
                onChangeText={setResetEmail}
                style={[styles.input, { color: inputTextColor, backgroundColor: inputBgColor, marginBottom: 16 }]}
                placeholderTextColor={placeholderColor}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {resetMessage ? (
                <Text style={{ color: resetMessage.includes('sent') ? 'green' : 'red', marginBottom: 16, textAlign: 'center' }}>
                  {resetMessage}
                </Text>
              ) : null}
              <Pressable style={styles.resendButton} onPress={handleForgotPassword} disabled={resetLoading}>
                <Text style={styles.resendButtonText}>{resetLoading ? 'Sending...' : 'Send Reset Email'}</Text>
              </Pressable>
              <Pressable style={styles.closeModalButton} onPress={() => {
                setShowResetModal(false);
                setResetEmail("");
                setResetMessage("");
              }}>
                <Text style={styles.closeModalText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  confirmModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    padding: 24,
    borderRadius: 20,
  },
  resetModalContent: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
  },
  confirmTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
    textAlign: 'center',
  },
  confirmText: {
    fontSize: 16,
    color: '#000',
    marginBottom: 18,
    textAlign: 'center',
  },
  resendButton: {
    backgroundColor: '#4f46e5',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    marginBottom: 8,
  },
  resendButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  closeModalButton: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 8,
    marginTop: 8,
  },
  closeModalText: {
    color: '#4f46e5',
    fontWeight: '600',
    fontSize: 16,
  },
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
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 18,
    color: theme.colors.text,
  },
  toggleRow: {
    flexDirection: 'row',
    marginBottom: 18,
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    overflow: 'hidden',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  toggleActive: {
    backgroundColor: '#2563eb',
  },
  toggleText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  toggleTextActive: {
    color: 'white',
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 10,
  },
  forgotText: {
    color: '#2563eb',
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'right',
  },
  loginButton: {
    // backgroundColor: 'linear-gradient(90deg, #2563eb 0%, #1e40af 100%)', // not supported in RN
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  loginButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  switchRow: {
    textAlign: 'center',
    marginTop: 10,
    color: '#6B7280',
    fontSize: 15,
  },
  link: {
    color: '#2563eb',
    fontWeight: '700',
  },
});