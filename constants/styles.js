import { StyleSheet } from 'react-native';
import { theme } from './theme';

export const styles = StyleSheet.create({
  // App wide layout
  appBackground: {
    flex: 1,
  },
  appContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },

  // Base Layouts
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  // Welcome Screen Styles
  welcomeContainer: {
    flex: 1,
    backgroundColor: 'white',
    paddingTop: 50,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  skipText: {
    fontSize: 16,
    color: '#666',
    marginRight: 4,
  },
  skipArrow: {
    fontSize: 18,
    color: '#666',
    fontWeight: 'bold',
  },
  heroImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 40,
  },
  heroImageBackground: {
    width: 280,
    height: 280,
    backgroundColor: '#a8e6cf',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  heroImagePlaceholder: {
    fontSize: 80,
    marginBottom: 10,
  },
  heroImageText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  welcomeContent: {
    paddingHorizontal: 30,
    paddingBottom: 50,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    lineHeight: 38,
    marginBottom: 16,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 10,
  },
  pageIndicators: {
    flexDirection: 'row',
    marginBottom: 40,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 4,
  },
  indicatorActive: {
    backgroundColor: '#a8e6cf',
    width: 24,
  },
  getStartedButton: {
    backgroundColor: '#a8e6cf',
    paddingVertical: 18,
    paddingHorizontal: 80,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#a8e6cf',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  getStartedText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },

  // Modern Camera Interface (after welcome)
  modernHeader: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    backgroundColor: 'white',
  },
  modernHeaderTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 8,
  },
  modernHeaderSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  modernCameraContent: {
    flex: 1,
    padding: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modernCameraButton: {
    backgroundColor: '#4285f4',
    width: 180,
    height: 180,
    borderRadius: 90,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#4285f4',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  modernCameraIcon: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  cameraIconText: {
    fontSize: 30,
  },
  modernCameraButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  modernLastPhotoContainer: {
    alignItems: 'center',
  },
  modernLastPhotoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  modernLastPhotoCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    position: 'relative',
  },
  modernLastPhotoImage: {
    width: 120,
    height: 160,
    resizeMode: 'cover',
  },
  modernPhotoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
  },
  modernPhotoOverlayText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Header Styles (for other screens)
  gradientHeader: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 15,
  },

  // Camera Screen Styles
  cameraContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  cameraButtonContainer: {
    marginBottom: 40,
  },
  cameraButton: {
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#4285f4',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  cameraIconContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 50,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  cameraIcon: {
    fontSize: 36,
  },
  cameraButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  cameraButtonSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },

  // Loading Styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    width: '90%',
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    color: '#333',
  },
  loadingSubtext: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
  loadingDots: {
    flexDirection: 'row',
    marginTop: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: '#4285f4',
  },

  // Last Photo Preview
  lastPhotoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  lastPhotoLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  lastPhotoCard: {
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  lastPhotoImage: {
    width: 140,
    height: 180,
    resizeMode: 'cover',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
  },
  photoOverlayText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Tips Container
  tipsContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },

  // Progress Screen Styles
  progressScrollView: {
    flex: 1,
    padding: 20,
  },
  compareToggle: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    alignSelf: 'center',
  },
  compareToggleActive: {
    backgroundColor: 'rgba(255,59,48,0.9)',
  },
  compareToggleText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  compareToggleTextActive: {
    color: 'white',
  },

  // Comparison Styles
  comparisonContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10,
  },
  comparisonTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  comparisonPhotos: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  comparisonPhotoContainer: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 10,
  },
  comparisonPhotoLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4285f4',
    marginBottom: 10,
  },
  comparisonPhotoCard: {
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  comparisonPhoto: {
    width: 120,
    height: 160,
    resizeMode: 'cover',
  },
  comparisonPhotoDate: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 5,
  },
  comparisonDateText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Compare Instructions
  compareInstructionsContainer: {
    backgroundColor: '#e8f0fe',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#4285f4',
  },
  compareInstructions: {
    textAlign: 'center',
    fontSize: 14,
    color: '#4285f4',
    fontWeight: '600',
  },

  // Empty State
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10,
    width: '90%',
  },
  emptyStateIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  emptyStateButton: {
    backgroundColor: '#4285f4',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  emptyStateButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },

  // Photo Card Styles
  photoCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
  },
  photoCardSelectable: {
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  photoCardSelected: {
    borderColor: '#4285f4',
    borderWidth: 3,
    shadowColor: '#4285f4',
    shadowOpacity: 0.3,
  },
  photoImageContainer: {
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: 320,
    resizeMode: 'cover',
  },
  photoGradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    justifyContent: 'flex-end',
    padding: 15,
  },
  photoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  photoNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    backgroundColor: 'rgba(66, 133, 244, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  photoDate: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
  },
  selectedBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: '#4285f4',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#4285f4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 8,
  },
  selectedBadgeText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  analysisContainer: {
    padding: 20,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  analysisText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#555',
  },

  // Profile Screen Styles
  profileScrollView: {
    flex: 1,
    padding: 20,
  },
  statsCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    textAlign: 'center',
  },

  // Goal Section
  goalCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
  },
  goalInputContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  goalInput: {
    padding: 15,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    color: '#333',
  },
  saveGoalButton: {
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 10,
  },
  saveGoalGradient: {
    padding: 15,
    alignItems: 'center',
  },
  saveGoalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  goalHint: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Tips Section
  tipsCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
  },
  tipsList: {
    marginTop: 10,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 12,
  },
  tipIcon: {
    fontSize: 20,
    marginRight: 15,
  },
  tipText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    fontWeight: '500',
  },

  // Tab Navigation
  tabIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabIconFocused: {
    backgroundColor: 'rgba(66, 133, 244, 0.1)',
    transform: [{ scale: 1.1 }],
  },
});

