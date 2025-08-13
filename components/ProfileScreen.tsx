import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { Feather, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  const { isDarkMode, theme } = useTheme();
  const palette = isDarkMode ? Colors.dark : Colors.light;
  const primary = palette.primary;
  const text = theme.colors.text;
  const sub = palette.textSecondary;
  const card = theme.colors.card;
  const border = theme.colors.border;
  const surface = palette.surface;
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

  const handleAvatarPress = async () => {
    // Request permission to access the camera roll
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted) {
      // Launch the image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        // Image selection was not canceled
        const selectedImage = result.assets[0].uri;

        // Update the user data with the new avatar
        // Ensure joinDate is always a string
        // Ensure totalPhotos is always a number
        // Ensure weekStreak is always a number
        // Ensure daysTracked is always a number
        // Ensure recentPhotos is always an array
        const updatedUserData: UserProfile = {
          ...userData,
          avatar: selectedImage,
          name: userData?.name || 'User',
          joinDate: userData?.joinDate || new Date().toISOString(),
          totalPhotos: userData?.totalPhotos || 0,
          weekStreak: userData?.weekStreak || 0,
          daysTracked: userData?.daysTracked || 0,
          recentPhotos: userData?.recentPhotos || [],
        };
        setUserData(updatedUserData);

        // Save the new avatar to AsyncStorage
        await AsyncStorage.setItem('user', JSON.stringify(updatedUserData));
      }
    } else {
      // Permission to access camera roll was denied
      console.log('Camera roll permission denied');
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
  <ActivityIndicator size="large" color={primary} />
  <Text style={[styles.loadingText, { color: sub }]}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <Layout>
      <SafeAreaView>
        <View style={styles.header}>
          
          <Text style={[styles.headerTitle, { color: text }]}>Profile</Text>
          <TouchableOpacity
            style={[
              styles.headerButton,
              {
                backgroundColor: card,
                borderColor: border,
                borderWidth: 1,
                shadowColor: isDarkMode ? 'transparent' : '#000',
                shadowOpacity: isDarkMode ? 0 : 0.05,
              },
            ]}
            onPress={() => {
              console.log('⚙️ Gear icon pressed - navigating to settings');
              router.push('/settings');
            }}
          >
            <Ionicons name="settings" size={20} color={sub} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
      <ScrollView showsVerticalScrollIndicator={false}>

        <View style={[
          styles.profileCard,
          {
            backgroundColor: card,
            borderColor: border,
            shadowColor: isDarkMode ? 'transparent' : '#000',
            shadowOpacity: isDarkMode ? 0 : 0.05,
          },
        ]}>
          <View style={styles.profileRow}>
            <TouchableOpacity onPress={handleAvatarPress} style={styles.avatarContainer}>
              {userData?.avatar ? (
                <Image source={{ uri: userData.avatar }} style={styles.avatarImage} />
              ) : (
                <View style={[styles.avatar, { backgroundColor: primary }]}>
                  <Text style={styles.avatarInitial}>
                    {userData?.name?.charAt(0) || 'U'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={[styles.name, { color: text }]}>{userData?.name || 'User'}</Text>
                <TouchableOpacity onPress={handleAvatarPress}>
                  <Feather name="edit-3" size={16} color={sub} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.joined, { color: sub }]}>
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
            <Text style={[styles.sectionTitle, { color: text }]}>Recent Photos</Text>
            <TouchableOpacity>
              <Text style={[styles.sectionAction, { color: primary }]}>View All</Text>
            </TouchableOpacity>
          </View>
          {userData && userData.recentPhotos && userData.recentPhotos.length > 0 ? (
            userData.recentPhotos.slice(0, 3).map((photo) => (
              <View key={photo.id} style={[
                styles.photoCard,
                {
                  backgroundColor: card,
                  borderColor: border,
                  shadowColor: isDarkMode ? 'transparent' : '#000',
                  shadowOpacity: isDarkMode ? 0 : 0.05,
                },
              ]}>
                <View style={styles.photoHeader}>
                  <View>
                    <Text style={[styles.photoWeek, { color: text }]}>{photo.week}</Text>
                    <Text style={[styles.photoDate, { color: sub }]}>{formatDate(photo.date)}</Text>
                  </View>
                  <View style={styles.photoActions}>
                    <TouchableOpacity style={[styles.iconCircle, { backgroundColor: surface }]}>
                      <Feather name="eye" size={16} color={sub} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.iconCircle, { backgroundColor: surface }]}>
                      <Feather name="share-2" size={16} color={sub} />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={[styles.photoPlaceholder, { backgroundColor: surface }]}>
                  <Feather name="camera" size={32} color={sub} />
                  <Text style={[styles.photoPlaceholderText, { color: sub }]}>Progress Photo</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={[styles.emptyState, { backgroundColor: card, borderColor: border, shadowColor: isDarkMode ? 'transparent' : '#000', shadowOpacity: isDarkMode ? 0 : 0.05 }]}>
              <Feather name="camera" size={48} color={sub} />
              <Text style={[styles.emptyTitle, { color: text }]}>No photos yet</Text>
              <Text style={[styles.emptyText, { color: sub }]}>
                Start your progress journey by taking your first photo
              </Text>
              <TouchableOpacity style={[styles.primaryButton, { backgroundColor: primary }]}>
                <Text style={styles.primaryButtonText}>Take First Photo</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: text }]}>Quick Actions</Text>
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
          <View style={[styles.modalContent, { backgroundColor: card }]}>
            <Text style={[styles.modalTitle, { color: text }]}>{editField ? fieldLabels[editField] : ''}</Text>
            <TextInput
              style={[styles.input, { borderColor: border, color: text }]}
              keyboardType="numeric"
              value={tempValue}
              onChangeText={setTempValue}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButton} onPress={() => setEditField(null)}>
                <Text style={[styles.modalButtonText, { color: sub }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton} onPress={saveStat}>
                <Text style={[styles.modalButtonText, { color: primary }]}>Save</Text>
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
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    marginRight: 16,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
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

