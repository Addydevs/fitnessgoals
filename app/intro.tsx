import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

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

export default function Intro() {
  const [index, setIndex] = useState(0);
  const router = useRouter();
  const slide = slides[index];

  const handleNext = () => {
    if (index < slides.length - 1) {
      setIndex(index + 1);
    } else {
      router.replace('/auth');
    }
  };

  const handleSkip = () => {
    router.replace('/auth');
  };

  return (
    <LinearGradient colors={slide.colors} style={{ flex: 1, padding: 20 }} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <TouchableOpacity onPress={handleSkip} style={{ alignSelf: 'flex-end', padding: 10 }}>
        <Text style={{ color: 'white', fontSize: 16, fontWeight: '500' }}>Skip</Text>
      </TouchableOpacity>

      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 30 }}>
          <Text style={{ fontSize: 60 }}>{slide.icon}</Text>
        </View>
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: 'white', marginBottom: 12, textAlign: 'center' }}>{slide.title}</Text>
        <Text style={{ fontSize: 16, color: 'white', opacity: 0.9, lineHeight: 22, textAlign: 'center' }}>{slide.subtitle}</Text>
      </View>

      <View style={{ alignItems: 'center', gap: 20, marginBottom: 40 }}>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
          {slides.map((_, i) => (
            <View key={i} style={{ width: i === index ? 20 : 8, height: 8, borderRadius: 4, backgroundColor: i === index ? 'white' : 'rgba(255,255,255,0.4)' }} />
          ))}
        </View>
        <TouchableOpacity onPress={handleNext} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 25 }}>
          <Text style={{ color: 'white', fontWeight: '600' }}>{index === slides.length - 1 ? 'Get Started' : 'Next →'}</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

