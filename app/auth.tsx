import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

export default function Auth() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const router = useRouter();

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
  };

  const handleAuth = () => {
    router.replace('/camera');
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'white', padding: 20 }}>
      <View style={{ alignItems: 'center', marginTop: 40 }}>
        <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: '#A855F7', justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
          <Text style={{ fontSize: 30, color: 'white' }}>💪</Text>
        </View>
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#1F2937' }}>CaptureFit</Text>
        <Text style={{ fontSize: 16, color: '#6B7280', marginTop: 6 }}>
          {mode === 'signin' ? 'Welcome back!' : 'Create your account'}
        </Text>
      </View>

      <View style={{ flex: 1, marginTop: 40 }}>
        {mode === 'signup' && (
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, marginBottom: 16 }}>
            <Text style={{ fontSize: 18, color: '#9CA3AF', marginRight: 12 }}>👤</Text>
            <TextInput placeholder="Full Name" style={{ flex: 1, fontSize: 16, color: '#1F2937' }} placeholderTextColor="#9CA3AF" />
          </View>
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, marginBottom: 16 }}>
          <Text style={{ fontSize: 18, color: '#9CA3AF', marginRight: 12 }}>✉️</Text>
          <TextInput placeholder="Email" keyboardType="email-address" style={{ flex: 1, fontSize: 16, color: '#1F2937' }} placeholderTextColor="#9CA3AF" />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16 }}>
          <Text style={{ fontSize: 18, color: '#9CA3AF', marginRight: 12 }}>🔒</Text>
          <TextInput placeholder="Password" secureTextEntry style={{ flex: 1, fontSize: 16, color: '#1F2937' }} placeholderTextColor="#9CA3AF" />
        </View>

        <TouchableOpacity onPress={handleAuth} style={{ marginTop: 16 }}>
          <LinearGradient colors={['#A855F7', '#7C3AED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 12, padding: 16 }}>
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '600', textAlign: 'center' }}>
              {mode === 'signin' ? 'Sign In' : 'Create Account'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20 }}>
          <Text style={{ color: '#6B7280', fontSize: 14 }}>
            {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}
          </Text>
          <TouchableOpacity onPress={toggleMode}>
            <Text style={{ color: '#A855F7', fontSize: 14, fontWeight: '600', marginLeft: 4 }}>
              {mode === 'signin' ? 'Sign Up' : 'Sign In'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <Text style={{ color: '#9CA3AF', fontSize: 12, textAlign: 'center' }}>
          By continuing, you agree to our Terms of Service
        </Text>
      </View>
    </View>
  );
}

