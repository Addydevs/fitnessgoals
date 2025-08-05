import React from "react";
import {
  View,
  SafeAreaView,
  StatusBar,
  Platform,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
} from "react-native";

export default function Layout({
  children,
  backgroundColor = "#FAFAFA",
  statusBarStyle = "dark-content",
  statusBarBackgroundColor = "white",
  safeAreaBackground = "white",
  padding = 0,
  paddingHorizontal = 0,
  paddingVertical = 0,
}) {
  return (
    <>
      <StatusBar
        barStyle={statusBarStyle}
        backgroundColor={statusBarBackgroundColor}
        translucent={false}
      />
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: safeAreaBackground }]}
      >
        <View
          style={[
            styles.container,
            {
              backgroundColor,
              padding,
              paddingHorizontal,
              paddingVertical,
            },
          ]}
        >
          {children}
        </View>
      </SafeAreaView>
    </>
  );
}

// Modern Header Component for consistent headers across screens
export const ModernHeader = ({
  title,
  subtitle,
  leftIcon,
  rightIcon,
  onLeftPress,
  onRightPress,
  backgroundColor = "white",
  showBorder = true,
}) => {
  return (
    <View
      style={[
        styles.modernHeader,
        { backgroundColor },
        showBorder && styles.modernHeaderBorder,
      ]}
    >
      <View style={styles.headerContent}>
        {/* Left Icon/Button */}
        {leftIcon && (
          <TouchableOpacity
            style={styles.headerButton}
            onPress={onLeftPress}
            activeOpacity={0.7}
          >
            {leftIcon}
          </TouchableOpacity>
        )}

        {/* Title Section */}
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{title}</Text>
          {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
        </View>

        {/* Right Icon/Button */}
        {rightIcon && (
          <TouchableOpacity
            style={styles.headerButton}
            onPress={onRightPress}
            activeOpacity={0.7}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// Modern Card Component for consistent card styling
export const ModernCard = ({
  children,
  style,
  padding = 16,
  margin = 0,
  marginHorizontal = 0,
  marginVertical = 0,
  backgroundColor = "white",
  borderRadius = 15,
  elevation = 3,
  onPress,
}) => {
  const cardStyle = [
    styles.modernCard,
    {
      padding,
      margin,
      marginHorizontal,
      marginVertical,
      backgroundColor,
      borderRadius,
      boxShadow: "0px 2px 10px rgba(0,0,0,0.05)",
      elevation,
    },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={onPress}
        activeOpacity={0.95}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

// Section Header Component
export const SectionHeader = ({
  title,
  subtitle,
  rightElement,
  marginBottom = 16,
  marginTop = 0,
}) => {
  return (
    <View style={[styles.sectionHeader, { marginBottom, marginTop }]}>
      <View style={styles.sectionTitleContainer}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
      </View>
      {rightElement && (
        <View style={styles.sectionRightElement}>{rightElement}</View>
      )}
    </View>
  );
};

// Loading Component
export const ModernLoading = ({
  title = "Loading...",
  subtitle = "Please wait",
  color = "#8B5FBF",
  overlay = true,
}) => {
  const containerStyle = overlay
    ? styles.loadingOverlay
    : styles.loadingContainer;

  return (
    <View style={containerStyle}>
      <View style={styles.loadingCard}>
        <ActivityIndicator size="large" color={color} />
        <Text style={styles.loadingTitle}>{title}</Text>
        <Text style={styles.loadingSubtext}>{subtitle}</Text>
      </View>
    </View>
  );
};

// Empty State Component
export const EmptyState = ({
  icon,
  title,
  subtitle,
  buttonText,
  onButtonPress,
  iconSize = 60,
}) => {
  return (
    <View style={styles.emptyStateContainer}>
      <View style={styles.emptyStateCard}>
        <Text style={[styles.emptyStateIcon, { fontSize: iconSize }]}>
          {icon}
        </Text>
        <Text style={styles.emptyStateTitle}>{title}</Text>
        <Text style={styles.emptyStateSubtitle}>{subtitle}</Text>
        {buttonText && onButtonPress && (
          <TouchableOpacity
            style={styles.emptyStateButton}
            onPress={onButtonPress}
            activeOpacity={0.8}
          >
            <Text style={styles.emptyStateButtonText}>{buttonText}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },

  // Modern Header Styles
  modernHeader: {
    paddingTop: Platform.OS === "ios" ? 10 : 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  modernHeaderBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 2,
  },

  // Modern Card Styles
  modernCard: {
    boxShadow: "0px 2px 10px rgba(0,0,0,0.05)",
    elevation: 3,
  },

  // Section Header Styles
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  sectionRightElement: {
    marginLeft: 16,
  },

  // Loading Styles
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    margin: 40,
    boxShadow: "0px 10px 20px rgba(0,0,0,0.1)",
    elevation: 10,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    marginTop: 16,
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },

  // Empty State Styles
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyStateCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 40,
    alignItems: "center",
    width: "100%",
    maxWidth: 300,
    boxShadow: "0px 5px 15px rgba(0,0,0,0.1)",
    elevation: 8,
  },
  emptyStateIcon: {
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
    textAlign: "center",
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: "#8B5FBF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    boxShadow: "0px 4px 8px rgba(139,95,191,0.3)",
    elevation: 5,
  },
  emptyStateButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
