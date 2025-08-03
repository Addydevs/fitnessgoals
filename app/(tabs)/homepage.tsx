import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

const Icon = ({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: any;
}) => <Text style={style}>{children}</Text>;
const Camera = (props: any) => <Icon {...props}>📷</Icon>;
const TrendingUp = (props: any) => <Icon {...props}>📈</Icon>;
const Calendar = (props: any) => <Icon {...props}>📅</Icon>;
const Search = (props: any) => <Icon {...props}>🔍</Icon>;
const MoreHorizontal = (props: any) => <Icon {...props}>⋯</Icon>;
const Plus = (props: any) => <Icon {...props}>＋</Icon>;

const PhotoProgressApp = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const tabBarHeight = useBottomTabBarHeight();

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-US", {
      weekday: "long",
      day: "numeric",
      month: "short",
    });

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = currentDate.getDay();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: tabBarHeight + 24 },
        ]}
      >
        {/* Status Bar */}
        <View style={styles.statusBar}>
          <Text style={styles.statusTime}>9:41</Text>
          <Text style={styles.statusIcons}>●●●○ 📶 🔋</Text>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.profileInfo}>
            <Image
              source={{
                uri: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Ccircle cx='24' cy='24' r='24' fill='%23E5E7EB'/%3E%3Ctext x='24' y='30' text-anchor='middle' fill='%236B7280' font-family='Arial, sans-serif' font-size='16' font-weight='bold'%3EJ%3C/text%3E%3C/svg%3E",
              }}
              style={styles.avatar}
            />
            <View>
              <Text style={styles.greeting}>Hello, John</Text>
              <Text style={styles.dateText}>{formatDate(currentDate)}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.searchButton}>
            <Search style={styles.searchIcon} />
          </TouchableOpacity>
        </View>

        {/* Daily Challenge Card */}
        <View style={styles.challengeCard}>
          <Camera style={styles.challengeIcon} />
          <Text style={styles.challengeTitle}>CaptureFit challenge</Text>
          <Text style={styles.challengeSub}>AI-powered progress tracking</Text>
        </View>

        {/* Week Calendar */}
        <View style={styles.weekRow}>
          {weekDays.map((day, index) => {
            const dayNumber = 22 + index;
            const isToday = index === today;
            return (
              <View key={day} style={styles.weekItem}>
                <Text style={styles.weekDay}>{day}</Text>
                <View
                  style={[styles.weekCircle, isToday && styles.weekCircleToday]}
                >
                  <Text
                    style={[
                      styles.weekNumber,
                      isToday && styles.weekNumberToday,
                    ]}
                  >
                    {dayNumber}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Your Progress Section */}
        <Text style={styles.sectionTitle}>Your progress</Text>
        <View style={styles.progressRow}>
          <View style={[styles.progressCard, styles.orangeCard]}>
            <Camera style={styles.progressIcon} />
            <Text style={styles.progressCardTitle}>CaptureFit Analysis</Text>
            <Text style={styles.progressCardSub}>📍 Ready to capture</Text>
          </View>
          <View style={[styles.progressCard, styles.blueCard]}>
            <TrendingUp style={styles.progressIcon} />
            <Text style={styles.progressCardTitle}>Progress Stats</Text>
            <Text style={styles.progressCardSub}>📊 View analytics</Text>
          </View>
        </View>

        {/* Today's Metrics */}
        <View style={styles.metricsCard}>
          <View style={styles.metricsHeader}>
            <Text style={styles.metricsTitle}>{`Today's Progress`}</Text>
            <TouchableOpacity>
              <MoreHorizontal style={styles.moreIcon} />
            </TouchableOpacity>
          </View>
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricIcon}>💪</Text>
              <Text style={styles.metricValue}>+8%</Text>
              <Text style={styles.metricLabel}>Muscle def.</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricIcon}>🔥</Text>
              <Text style={styles.metricValue}>-2.1%</Text>
              <Text style={styles.metricLabel}>Body fat</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricIcon}>📏</Text>
              <Text style={styles.metricValue}>89</Text>
              <Text style={styles.metricLabel}>Total pics</Text>
            </View>
          </View>
        </View>

        {/* Photo Comparison */}
        <View style={styles.comparisonCard}>
          <Text style={styles.metricsTitle}>Photo Comparison</Text>
          <View style={styles.comparisonRow}>
            <View style={styles.comparisonItem}>
              <View style={styles.comparisonBox}>
                <Calendar style={styles.comparisonIcon} />
                <Text style={styles.comparisonText}>7 days ago</Text>
              </View>
              <Text style={styles.comparisonLabel}>Before</Text>
            </View>
            <View style={styles.comparisonItem}>
              <View style={[styles.comparisonBox, styles.dashedBox]}>
                <Plus style={styles.comparisonIcon} />
                <Text style={styles.comparisonText}>Take photo</Text>
              </View>
              <Text style={styles.comparisonLabel}>Today</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.captureButton}>
            <Camera style={styles.captureButtonIcon} />
            <Text style={styles.captureButtonText}>
              Capture with CaptureFit
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PhotoProgressApp;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F9FAFB" },
  scrollContent: { padding: 24 },
  statusBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statusTime: { fontSize: 12, fontWeight: "500", color: "#111827" },
  statusIcons: { fontSize: 12 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  profileInfo: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
  greeting: { fontSize: 14, color: "#6B7280" },
  dateText: { fontSize: 16, fontWeight: "500", color: "#111827" },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: { fontSize: 20, color: "#4B5563" },
  challengeCard: {
    backgroundColor: "#3B82F6",
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
  },
  challengeIcon: { fontSize: 24, marginBottom: 8 },
  challengeTitle: { color: "#fff", fontSize: 20, fontWeight: "700" },
  challengeSub: { color: "#DBEAFE", fontSize: 12, marginTop: 4 },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  weekItem: { alignItems: "center" },
  weekDay: { color: "#6B7280", fontSize: 12, marginBottom: 4 },
  weekCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  weekCircleToday: { backgroundColor: "#111827", borderColor: "#111827" },
  weekNumber: { color: "#4B5563", fontSize: 14 },
  weekNumberToday: { color: "#fff" },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
  },
  progressRow: { flexDirection: "row", marginBottom: 24 },
  progressCard: {
    flex: 1,
    borderRadius: 24,
    padding: 20,
  },
  orangeCard: {
    backgroundColor: "#FED7AA",
    marginRight: 8,
  },
  blueCard: { backgroundColor: "#BFDBFE", marginLeft: 8 },
  progressIcon: { fontSize: 24, marginBottom: 8 },
  progressCardTitle: { fontSize: 16, fontWeight: "600", color: "#111827" },
  progressCardSub: { fontSize: 12, color: "#374151", marginTop: 4 },
  metricsCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    marginBottom: 24,
  },
  metricsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  metricsTitle: { fontSize: 18, fontWeight: "600", color: "#111827" },
  moreIcon: { fontSize: 16, color: "#9CA3AF" },
  metricsRow: { flexDirection: "row", justifyContent: "space-between" },
  metricItem: { flex: 1, alignItems: "center" },
  metricIcon: { fontSize: 24, marginBottom: 8 },
  metricValue: { fontSize: 18, fontWeight: "600", color: "#111827" },
  metricLabel: { fontSize: 12, color: "#6B7280", marginTop: 4 },
  comparisonCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    marginBottom: 24,
  },
  comparisonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  comparisonItem: { flex: 1, alignItems: "center" },
  comparisonBox: {
    width: "100%",
    aspectRatio: 3 / 4,
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  dashedBox: {
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
    backgroundColor: "#F9FAFB",
  },
  comparisonIcon: { fontSize: 32, marginBottom: 8, color: "#9CA3AF" },
  comparisonText: { fontSize: 14, color: "#6B7280" },
  comparisonLabel: { fontSize: 14, color: "#4B5563" },
  captureButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111827",
    borderRadius: 16,
    paddingVertical: 12,
  },
  captureButtonIcon: { fontSize: 20, color: "#fff", marginRight: 8 },
  captureButtonText: { color: "#fff", fontWeight: "500" },
});
