import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Dimensions,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  Layout,
  ModernHeader,
  ModernCard,
  SectionHeader,
  EmptyState,
} from "./Layout";

const { width: screenWidth } = Dimensions.get("window");
const photoWidth = (screenWidth - 60) / 2; // 2 columns with padding

export default function ProgressScreen({ photos, setPhotos }) {
  const [compareMode, setCompareMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
    });
  };

  const deletePhoto = (photoId) => {
    Alert.alert(
      "Delete Photo",
      "Are you sure you want to delete this progress photo?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const photoToDelete = photos.find(
                (photo) => photo.id === photoId,
              );
              if (photoToDelete) {
                // Delete the actual file
                const fileInfo = await FileSystem.getInfoAsync(
                  photoToDelete.uri,
                );
                if (fileInfo.exists) {
                  await FileSystem.deleteAsync(photoToDelete.uri);
                }
              }

              const updatedPhotos = photos.filter(
                (photo) => photo.id !== photoId,
              );
              setPhotos(updatedPhotos);
              await AsyncStorage.setItem(
                "progressPhotos",
                JSON.stringify(updatedPhotos),
              );
            } catch (error) {
              console.error("Error deleting photo:", error);
              Alert.alert("Error", "Failed to delete photo.");
            }
          },
        },
      ],
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

  const getProgressStats = () => {
    if (photos.length === 0) return null;

    const firstPhoto = new Date(photos[0].timestamp);
    const latestPhoto = new Date(photos[photos.length - 1].timestamp);
    const daysDifference = Math.ceil(
      (latestPhoto - firstPhoto) / (1000 * 60 * 60 * 24),
    );

    return {
      totalPhotos: photos.length,
      daysSinceStart: daysDifference,
      thisWeek: photos.filter((photo) => {
        const photoDate = new Date(photo.timestamp);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return photoDate >= weekAgo;
      }).length,
    };
  };

  const stats = getProgressStats();

  // Empty state
  if (photos.length === 0) {
    return (
      <Layout>
        <ModernHeader
          title="Progress"
          subtitle="Your fitness journey"
          rightIcon={<Feather name="camera" size={20} color="#666" />}
        />
        <EmptyState
          icon="📸"
          title="No Progress Yet"
          subtitle="Start your fitness journey by taking your first progress photo. Track your transformation over time!"
          buttonText="Take First Photo"
          onButtonPress={() => {
            // Navigate to camera tab - you'll need to implement navigation
            Alert.alert(
              "Tip",
              "Go to the Camera tab to take your first photo!",
            );
          }}
        />
      </Layout>
    );
  }

  return (
    <Layout backgroundColor="#FAFAFA">
      <ModernHeader
        title="Progress"
        subtitle={`${photos.length} ${photos.length === 1 ? "photo" : "photos"} captured`}
        rightIcon={
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                compareMode && styles.actionButtonActive,
              ]}
              onPress={toggleCompareMode}
            >
              <Feather
                name={compareMode ? "x" : "layers"}
                size={18}
                color={compareMode ? "#fff" : "#666"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            >
              <Feather
                name={viewMode === "grid" ? "list" : "grid"}
                size={18}
                color="#666"
              />
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Cards */}
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <LinearGradient
                  colors={["#8B5FBF", "#6A4C93"]}
                  style={styles.statGradient}
                >
                  <Text style={styles.statNumber}>{stats.totalPhotos}</Text>
                  <Text style={styles.statLabel}>Total Photos</Text>
                </LinearGradient>
              </View>

              <View style={styles.statCard}>
                <LinearGradient
                  colors={["#FF9A56", "#FF6B35"]}
                  style={styles.statGradient}
                >
                  <Text style={styles.statNumber}>{stats.daysSinceStart}</Text>
                  <Text style={styles.statLabel}>Days Tracking</Text>
                </LinearGradient>
              </View>

              <View style={styles.statCard}>
                <LinearGradient
                  colors={["#A8E6CF", "#7FCDCD"]}
                  style={styles.statGradient}
                >
                  <Text style={styles.statNumber}>{stats.thisWeek}</Text>
                  <Text style={styles.statLabel}>This Week</Text>
                </LinearGradient>
              </View>
            </View>
          </View>
        )}

        {/* Comparison View */}
        {compareMode && selectedPhotos.length === 2 && (
          <ModernCard style={styles.comparisonCard}>
            <Text style={styles.comparisonTitle}>Photo Comparison</Text>
            <View style={styles.comparisonPhotos}>
              {selectedPhotos.map((photo, index) => (
                <View key={photo.id} style={styles.comparisonPhotoContainer}>
                  <Text style={styles.comparisonPhotoLabel}>
                    {index === 0 ? "Earlier" : "Latest"}
                  </Text>
                  <View style={styles.comparisonPhotoCard}>
                    <Image
                      source={{ uri: photo.uri }}
                      style={styles.comparisonPhoto}
                    />
                    <View style={styles.comparisonPhotoOverlay}>
                      <Text style={styles.comparisonDateText}>
                        {formatDate(photo.timestamp)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </ModernCard>
        )}

        {/* Compare Instructions */}
        {compareMode && (
          <ModernCard style={styles.instructionsCard}>
            <View style={styles.instructionsContent}>
              <Feather name="info" size={20} color="#8B5FBF" />
              <Text style={styles.instructionsText}>
                {selectedPhotos.length === 0
                  ? "Select two photos to compare your progress"
                  : selectedPhotos.length === 1
                    ? "Select one more photo to compare"
                    : "Great! Your comparison is ready above"}
              </Text>
            </View>
          </ModernCard>
        )}

        {/* Photos Section */}
        <SectionHeader
          title="All Photos"
          subtitle={`Sorted by newest first`}
          rightElement={
            <TouchableOpacity onPress={() => {}}>
              <Text style={styles.sectionAction}>Filter</Text>
            </TouchableOpacity>
          }
        />

        {/* Photo Grid/List */}
        <View style={viewMode === "grid" ? styles.photoGrid : styles.photoList}>
          {photos
            .slice()
            .reverse()
            .map((photo, index) => (
              <TouchableOpacity
                key={photo.id}
                style={[
                  viewMode === "grid"
                    ? styles.photoGridItem
                    : styles.photoListItem,
                  compareMode && styles.photoSelectable,
                  isPhotoSelected(photo.id) && styles.photoSelected,
                ]}
                onPress={
                  compareMode
                    ? () => selectPhotoForComparison(photo)
                    : undefined
                }
                onLongPress={
                  !compareMode ? () => deletePhoto(photo.id) : undefined
                }
                activeOpacity={0.9}
              >
                {/* Selection Badge */}
                {isPhotoSelected(photo.id) && (
                  <View style={styles.selectionBadge}>
                    <Feather name="check" size={16} color="white" />
                  </View>
                )}

                {/* Photo */}
                <View style={styles.photoContainer}>
                  <Image
                    source={{ uri: photo.uri }}
                    style={
                      viewMode === "grid"
                        ? styles.gridPhotoImage
                        : styles.listPhotoImage
                    }
                  />

                  {/* Photo Overlay */}
                  <LinearGradient
                    colors={["transparent", "rgba(0,0,0,0.7)"]}
                    style={styles.photoOverlay}
                  >
                    <View style={styles.photoInfo}>
                      <Text style={styles.photoNumber}>
                        #{photos.length - index}
                      </Text>
                      <Text style={styles.photoDate}>
                        {formatTime(photo.timestamp)}
                      </Text>
                    </View>
                  </LinearGradient>
                </View>

                {/* Analysis (List view only) */}
                {viewMode === "list" && !compareMode && photo.analysis && (
                  <View style={styles.analysisContainer}>
                    <View style={styles.analysisHeader}>
                      <Feather name="zap" size={16} color="#8B5FBF" />
                      <Text style={styles.analysisTitle}>AI Analysis</Text>
                    </View>
                    <Text style={styles.analysisText} numberOfLines={3}>
                      {photo.analysis}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </Layout>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },

  // Header Actions
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  actionButtonActive: {
    backgroundColor: "#8B5FBF",
  },

  // Stats
  statsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 15,
    overflow: "hidden",
    boxShadow: "0px 4px 8px rgba(0,0,0,0.1)",
    elevation: 5,
  },
  statGradient: {
    padding: 16,
    alignItems: "center",
    minHeight: 80,
    justifyContent: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    fontWeight: "500",
  },

  // Comparison
  comparisonCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
  },
  comparisonTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    textAlign: "center",
    marginBottom: 20,
  },
  comparisonPhotos: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  comparisonPhotoContainer: {
    alignItems: "center",
    flex: 1,
    marginHorizontal: 8,
  },
  comparisonPhotoLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8B5FBF",
    marginBottom: 8,
  },
  comparisonPhotoCard: {
    borderRadius: 12,
    overflow: "hidden",
    boxShadow: "0px 4px 8px rgba(0,0,0,0.15)",
    elevation: 5,
  },
  comparisonPhoto: {
    width: 120,
    height: 160,
    resizeMode: "cover",
  },
  comparisonPhotoOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 8,
  },
  comparisonDateText: {
    color: "white",
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },

  // Instructions
  instructionsCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: "#F8F9FF",
    borderWidth: 1,
    borderColor: "#E8EAFF",
  },
  instructionsContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  instructionsText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: "#8B5FBF",
    fontWeight: "500",
  },

  // Section Action
  sectionAction: {
    fontSize: 14,
    color: "#8B5FBF",
    fontWeight: "600",
  },

  // Photo Grid
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    marginTop: 8,
  },
  photoGridItem: {
    width: photoWidth,
    marginBottom: 16,
    marginHorizontal: 4,
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: "white",
    boxShadow: "0px 4px 8px rgba(0,0,0,0.1)",
    elevation: 5,
  },

  // Photo List
  photoList: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  photoListItem: {
    backgroundColor: "white",
    borderRadius: 15,
    marginBottom: 16,
    overflow: "hidden",
    boxShadow: "0px 4px 8px rgba(0,0,0,0.1)",
    elevation: 5,
  },

  // Photo Selection
  photoSelectable: {
    borderWidth: 2,
    borderColor: "#E0E0E0",
  },
  photoSelected: {
    borderColor: "#8B5FBF",
    borderWidth: 3,
    boxShadow: "0px 0px 0px rgba(139,95,191,0.3)",
  },
  selectionBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#8B5FBF",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    boxShadow: "0px 2px 4px rgba(139,95,191,0.5)",
    elevation: 8,
  },

  // Photo Container
  photoContainer: {
    position: "relative",
  },
  gridPhotoImage: {
    width: "100%",
    height: photoWidth * 1.3,
    resizeMode: "cover",
  },
  listPhotoImage: {
    width: "100%",
    height: 250,
    resizeMode: "cover",
  },
  photoOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    justifyContent: "flex-end",
    padding: 12,
  },
  photoInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  photoNumber: {
    fontSize: 14,
    fontWeight: "bold",
    color: "white",
    backgroundColor: "rgba(139, 95, 191, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  photoDate: {
    fontSize: 12,
    color: "white",
    fontWeight: "600",
  },

  // Analysis
  analysisContainer: {
    padding: 16,
  },
  analysisHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  analysisTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8B5FBF",
    marginLeft: 6,
  },
  analysisText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },

  bottomSpacing: {
    height: 20,
  },
});
