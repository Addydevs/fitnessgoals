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
  const [passwordError, setPasswordError] = useState("");
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
    if (mode === 'signup') setPasswordError(validatePassword(pwd));
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
      console.log('❌ Login error:', error);
    }
  };

  const handleSignup = async () => {
    setFeedback("");
    if (validatePassword(password)) {
      setFeedback(validatePassword(password));
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
        console.log('No session available after signup; profile upsert skipped. User may need to confirm email.');
      }
      await AsyncStorage.setItem('user', JSON.stringify({ fullName: name, email }));
      try { emitUserChange({ fullName: name, email, avatar: null }); } catch (e) { console.warn('emitUserChange failed:', e); }
      if (session?.access_token) {
        if (!signIn) throw new Error('Auth context not available');
        await signIn(session.access_token);
        setFeedback('Signup successful!');
        router.replace('/(tabs)/homepage');
      } else {
        setFeedback('Check your email to confirm your account before logging in.');
        setMode('login');
      }
    } catch (error: any) {
      setFeedback(error.message || 'Network error. Please try again.');
      console.log('❌ Signup error:', error);
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
          <TextInput
            placeholder="Full Name"
            value={name}
            onChangeText={setName}
            style={[styles.input, { color: inputTextColor, backgroundColor: inputBgColor }]}
            placeholderTextColor={placeholderColor}
          />
        )}
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
        {mode === 'signup' && passwordError ? (
          <Text style={{ color: 'red', marginBottom: 4 }}>{passwordError}</Text>
        ) : null}
        {mode === 'login' && (
          <Pressable onPress={() => setFeedback('Please contact support to reset your password.') /* Replace with real flow */}>
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