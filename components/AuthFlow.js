import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

const slides = [
  {
    title: 'Track Your Progress',
    subtitle: 'Take photos and let AI analyze your fitness journey',
    icon: '📷',
    colors: ['#A855F7', '#7C3AED'],
  },
  {
    title: 'AI-Powered Analysis',
    subtitle: 'Get detailed insights about your body transformation',
    icon: '⚡',
    colors: ['#10B981', '#059669'],
  },
  {
    title: 'Stay Motivated',
    subtitle: 'Build streaks and celebrate your achievements',
    icon: '📈',
    colors: ['#F59E0B', '#D97706'],
  },
];

export default function AuthFlow({ onAuthSuccess }) {
  const [step, setStep] = useState(0); // slides followed by login
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    // try to restore authentication state
    const checkToken = async () => {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        onAuthSuccess();
      }
    };
    checkToken();
  }, [onAuthSuccess]);

  const handleNext = () => {
    if (step < slides.length - 1) {
      setStep(step + 1);
    } else {
      // move to login screen
      setStep(slides.length);
    }
  };

  const handleSkip = () => {
    setStep(slides.length);
  };

  const handleAuth = async () => {
    await AsyncStorage.setItem('userToken', 'demo');
    onAuthSuccess();
  };

  if (step < slides.length) {
    const slide = slides[step];
    return (
      <LinearGradient colors={slide.colors} style={styles.introContainer}>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
        <View style={styles.introContent}>
          <View style={styles.iconWrapper}>
            <Text style={styles.icon}>{slide.icon}</Text>
          </View>
          <Text style={styles.introTitle}>{slide.title}</Text>
          <Text style={styles.introSubtitle}>{slide.subtitle}</Text>
        </View>
        <View style={styles.introNavigation}>
          <View style={styles.pagination}>
            {slides.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === step && styles.dotActive]}
              />
            ))}
          </View>
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>
              {step === slides.length - 1 ? 'Get Started' : 'Next →'}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <View style={styles.loginContainer}>
      <View style={styles.loginHeader}>
        <View style={styles.logoBackground}>
          <Text style={styles.logoIcon}>💪</Text>
        </View>
        <Text style={styles.loginTitle}>CaptureFit</Text>
        <Text style={styles.loginSubtitle}>
          {isSignup ? 'Create your account' : 'Welcome back!'}
        </Text>
      </View>
      <View style={styles.form}>
        {isSignup && (
          <View style={styles.inputContainer}>
            <Text style={styles.inputIcon}>👤</Text>
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="#9CA3AF"
              value={name}
              onChangeText={setName}
            />
          </View>
        )}
        <View style={styles.inputContainer}>
          <Text style={styles.inputIcon}>✉️</Text>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.inputIcon}>🔒</Text>
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#9CA3AF"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>
        <TouchableOpacity style={styles.authButton} onPress={handleAuth}>
          <Text style={styles.authButtonText}>
            {isSignup ? 'Create Account' : 'Sign In'}
          </Text>
        </TouchableOpacity>
        <View style={styles.switchRow}>
          <Text style={styles.switchText}>
            {isSignup ? 'Already have an account?' : "Don't have an account?"}
          </Text>
          <TouchableOpacity onPress={() => setIsSignup(!isSignup)}>
            <Text style={styles.switchLink}>
              {isSignup ? 'Sign In' : 'Sign Up'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.loginFooter}>
        <Text style={styles.footerText}>
          By continuing, you agree to our Terms of Service
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  introContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  skipButton: {
    alignSelf: 'flex-end',
  },
  skipText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  introContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  icon: {
    fontSize: 60,
  },
  introTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
  },
  introSubtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  introNavigation: {
    alignItems: 'center',
    gap: 20,
    marginBottom: 10,
  },
  pagination: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dotActive: {
    backgroundColor: 'white',
    width: 20,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  nextButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  loginContainer: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    justifyContent: 'space-between',
  },
  loginHeader: {
    alignItems: 'center',
    marginTop: 40,
  },
  logoBackground: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#A855F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoIcon: {
    fontSize: 30,
    color: 'white',
  },
  loginTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 6,
  },
  loginSubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  form: {
    marginTop: 20,
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  inputIcon: {
    fontSize: 18,
    color: '#9CA3AF',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  authButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  authButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    marginTop: 20,
  },
  switchText: {
    color: '#6B7280',
    fontSize: 14,
  },
  switchLink: {
    color: '#A855F7',
    fontSize: 14,
    fontWeight: '600',
  },
  loginFooter: {
    alignItems: 'center',
    marginBottom: 20,
  },
  footerText: {
    color: '#9CA3AF',
    fontSize: 12,
    textAlign: 'center',
  },
});

