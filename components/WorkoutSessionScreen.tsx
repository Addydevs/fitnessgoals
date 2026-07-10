import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import Layout, { ModernCard, ModernHeader, SectionHeader } from "./Layout";

type SessionExercise = {
  id: string;
  name: string;
  sets: { id: string; index: number; reps: number; weight: number; completed: boolean }[];
};

type StoredSession = {
  id: string;
  date: string;
  exercises: SessionExercise[];
};

const STORAGE_KEY = "workout_sessions_v1";

export default function WorkoutSessionScreen() {
  const { theme } = useTheme();
  const palette = theme.colors;
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<StoredSession[]>([]);
  const [restSeconds, setRestSeconds] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (cancelled) return;
        if (raw) {
          setSessions(JSON.parse(raw));
        } else {
          const today = new Date();
          const id = `session_${today.toISOString().slice(0, 10)}`;
          const seed: StoredSession = {
            id,
            date: today.toISOString(),
            exercises: [
              {
                id: "push_up",
                name: "Push-Up",
                sets: [
                  { id: "s1", index: 1, reps: 10, weight: 0, completed: false },
                  { id: "s2", index: 2, reps: 10, weight: 0, completed: false },
                ],
              },
              {
                id: "goblet_squat",
                name: "Goblet Squat",
                sets: [
                  { id: "s3", index: 1, reps: 12, weight: 10, completed: false },
                  { id: "s4", index: 2, reps: 12, weight: 10, completed: false },
                ],
              },
            ],
          };
          setSessions([seed]);
        }
      } catch (e) {
        console.warn("Failed to load workout sessions", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (restSeconds !== null) {
      if (restSeconds <= 0) {
        setRestSeconds(null);
      } else {
        timer = setTimeout(() => setRestSeconds((s) => (s === null ? null : s - 1)), 1000);
      }
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [restSeconds]);

  const todaySession = useMemo(() => {
    if (!sessions.length) return null;
    const todayKey = new Date().toISOString().slice(0, 10);
    return (
      sessions.find((s) => s.id === `session_${todayKey}`) ||
      sessions[0]
    );
  }, [sessions]);

  const saveSessions = async (next: StoredSession[]) => {
    setSessions(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.warn("Failed to persist workout sessions", e);
    }
  };

  const markSetComplete = (exerciseId: string, setId: string) => {
    if (!todaySession) return;
    const nextSessions = sessions.map((s) => {
      if (s.id !== todaySession.id) return s;
      return {
        ...s,
        exercises: s.exercises.map((ex) => {
          if (ex.id !== exerciseId) return ex;
          return {
            ...ex,
            sets: ex.sets.map((st) =>
              st.id === setId ? { ...st, completed: !st.completed } : st,
            ),
          };
        }),
      };
    });
    saveSessions(nextSessions);
    setRestSeconds(60);
  };

  if (loading) {
    return (
      <Layout>
        <ModernHeader title="Today's Workout" />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator />
        </View>
      </Layout>
    );
  }

  if (!todaySession) {
    return (
      <Layout>
        <ModernHeader title="Today's Workout" />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}>
          <Text style={{ color: palette.text, textAlign: "center" }}>
            No workout session for today yet. You can use the AI Coach to generate a plan and log it here.
          </Text>
        </View>
      </Layout>
    );
  }

  return (
    <Layout>
      <ModernHeader title="Today's Workout" />
      <SectionHeader title="Planned Sets" />
      <FlatList
        data={todaySession.exercises}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 80 }}
        renderItem={({ item }) => (
          <ModernCard>
            <Text style={[styles.exerciseName, { color: palette.text }]}>{item.name}</Text>
            {item.sets.map((st) => (
              <TouchableOpacity
                key={st.id}
                style={[
                  styles.setRow,
                  {
                    borderColor: palette.border,
                    backgroundColor: st.completed ? "rgba(16,185,129,0.08)" : palette.background,
                  },
                ]}
                onPress={() => markSetComplete(item.id, st.id)}
              >
                <Text style={[styles.setLabel, { color: palette.text }]}>
                  Set {st.index}: {st.reps} reps{st.weight ? ` @ ${st.weight}kg` : ""}
                </Text>
                <Text style={{ color: st.completed ? "#10B981" : palette.subtitle }}>
                  {st.completed ? "Done" : "Tap when finished"}
                </Text>
              </TouchableOpacity>
            ))}
          </ModernCard>
        )}
      />
      {restSeconds !== null && (
        <View style={[styles.restBar, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Text style={{ color: palette.text, fontWeight: "600" }}>
            Rest: {restSeconds}s
          </Text>
          <TouchableOpacity onPress={() => setRestSeconds(null)}>
            <Text style={{ color: palette.primary, fontWeight: "600" }}>Skip</Text>
          </TouchableOpacity>
        </View>
      )}
    </Layout>
  );
}

const styles = StyleSheet.create({
  exerciseName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  setRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 6,
  },
  setLabel: {
    fontSize: 14,
  },
  restBar: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 24,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});

