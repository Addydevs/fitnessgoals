/* eslint-disable import/no-unresolved */
import React, { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Alert, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import { styles } from '../constants/styles';
import Layout from './Layout';
import { theme } from '../constants/theme';

export default function ProgressScreen({ photos, setPhotos }) {
  const [compareMode, setCompareMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState([]);

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const deletePhoto = (photoId) => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this progress photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const photoToDelete = photos.find((photo) => photo.id === photoId);
              if (photoToDelete) {
                const fileInfo = await FileSystem.getInfoAsync(photoToDelete.uri);
                if (fileInfo.exists) {
                  await FileSystem.deleteAsync(photoToDelete.uri);
                }
              }
              const updatedPhotos = photos.filter((photo) => photo.id !== photoId);
              setPhotos(updatedPhotos);
              await AsyncStorage.setItem('progressPhotos', JSON.stringify(updatedPhotos));
            } catch (error) {
              console.error('Error deleting photo:', error);
              Alert.alert('Error', 'Failed to delete photo.');
            }
          },
        },
      ]
    );
  };

  const toggleCompareMode = () => {
    setCompareMode(!compareMode);
    setSelectedPhotos([]);
  };

  const selectPhotoForComparison = (photo) => {
    if (selectedPhotos.length === 0) {
      setSelectedPhotos([photo]);
    } else if (selectedPhotos.length === 1) {
      if (selectedPhotos[0].id === photo.id) {
        setSelectedPhotos([]);
      } else {
        setSelectedPhotos([selectedPhotos[0], photo]);
      }
    } else {
      setSelectedPhotos([photo]);
    }
  };

  const isPhotoSelected = (photoId) => {
    return selectedPhotos.some((photo) => photo.id === photoId);
  };

  return (
    <Layout>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={[theme.colors.primary, theme.colors.secondary]} style={styles.gradientHeader}>
        <Text style={styles.headerTitle}>Your Journey</Text>
        <Text style={styles.headerSubtitle}>
          {photos.length} {photos.length === 1 ? 'milestone' : 'milestones'} captured
        </Text>
        {photos.length >= 2 && (
          <TouchableOpacity
            style={[styles.compareToggle, compareMode && styles.compareToggleActive]}
            onPress={toggleCompareMode}
          >
            <Text style={[styles.compareToggleText, compareMode && styles.compareToggleTextActive]}>
              {compareMode ? '✕ Cancel' : '📊 Compare'}
            </Text>
          </TouchableOpacity>
        )}
      </LinearGradient>

      {compareMode && selectedPhotos.length === 2 && (
        <View style={styles.comparisonContainer}>
          <Text style={styles.comparisonTitle}>Side by Side</Text>
          <View style={styles.comparisonPhotos}>
            {selectedPhotos.map((photo, index) => (
              <View key={photo.id} style={styles.comparisonPhotoContainer}>
                <Text style={styles.comparisonPhotoLabel}>{index === 0 ? 'Before' : 'After'}</Text>
                <View style={styles.comparisonPhotoCard}>
                  <Image source={{ uri: photo.uri }} style={styles.comparisonPhoto} />
                  <View style={styles.comparisonPhotoDate}>
                    <Text style={styles.comparisonDateText}>{formatDate(photo.timestamp)}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      <ScrollView style={styles.progressScrollView} showsVerticalScrollIndicator={false}>
        {photos.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyStateCard}>
              <Text style={styles.emptyStateIcon}>📷</Text>
              <Text style={styles.emptyStateTitle}>No Progress Yet</Text>
              <Text style={styles.emptyStateText}>
                Start your journey by taking your first progress photo
              </Text>
              <View style={styles.emptyStateButton}>
                <Text style={styles.emptyStateButtonText}>Go to Camera Tab</Text>
              </View>
            </View>
          </View>
        ) : (
          <>
            {compareMode && (
              <View style={styles.compareInstructionsContainer}>
                <Text style={styles.compareInstructions}>
                  {selectedPhotos.length === 0
                    ? '👆 Select two photos to compare'
                    : selectedPhotos.length === 1
                    ? '👆 Select one more photo'
                    : '✨ Comparison ready! Tap photos to change selection'}
                </Text>
              </View>
            )}
            {photos
              .slice()
              .reverse()
              .map((photo, index) => (
                <TouchableOpacity
                  key={photo.id}
                  style={[
                    styles.photoCard,
                    compareMode && styles.photoCardSelectable,
                    isPhotoSelected(photo.id) && styles.photoCardSelected,
                  ]}
                  onPress={compareMode ? () => selectPhotoForComparison(photo) : undefined}
                  onLongPress={!compareMode ? () => deletePhoto(photo.id) : undefined}
                  activeOpacity={0.9}
                >
                  {isPhotoSelected(photo.id) && (
                    <View style={styles.selectedBadge}>
                      <Text style={styles.selectedBadgeText}>✓</Text>
                    </View>
                  )}
                  <View style={styles.photoImageContainer}>
                    <Image source={{ uri: photo.uri }} style={styles.photoImage} />
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.7)']}
                      style={styles.photoGradientOverlay}
                    >
                      <View style={styles.photoHeader}>
                        <Text style={styles.photoNumber}>#{photos.length - index}</Text>
                        <Text style={styles.photoDate}>{formatDate(photo.timestamp)}</Text>
                      </View>
                    </LinearGradient>
                  </View>
                  {!compareMode && photo.analysis && (
                    <View style={styles.analysisContainer}>
                      <Text style={styles.analysisTitle}>AI Analysis</Text>
                      <Text style={styles.analysisText}>{photo.analysis}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
          </>
        )}
      </ScrollView>
    </Layout>
  );
}

