import { Feather, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Layout from './Layout';

const screenWidth = Dimensions.get('window').width;
const PROFILE_CARD_MARGIN = 24;
const PROFILE_CARD_PADDING = 24;
const H_PADDING = 24;
const GAP = 16;
const cardWidth =
  (screenWidth -
    2 * PROFILE_CARD_MARGIN -
    2 * PROFILE_CARD_PADDING -
    2 * H_PADDING -
    2 * GAP) /
  3;

interface Stats {
  startWeight: number;
  goalWeight: number;
  dailyCalories: number;
}

interface UserProfile {
  name: string;
  joinDate: string;
  avatar: string | null;
  totalPhotos: number;
  weekStreak: number;
  daysTracked: number;
  recentPhotos: { id: number; date: string; week: string }[];
}

const CaptureFitProfile = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<Stats>({
    startWeight: 117,
    goalWeight: 110,
    dailyCalories: 2000,
  });
  const [editField, setEditField] = useState<keyof Stats | null>(null);
  const [tempValue, setTempValue] = useState<string>('');

  useFocusEffect(
    React.useCallback(() => {
      fetchUserData();
      loadStats();
    }, [])
  );

  const fetchUserData = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const userDataFromStorage = await AsyncStorage.getItem('user');
      if (userDataFromStorage) {
        setUserData(JSON.parse(userDataFromStorage));
      } else {
        // Fallback to default data if no user data in AsyncStorage
        setUserData({
          name: 'John Smith',
          joinDate: '2024-06-15',
          avatar: null,
          totalPhotos: 8,
          weekStreak: 3,
          daysTracked: 21,
          recentPhotos: [
            { id: 1, date: '2025-08-03', week: 'This week' },
            { id: 2, date: '2025-07-27', week: 'Last week' },
            { id: 3, date: '2025-07-20', week: '2 weeks ago' },
          ],
        });
      }

      // In a real app, you might still try to sync with a backend after loading from storage
      // const response = await fetch('/api/user', { ... });
      // if (response.ok) {
      //   const data = await response.json();
      //   setUserData(data);
      //   await AsyncStorage.setItem('user', JSON.stringify(data)); // Update local storage
      // }

    } catch (error) {
      console.error('Error loading user data:', error);
      setUserData({
        name: 'User',
        joinDate: new Date().toISOString(),
        avatar: null,
        totalPhotos: 0,
        weekStreak: 0,
        daysTracked: 0,
        recentPhotos: [],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async (): Promise<void> => {
    try {
      const start = await AsyncStorage.getItem('startWeight');
      const goal = await AsyncStorage.getItem('goalWeight');
      const calories = await AsyncStorage.getItem('dailyCalories');
      setStats({
        startWeight: start ? parseFloat(start) : 117,
        goalWeight: goal ? parseFloat(goal) : 110,
        dailyCalories: calories ? parseInt(calories) : 2000,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const openEditor = (field: keyof Stats): void => {
    setTempValue(String(stats[field]));
    setEditField(field);
  };

  const saveStat = async (): Promise<void> => {
    if (!editField) return; // Ensure editField is not null

    try {
      const value = parseFloat(tempValue);
      const newStats = { ...stats, [editField]: value };
      setStats(newStats);
      await AsyncStorage.setItem(editField, value.toString());
    } catch (error) {
      console.error('Error saving stat:', error);
    } finally {
      setEditField(null);
    }
  };

  const fieldLabels: Record<keyof Stats, string> = {
    startWeight: 'Start Weight (lbs)',
    goalWeight: 'Goal Weight (lbs)',
    dailyCalories: 'Daily Calories (kcal)',
  };

  const startLbs = stats.startWeight;
  const goalLbs = stats.goalWeight;
  const dailyCals = stats.dailyCalories;

  const renderStatCard = (
    { value, unit, label, colors, onPress }: any,
    index: number
  ) => (
    <TouchableOpacity
      activeOpacity={0.9}
      style={{ width: cardWidth, marginRight: index < 2 ? GAP : 0 }}
      onPress={onPress}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.statCard}
      >
        <Feather
          name="edit-3"
          size={14}
          color="rgba(255,255,255,0.95)"
          style={styles.statEditIcon}
        />
        <Text style={styles.statValue} numberOfLines={1}>
          {value}
        </Text>
        {unit && (
          <Text style={styles.statUnit} numberOfLines={1}>
            {unit}
          </Text>
        )}
        <Text style={styles.statLabel} numberOfLines={1}>
          {label}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <Layout>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton}>
            <Feather name="arrow-left" size={20} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => {
              console.log('⚙️ Gear icon pressed - navigating to settings');
              router.push('/settings');
            }}
          >
            <Ionicons name="settings" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarInitial}>
                {userData?.name?.charAt(0) || 'U'}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{userData?.name || 'User'}</Text>
                <TouchableOpacity>
                  <Feather name="edit-3" size={16} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
              <Text style={styles.joined}>
                Joined {formatDate(userData?.joinDate || new Date().toISOString())}
              </Text>
            </View>
          </View>
          <View style={[styles.statsRow, { paddingHorizontal: H_PADDING }]}>
            {renderStatCard(
              {
                value: startLbs,
                unit: 'lbs',
                label: 'Start',
                colors: ['#A8E6CF', '#7FCDCD'],
                onPress: () => openEditor('startWeight'),
              },
              0
            )}
            {renderStatCard(
              {
                value: goalLbs,
                unit: 'lbs',
                label: 'Goal',
                colors: ['#FF9A56', '#FF6B35'],
                onPress: () => openEditor('goalWeight'),
              },
              1
            )}
            {renderStatCard(
              {
                value: dailyCals,
                unit: 'cal',
                label: 'Daily',
                colors: ['#8B5FBF', '#6A4C93'],
                onPress: () => openEditor('dailyCalories'),
              },
              2
            )}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Photos</Text>
            <TouchableOpacity>
              <Text style={styles.sectionAction}>View All</Text>
            </TouchableOpacity>
          </View>
          {userData && userData.recentPhotos && userData.recentPhotos.length > 0 ? (
            userData.recentPhotos.slice(0, 3).map((photo) => (
              <View key={photo.id} style={styles.photoCard}>
                <View style={styles.photoHeader}>
                  <View>
                    <Text style={styles.photoWeek}>{photo.week}</Text>
                    <Text style={styles.photoDate}>{formatDate(photo.date)}</Text>
                  </View>
                  <View style={styles.photoActions}>
                    <TouchableOpacity style={styles.iconCircle}>
                      <Feather name="eye" size={16} color="#4B5563" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconCircle}>
                      <Feather name="share-2" size={16} color="#4B5563" />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.photoPlaceholder}>
                  <Feather name="camera" size={32} color="#9CA3AF" />
                  <Text style={styles.photoPlaceholderText}>Progress Photo</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Feather name="camera" size={48} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No photos yet</Text>
              <Text style={styles.emptyText}>
                Start your progress journey by taking your first photo
              </Text>
              <TouchableOpacity style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Take First Photo</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity style={[styles.actionCard, styles.cameraAction]}>
              <Feather name="camera" size={24} color="white" />
              <Text style={styles.actionTitle}>Take Photo</Text>
              <Text style={styles.actionSubtitle}>Capture progress</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionCard, styles.shareAction]}>
              <Feather name="share-2" size={24} color="white" />
              <Text style={styles.actionTitle}>Share Progress</Text>
              <Text style={styles.actionSubtitle}>Show your journey</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 96 }} />
      </ScrollView>
      <Modal transparent visible={!!editField} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editField ? fieldLabels[editField] : ''}</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={tempValue}
              onChangeText={setTempValue}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButton} onPress={() => setEditField(null)}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton} onPress={saveStat}>
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Layout>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#4B5563',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  profileCard: {
    marginHorizontal: PROFILE_CARD_MARGIN,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: PROFILE_CARD_PADDING,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginRight: 8,
  },
  joined: {
    color: '#9CA3AF',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  statCard: {
    height: 72,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  statValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  statUnit: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
    fontWeight: '500',
  },
  statEditIcon: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#111827',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 8,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    marginLeft: 12,
  },
  modalButtonText: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  sectionAction: {
    color: '#3B82F6',
    fontWeight: '500',
  },
  photoCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  photoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  photoWeek: {
    fontWeight: '600',
    color: '#111827',
  },
  photoDate: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 2,
  },
  photoActions: {
    flexDirection: 'row',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  photoPlaceholder: {
    height: 160,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    marginTop: 8,
    color: '#6B7280',
    fontSize: 12,
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyTitle: {
    marginTop: 8,
    fontWeight: '600',
    color: '#111827',
  },
  emptyText: {
    marginTop: 8,
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 12,
  },
  primaryButton: {
    marginTop: 16,
    backgroundColor: '#111827',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionCard: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    marginRight: 16,
  },
  cameraAction: {
    backgroundColor: '#3B82F6',
  },
  shareAction: {
    backgroundColor: '#8B5CF6',
    marginRight: 0,
  },
  actionTitle: {
    marginTop: 8,
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  actionSubtitle: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
});

export default CaptureFitProfile;

