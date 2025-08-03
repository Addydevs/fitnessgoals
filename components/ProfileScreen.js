import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StatusBar, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import { styles } from '../constants/styles';
import Layout from './Layout';
import { theme } from '../constants/theme';

export default function ProfileScreen({ photos }) {
  const [goal, setGoal] = useState('');

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
      Alert.alert('Goal Saved!', 'Your AI analysis will now be personalized to your goal.');
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
    <Layout>
      <StatusBar barStyle="dark-content" />
      <View style={styles.headerSection}>
        <Text style={styles.headerTitle}>Your Profile</Text>
        <Text style={styles.headerSubtitle}>Track your transformation</Text>
      </View>

      <ScrollView style={styles.profileScrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Journey Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <View style={[styles.statCircle, { backgroundColor: theme.colors.primary }]}>
                <Text style={styles.statNumber}>{photos.length}</Text>
              </View>
              <Text style={styles.statLabel}>Progress Photos</Text>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statCircle, { backgroundColor: '#f5576c' }]}>
                <Text style={styles.statNumber}>{getJourneyDays()}</Text>
              </View>
              <Text style={styles.statLabel}>Days Tracking</Text>
            </View>
          </View>
        </View>

        <View style={styles.goalCard}>
          <View style={styles.sectionTitleRow}>
            <Feather name="target" size={20} color={theme.colors.text} />
            <Text style={styles.sectionTitleRowText}>Fitness Goal</Text>
          </View>
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
            <Text style={styles.saveGoalButtonText}>Save Goal</Text>
          </TouchableOpacity>
          <View style={styles.goalHintRow}>
            <Feather name="info" size={16} color="#666" />
            <Text style={styles.goalHint}>Setting a goal helps AI provide personalized feedback!</Text>
          </View>
        </View>

        <View style={styles.tipsCard}>
          <View style={styles.sectionTitleRow}>
            <Feather name="camera" size={20} color={theme.colors.text} />
            <Text style={styles.sectionTitleRowText}>Photography Tips</Text>
          </View>
          <View style={styles.tipsList}>
            {[
              { icon: 'map-pin', text: 'Use the same location every time' },
              { icon: 'sun', text: 'Keep lighting consistent' },
              { icon: 'shopping-bag', text: 'Wear similar clothing' },
              { icon: 'clock', text: 'Take photos at the same time' },
              { icon: 'user', text: 'Maintain the same pose' },
            ].map((tip, index) => (
              <View key={index} style={styles.tipItem}>
                <Feather name={tip.icon} size={20} color={theme.colors.primary} style={styles.tipIcon} />
                <Text style={styles.tipText}>{tip.text}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </Layout>
  );
}

