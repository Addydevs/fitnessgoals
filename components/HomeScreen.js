import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

export default function HomeScreen({ photos = [] }) {
  const navigation = useNavigation();
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const week = days.map((d, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - today.getDay() + i);
    return { label: d, date };
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, User</Text>
          <Text style={styles.subGreeting}>{`Today ${formattedDate}`}</Text>
        </View>
        <View style={styles.headerIcons}>
          <Feather name="search" size={24} color="#000" style={styles.searchIcon} />
          <Image source={require('../assets/images/icon.png')} style={styles.avatar} />
        </View>
      </View>

      <LinearGradient colors={['#8B5FBF', '#6C4F9E']} style={styles.challengeCard}>
        <Text style={styles.challengeTitle}>Daily challenge</Text>
        <Text style={styles.challengeSubtitle}>Keep pushing your limits!</Text>
      </LinearGradient>

      <View style={styles.calendarContainer}>
        {week.map((day, idx) => {
          const isToday = day.date.toDateString() === today.toDateString();
          return (
            <View key={idx} style={[styles.day, isToday && styles.today]}> 
              <Text style={[styles.dayLabel, isToday && styles.todayLabel]}>{day.label}</Text>
              <Text style={[styles.dayNumber, isToday && styles.todayNumber]}>{day.date.getDate()}</Text>
            </View>
          );
        })}
      </View>

      <Text style={styles.sectionTitle}>Your plan</Text>
      <View style={styles.planGrid}>
        <TouchableOpacity
          style={[styles.planCard, styles.progressCard]}
          onPress={() => navigation.navigate('Camera')}
        >
          <LinearGradient colors={['#FF9A56', '#FF6B35']} style={styles.cardGradient}>
            <Text style={styles.cardTitle}>Progress{`\n`}Photos</Text>
            <Text style={styles.cardSubtitle}>Take Photo</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.planCard, styles.viewCard]}
          onPress={() => navigation.navigate('Progress')}
        >
          <LinearGradient colors={['#A8E6CF', '#7FCDCD']} style={styles.cardGradient}>
            <Text style={styles.cardTitle}>View{`\n`}Progress</Text>
            <Text style={styles.cardSubtitle}>{photos.length} photos</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  subGreeting: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIcon: {
    marginRight: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  challengeCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  challengeTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  challengeSubtitle: {
    color: 'white',
    fontSize: 14,
  },
  calendarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  day: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 12,
  },
  dayLabel: {
    fontSize: 12,
    color: '#999',
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 4,
  },
  today: {
    backgroundColor: '#8B5FBF',
  },
  todayLabel: {
    color: 'white',
  },
  todayNumber: {
    color: 'white',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  planGrid: {
    flexDirection: 'row',
  },
  planCard: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  progressCard: {
    marginRight: 12,
  },
  viewCard: {},
  cardGradient: {
    flex: 1,
    padding: 16,
    height: 120,
    justifyContent: 'flex-end',
  },
  cardTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: 'white',
    fontSize: 14,
    marginTop: 8,
  },
});

