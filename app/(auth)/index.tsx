import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

export default function IntroScreen() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: "Track Your Progress",
      subtitle: "Take photos and let AI analyze your fitness journey",
      icon: "📷",
      colors: ['#A855F7', '#7C3AED']
    },
    {
      title: "AI-Powered Analysis",
      subtitle: "Get detailed insights about your body transformation",
      icon: "⚡",
      colors: ['#10B981', '#059669']
    },
    {
      title: "Stay Motivated",
      subtitle: "Build streaks and celebrate your achievements",
      icon: "📈",
      colors: ['#F59E0B', '#D97706']
    }
  ];

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      router.push('/(auth)/login');
    }
  };

  const skipIntro = () => {
    router.push('/(auth)/login');
  };

  const currentSlideData = slides[currentSlide];

  return (
    <LinearGradient colors={currentSlideData.colors} style={styles.container}>
      <StatusBar style="light" />
      
      {/* Skip Button */}
      <TouchableOpacity style={styles.skipButton} onPress={skipIntro}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{currentSlideData.icon}</Text>
        </View>
        
        <Text style={styles.title}>{currentSlideData.title}</Text>
        <Text style={styles.subtitle}>{currentSlideData.subtitle}</Text>
      </View>

      {/* Navigation */}
      <View style={styles.navigation}>
        {/* Pagination */}
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === currentSlide && styles.paginationDotActive
              ]}
            />
          ))}
        </View>

        {/* Next Button */}
        <TouchableOpacity style={styles.nextButton} onPress={nextSlide}>
          <Text style={styles.nextButtonText}>
            {currentSlide === slides.length - 1 ? 'Get Started' : 'Next →'}
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipButton: {
    alignSelf: 'flex-end',
    padding: 20,
    marginTop: 40,
  },
  skipText: {
    color: 'white',
    fontSize: 16,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  icon: {
    fontSize: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },
  navigation: {
    paddingHorizontal: 40,
    paddingBottom: 60,
    alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    width: 24,
    backgroundColor: 'white',
  },
  nextButton: {
    width: width - 80,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
