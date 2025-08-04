import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

const CaptureFitProfile = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  // Single API call for all user data
  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/user', {
        headers: {
          Authorization: 'Bearer YOUR_API_TOKEN',
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserData(data);
      } else {
        // Fallback data for demo
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
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Set fallback data on error
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

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  if (isLoading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="small" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton}>
          <Feather name="arrow-left" size={20} color="#4B5563" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.iconButton}>
          <Feather name="settings" size={20} color="#4B5563" />
        </TouchableOpacity>
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{userData?.name?.charAt(0) || 'U'}</Text>
          </View>
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{userData?.name || 'User'}</Text>
              <TouchableOpacity>
                <Feather name="edit-3" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            <Text style={styles.joinText}>
              Joined {formatDate(userData?.joinDate || new Date().toISOString())}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{userData?.totalPhotos || 0}</Text>
            <Text style={styles.statLabel}>Photos</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{userData?.weekStreak || 0}</Text>
            <Text style={styles.statLabel}>Week Streak</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{userData?.daysTracked || 0}</Text>
            <Text style={styles.statLabel}>Days</Text>
          </View>
        </View>
      </View>

      {/* Recent Photos */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Photos</Text>
          <TouchableOpacity>
            <Text style={styles.link}>View All</Text>
          </TouchableOpacity>
        </View>

        {userData?.recentPhotos?.length > 0 ? (
          userData.recentPhotos.slice(0, 3).map((photo) => (
            <View key={photo.id} style={styles.photoCard}>
              <View style={styles.photoCardHeader}>
                <View>
                  <Text style={styles.photoWeek}>{photo.week}</Text>
                  <Text style={styles.photoDate}>{formatDate(photo.date)}</Text>
                </View>
                <View style={styles.photoButtons}>
                  <TouchableOpacity style={styles.smallIconButton}>
                    <Feather name="eye" size={16} color="#4B5563" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.smallIconButton}>
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
            <Feather
              name="camera"
              size={48}
              color="#D1D5DB"
              style={{ marginBottom: 16 }}
            />
            <Text style={styles.emptyTitle}>No photos yet</Text>
            <Text style={styles.emptySubtitle}>
              Start your progress journey by taking your first photo
            </Text>
            <TouchableOpacity style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Take First Photo</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={[styles.quickAction, styles.takePhotoAction]}>
            <Feather
              name="camera"
              size={24}
              color="white"
              style={styles.quickActionIcon}
            />
            <Text style={styles.quickActionTitle}>Take Photo</Text>
            <Text style={styles.quickActionSubtitle}>Capture progress</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.quickAction, styles.shareAction]}>
            <Feather
              name="share-2"
              size={24}
              color="white"
              style={styles.quickActionIcon}
            />
            <Text style={styles.quickActionTitle}>Share Progress</Text>
            <Text style={styles.quickActionSubtitle}>Show your journey</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ height: 96 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    paddingBottom: 96,
  },
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    color: '#4B5563',
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 24,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
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
  avatarText: {
    color: 'white',
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
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginRight: 8,
  },
  joinText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderColor: '#F3F4F6',
    paddingTop: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  section: {
    marginHorizontal: 24,
    marginBottom: 24,
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
  link: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '500',
  },
  photoCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 16,
  },
  photoCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  photoWeek: {
    fontWeight: '600',
    color: '#111827',
  },
  photoDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  photoButtons: {
    flexDirection: 'row',
  },
  smallIconButton: {
    padding: 8,
    borderRadius: 9999,
    backgroundColor: '#F3F4F6',
    marginLeft: 8,
  },
  photoPlaceholder: {
    backgroundColor: '#E5E7EB',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    aspectRatio: 4 / 5,
  },
  photoPlaceholderText: {
    marginTop: 8,
    fontSize: 12,
    color: '#6B7280',
  },
  emptyState: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 32,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    alignItems: 'center',
  },
  emptyTitle: {
    fontWeight: '600',
    color: '#111827',
    fontSize: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#111827',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
  },
  quickAction: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
  },
  takePhotoAction: {
    backgroundColor: '#3B82F6',
    marginRight: 8,
  },
  shareAction: {
    backgroundColor: '#A855F7',
    marginLeft: 8,
  },
  quickActionIcon: {
    marginBottom: 8,
  },
  quickActionTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  quickActionSubtitle: {
    color: '#E5E7EB',
    fontSize: 12,
  },
});

export default CaptureFitProfile;

