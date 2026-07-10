import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import Layout, { ModernCard, ModernHeader, SectionHeader } from "./Layout";

type Exercise = {
  id: string;
  name: string;
  primaryMuscleGroup: string;
  equipment: string;
  difficulty: string;
  videoUrl?: string;
  cues?: string[];
};

export default function ExerciseLibraryScreen() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selected, setSelected] = useState<Exercise | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Static import so Metro bundles the JSON
        const data = require("../assets/exercises.json") as Exercise[];
        if (!cancelled) {
          setExercises(data);
        }
      } catch (e) {
        console.warn("Failed to load exercise library", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const palette = theme.colors;

  const renderItem = ({ item }: { item: Exercise }) => (
    <TouchableOpacity
      style={[styles.itemCard, { borderColor: palette.border, backgroundColor: palette.card }]}
      onPress={() => setSelected(item)}
    >
      <View style={styles.itemText}>
        <Text style={[styles.itemName, { color: palette.text }]}>{item.name}</Text>
        <Text style={[styles.itemMeta, { color: palette.subtitle }]}>
          {item.primaryMuscleGroup} • {item.equipment} • {item.difficulty}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <Layout>
      <ModernHeader title="Exercise Library" />
      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <SectionHeader title="Foundations" />
          <FlatList
            data={exercises}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 24 }}
          />
        </View>
      )}

      <Modal
        visible={!!selected}
        animationType="slide"
        transparent
        onRequestClose={() => setSelected(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
            {selected && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: palette.text }]}>{selected.name}</Text>
                  <TouchableOpacity onPress={() => setSelected(null)}>
                    <Text style={[styles.modalClose, { color: palette.subtitle }]}>✕</Text>
                  </TouchableOpacity>
                </View>
                <Text style={[styles.modalMeta, { color: palette.subtitle }]}>
                  {selected.primaryMuscleGroup} • {selected.equipment} • {selected.difficulty}
                </Text>
                {selected.videoUrl ? (
                  <View style={styles.previewContainer}>
                    <Image
                      source={{ uri: selected.videoUrl }}
                      style={styles.previewImage}
                      resizeMode="cover"
                    />
                  </View>
                ) : null}
                {selected.cues && selected.cues.length > 0 && (
                  <ModernCard>
                    <Text style={[styles.cuesTitle, { color: palette.text }]}>Form Cues</Text>
                    {selected.cues.map((cue) => (
                      <Text key={cue} style={[styles.cueText, { color: palette.text }]}>
                        • {cue}
                      </Text>
                    ))}
                  </ModernCard>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </Layout>
  );
}

const styles = StyleSheet.create({
  itemCard: {
    marginHorizontal: 16,
    marginVertical: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  itemText: {
    flexDirection: "column",
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
  },
  itemMeta: {
    fontSize: 13,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalCard: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  modalClose: {
    fontSize: 20,
    fontWeight: "600",
  },
  modalMeta: {
    marginTop: 4,
    fontSize: 13,
  },
  previewContainer: {
    marginTop: 12,
    borderRadius: 12,
    overflow: "hidden",
  },
  previewImage: {
    width: "100%",
    height: 200,
  },
  cuesTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  cueText: {
    fontSize: 14,
    marginTop: 2,
  },
});

