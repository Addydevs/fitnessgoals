import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import Layout from "@/components/Layout";

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Homepage() {
  const [currentDate, setCurrentDate] = useState(new Date());

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

  const todayIndex = currentDate.getDay();
  const baseDay = 22;

  return (
    <Layout paddingHorizontal={24} paddingVertical={24}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Status Bar */}
        <View style={styles.statusBar}>
          <Text style={styles.statusText}>9:41</Text>
          <View style={styles.statusIcons}>
            <Text style={styles.statusDots}>••••</Text>
            <Text style={styles.statusText}>📶</Text>
            <Text style={styles.statusText}>🔋</Text>
          </View>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.profile}>
            <Image
              source={{
                uri: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Ccircle cx='24' cy='24' r='24' fill='%23E5E7EB'/%3E%3Ctext x='24' y='30' text-anchor='middle' fill='%236B7280' font-family='Arial, sans-serif' font-size='16' font-weight='bold'%3EJ%3C/text%3E%3C/svg%3E",
              }}
              style={styles.avatar}
            />
            <View style={styles.profileText}>
              <Text style={styles.greeting}>Hello, John</Text>
              <Text style={styles.date}>{formatDate(currentDate)}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.searchButton}>
            <Feather name="search" size={20} color="#4B5563" />
          </TouchableOpacity>
        </View>

        {/* Daily Challenge Card */}
        <View style={styles.challengeCard}>
          <Text style={styles.challengeTitle}>CaptureFit challenge</Text>
          <Text style={styles.challengeSubtitle}>
            AI-powered progress tracking
          </Text>
        </View>

        {/* Week Calendar */}
        <View style={styles.weekRow}>
          {weekDays.map((day, i) => (
            <View key={day} style={styles.dayItem}>
              <Text style={styles.dayLabel}>{day}</Text>
              <View
                style={[
                  styles.dayCircle,
                  i === todayIndex && styles.dayCircleToday,
                ]}
              >
                <Text
                  style={[
                    styles.dayNumber,
                    i === todayIndex && styles.dayNumberToday,
                  ]}
                >
                  {baseDay + i}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Progress Section */}
        <Text style={styles.sectionHeader}>Your progress</Text>
        <View style={styles.progressRow}>
          <View style={[styles.progressCard, { marginRight: 12 }]}>
            <Feather name="camera" size={24} color="#9A3412" />
            <Text style={styles.progressTitle}>CaptureFit Analysis</Text>
            <Text style={styles.progressText}>AI body tracking</Text>
          </View>
          <View style={styles.progressCard}>
            <Feather name="trending-up" size={24} color="#1E3A8A" />
            <Text style={styles.progressTitle}>Progress Stats</Text>
            <Text style={styles.progressText}>12 day streak</Text>
          </View>
        </View>

        {/* Today's Metrics */}
        <Text style={styles.sectionHeader}>Today&apos;s Progress</Text>
        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricEmoji}>💪</Text>
            <Text style={styles.metricValue}>+8%</Text>
            <Text style={styles.metricLabel}>Muscle def.</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricEmoji}>🔥</Text>
            <Text style={styles.metricValue}>-2.1%</Text>
            <Text style={styles.metricLabel}>Body fat</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricEmoji}>📏</Text>
            <Text style={styles.metricValue}>89</Text>
            <Text style={styles.metricLabel}>Total pics</Text>
          </View>
        </View>

        {/* Photo Comparison */}
        <Text style={styles.sectionHeader}>Photo Comparison</Text>
        <View style={styles.comparisonRow}>
          <View style={styles.compareBox}>
            <Feather name="calendar" size={32} color="#9CA3AF" />
            <Text style={styles.compareLabel}>7 days ago</Text>
          </View>
          <View style={styles.compareSpacer} />
          <View style={styles.compareBox}>
            <Feather name="plus" size={32} color="#9CA3AF" />
            <Text style={styles.compareLabel}>Take photo</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.captureButton}>
          <Feather name="camera" size={20} color="#FFFFFF" />
          <Text style={styles.captureText}>Capture with CaptureFit</Text>
        </TouchableOpacity>
      </ScrollView>
    </Layout>
  );
}

const styles = StyleSheet.create({
  statusBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statusText: {
    fontSize: 14,
    color: "#111827",
  },
  statusIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDots: {
    fontSize: 10,
    color: "#111827",
    marginRight: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  profile: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  profileText: {
    justifyContent: "center",
  },
  greeting: {
    color: "#4B5563",
    fontSize: 14,
  },
  date: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "500",
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    elevation: 1,
  },
  challengeCard: {
    backgroundColor: "#60A5FA",
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
  },
  challengeTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
  },
  challengeSubtitle: {
    color: "#DBEAFE",
    fontSize: 14,
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  dayItem: {
    alignItems: "center",
  },
  dayLabel: {
    color: "#6B7280",
    fontSize: 12,
    marginBottom: 4,
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  dayCircleToday: {
    backgroundColor: "#111827",
    borderColor: "#111827",
  },
  dayNumber: {
    color: "#4B5563",
  },
  dayNumberToday: {
    color: "#FFFFFF",
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
  },
  progressRow: {
    flexDirection: "row",
    marginBottom: 24,
  },
  progressCard: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 24,
    padding: 16,
  },
  progressTitle: {
    marginTop: 8,
    fontWeight: "600",
    color: "#111827",
  },
  progressText: {
    color: "#6B7280",
    fontSize: 12,
    marginTop: 4,
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  metricItem: {
    flex: 1,
    alignItems: "center",
  },
  metricEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  metricLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  comparisonRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  compareBox: {
    flex: 1,
    height: 200,
    borderRadius: 16,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
  },
  compareSpacer: {
    width: 16,
  },
  compareLabel: {
    color: "#6B7280",
    marginTop: 8,
  },
  captureButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111827",
    borderRadius: 16,
    paddingVertical: 12,
  },
  captureText: {
    color: "#FFFFFF",
    fontWeight: "500",
    marginLeft: 8,
  },
});
