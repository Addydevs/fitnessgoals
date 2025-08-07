/* eslint-disable import/no-unresolved */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Alert,
  Dimensions,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { styles } from '../constants/styles';

export default function ProfileScreen({ photos }) {
  const [goal, setGoal] = useState('');
  const screenWidth = Dimensions.get('window').width;
  const statCardWidth = (screenWidth - 80) / 3;
  const statCardStyles = StyleSheet.create({
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginHorizontal: 20,
      marginTop: 20,
    },
    card: {
      width: statCardWidth,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      marginHorizontal: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    cardValue: {
      color: 'white',
      fontSize: 18,
      fontWeight: 'bold',
    },
    cardLabel: {
      color: 'white',
      fontSize: 12,
      marginTop: 4,
      textAlign: 'center',
    },
  });

  useEffect(() => {
    loadGoal();
  }, []);

  const loadGoal = async () => {
    try {
      const savedGoal = await AsyncStorage.getItem('fitnessGoal');
      if (savedGoal) {
        setGoal(savedGoal);
      }
    } catch (error) {
      console.error('Error loading goal:', error);
    }
  };

  const saveGoal = async (newGoal) => {
    try {
      await AsyncStorage.setItem('fitnessGoal', newGoal);
      setGoal(newGoal);
      Alert.alert('🎯 Goal Saved!', 'Your AI analysis will now be personalized to your goal.');
    } catch (error) {
      console.error('Error saving goal:', error);
    }
  };

  const getJourneyDays = () => {
    if (photos.length === 0) return 0;
    const firstPhoto = new Date(photos[0].timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - firstPhoto);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#4285f4', '#1e3c72']} style={styles.gradientHeader}>
        <Text style={styles.headerTitle}>Your Profile</Text>
        <Text style={styles.headerSubtitle}>Track your transformation</Text>
      </LinearGradient>

      <ScrollView style={styles.profileScrollView} showsVerticalScrollIndicator={false}>
        <View style={statCardStyles.row}>
          {[
            { label: 'Start Weight', value: '0', colors: ['#11998e', '#38ef7d'] },
            { label: 'Goal Weight', value: '0', colors: ['#f7971e', '#ffd200'] },
            { label: 'Daily Calories', value: '0', colors: ['#8e2de2', '#4a00e0'] },
          ].map((card, index) => (
            <LinearGradient
              key={index}
              colors={card.colors}
              style={statCardStyles.card}
            >
              <Text style={statCardStyles.cardValue}>{card.value}</Text>
              <Text style={statCardStyles.cardLabel}>{card.label}</Text>
            </LinearGradient>
          ))}
        </View>
        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Journey Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <LinearGradient colors={['#4285f4', '#1e3c72']} style={styles.statCircle}>
                <Text style={styles.statNumber}>{photos.length}</Text>
              </LinearGradient>
              <Text style={styles.statLabel}>Progress Photos</Text>
            </View>
            <View style={styles.statItem}>
              <LinearGradient colors={['#f093fb', '#f5576c']} style={styles.statCircle}>
                <Text style={styles.statNumber}>{getJourneyDays()}</Text>
              </LinearGradient>
              <Text style={styles.statLabel}>Days Tracking</Text>
            </View>
          </View>
        </View>

        <View style={styles.goalCard}>
          <Text style={styles.sectionTitle}>🎯 Fitness Goal</Text>
          <View style={styles.goalInputContainer}>
            <TextInput
              style={styles.goalInput}
              placeholder="What's your fitness goal? (e.g., Lose 20lbs, Build muscle, Get stronger)"
              placeholderTextColor="#999"
              value={goal}
              onChangeText={setGoal}
              multiline
            />
          </View>
          <TouchableOpacity style={styles.saveGoalButton} onPress={() => saveGoal(goal)} activeOpacity={0.8}>
            <LinearGradient colors={['#11998e', '#38ef7d']} style={styles.saveGoalGradient}>
              <Text style={styles.saveGoalButtonText}>💾 Save Goal</Text>
            </LinearGradient>
          </TouchableOpacity>
          <Text style={styles.goalHint}>💡 Setting a goal helps AI provide personalized feedback!</Text>
        </View>

        <View style={styles.tipsCard}>
          <Text style={styles.sectionTitle}>📸 Photography Tips</Text>
          <View style={styles.tipsList}>
            {[
              { icon: '📍', text: 'Use the same location every time' },
              { icon: '💡', text: 'Keep lighting consistent' },
              { icon: '👕', text: 'Wear similar clothing' },
              { icon: '⏰', text: 'Take photos at the same time' },
              { icon: '🧍', text: 'Maintain the same pose' },
            ].map((tip, index) => (
              <View key={index} style={styles.tipItem}>
                <Text style={styles.tipIcon}>{tip.icon}</Text>
                <Text style={styles.tipText}>{tip.text}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

