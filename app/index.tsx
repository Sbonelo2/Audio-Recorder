import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type RecItem = { name: string; uri: string; createdAt: number };

const RECORDINGS_DIR = (FileSystem.documentDirectory ?? "") + "recordings/";

export default function Index() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordings, setRecordings] = useState<RecItem[]>([]);
  const [search, setSearch] = useState("");
  const soundRef = useRef<Audio.Sound | null>(null);
  const [playingUri, setPlayingUri] = useState<string | null>(null);
  const [position, setPosition] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [renameVisible, setRenameVisible] = useState(false);
  const [renameText, setRenameText] = useState("");
  const [renameTarget, setRenameTarget] = useState<RecItem | null>(null);

  useEffect(() => {
    initializeRecordingsDir();
    return () => cleanupAudio();
  }, []);

  const initializeRecordingsDir = async () => {
    try {
      await FileSystem.makeDirectoryAsync(RECORDINGS_DIR, {
        intermediates: true,
      });
    } catch {
      // ignore if exists
    }
    await loadRecordings();
  };

  const loadRecordings = async () => {
    try {
      const files = await FileSystem.readDirectoryAsync(RECORDINGS_DIR);

      // build map to deduplicate by uri (or name)
      const map = new Map<string, RecItem>();
      await Promise.all(
        files.map(async (name) => {
          const uri = RECORDINGS_DIR + name;
          const info = await FileSystem.getInfoAsync(uri);
          // fallback for different info fields
          const raw =
            (info as any).modificationTime ?? (info as any).mtime ?? Date.now();
          const createdAt = raw < 1e12 ? raw * 1000 : raw;
          // use uri as unique key
          map.set(uri, { name, uri, createdAt });
        })
      );

      const items = Array.from(map.values()).sort(
        (a, b) => b.createdAt - a.createdAt
      );

      // debug log to console so you can inspect duplicates
      console.log(
        "Loaded recordings:",
        items.map((i) => ({ name: i.name, uri: i.uri }))
      );

      setRecordings(items);
    } catch (e) {
      console.warn("loadRecordings error", e);
      setRecordings([]);
    }
  };

  const cleanupAudio = () => {
    if (soundRef.current) {
      soundRef.current.unloadAsync().catch(() => {});
    }
  };

  const startRecording = async () => {
    try {
      if (Platform.OS === "web") {
        Alert.alert(
          "Not supported",
          "Recording is not supported on web. Use a physical device or emulator."
        );
        return;
      }

      const perm: any = await Audio.requestPermissionsAsync();
      const granted = perm?.granted ?? perm?.status === "granted";
      if (!granted) {
        Alert.alert(
          "Permission required",
          "Microphone permission is required to record."
        );
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const rec = new Audio.Recording();
      // use correct preset constant
      await rec.prepareToRecordAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );
      await rec.startAsync();
      console.log("Recording started");
      setRecording(rec);
    } catch (e) {
      console.error("startRecording error", e);
      Alert.alert("Recording error", "Could not start recording.");
    }
  };
  const stopRecording = async () => {
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (!uri) {
        Alert.alert("Save failed", "Recording URI is null.");
        return;
      }

      const filename = `note-${Date.now()}.m4a`;
      const dest = RECORDINGS_DIR + filename;

      // ✅ COPY instead of MOVE (critical fix)
      await FileSystem.copyAsync({
        from: uri,
        to: dest,
      });

      // ✅ Verify file exists
      const info = await FileSystem.getInfoAsync(dest);
      if (!info.exists || info.size === 0) {
        throw new Error("File copy failed");
      }

      await loadRecordings();
    } catch (e) {
      console.error("stopRecording error", e);
      Alert.alert("Recording error", "Could not save recording.");
    }
  };


  // const stopRecording = async () => {
  //   if (!recording) return;
  //   try {
  //     await recording.stopAndUnloadAsync();
  //     const uri = recording.getURI();
  //     setRecording(null);
  //     console.log("Recording stopped, uri=", uri);

  //     if (!uri) {
  //       Alert.alert(
  //         "Save failed",
  //         "Recording URI is null. Make sure you run the app on a device/emulator (not web)."
  //       );
  //       return;
  //     }

  //     const name = `note-${Date.now()}.m4a`;
  //     const dest = RECORDINGS_DIR + name;
  //     await FileSystem.moveAsync({ from: uri, to: dest });
  //     console.log("Moved recording to", dest);
  //     await loadRecordings();
  //   } catch (e) {
  //     console.error("stopRecording error", e);
  //     Alert.alert("Recording error", "Could not save recording.");
  //   }
  // };

  const play = async (uri: string) => {
    try {
      if (playingUri === uri) {
        await stopPlayback();
        return;
      }

      await stopPlayback();

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true }
      );
      soundRef.current = sound;
      setPlayingUri(uri);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status || !status.isLoaded) return;
        setPosition(status.positionMillis ?? 0);
        setDuration(status.durationMillis ?? 0);
        if (status.didJustFinish) {
          stopPlayback();
        }
      });
    } catch (e) {
      console.error("play error", e);
      Alert.alert("Playback error", "Could not play the recording.");
    }
  };

  const stopPlayback = async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    setPlayingUri(null);
    setPosition(0);
    setDuration(0);
  };

  const confirmDelete = (item: RecItem) => {
    Alert.alert("Delete", `Delete "${item.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            if (playingUri === item.uri) {
              await stopPlayback();
            }
            await FileSystem.deleteAsync(item.uri, { idempotent: true });
            loadRecordings();
          } catch (e) {
            console.error("delete error", e);
            Alert.alert("Delete failed", "Could not delete the file.");
          }
        },
      },
    ]);
  };

  const openRename = (item: RecItem) => {
    setRenameText(item.name);
    setRenameTarget(item);
    setRenameVisible(true);
  };

  const doRename = async () => {
    if (!renameTarget) return;
    const newName = renameText.trim();
    if (!newName) {
      Alert.alert("Invalid name", "Name cannot be empty.");
      return;
    }
    const safeName = newName.replace(/[/\\]/g, "_");
    const ext = renameTarget.name.includes(".") ? "" : ".m4a";
    const dest = RECORDINGS_DIR + safeName + ext;
    try {
      await FileSystem.moveAsync({ from: renameTarget.uri, to: dest });
      setRenameVisible(false);
      setRenameTarget(null);
      setRenameText("");
      loadRecordings();
    } catch (e) {
      console.error("rename error", e);
      Alert.alert("Rename failed", "Could not rename file.");
    }
  };

  const formatMs = (ms: number) => {
    if (!ms || ms <= 0) return "0:00";
    const s = Math.floor(ms / 1000);
    const mm = Math.floor(s / 60);
    const ss = s % 60;
    return `${mm}:${ss.toString().padStart(2, "0")}`;
  };

  const visible = recordings.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🎙️ Voice Notes</Text>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <TextInput
            placeholder="Search notes..."
            value={search}
            onChangeText={setSearch}
            style={styles.search}
            placeholderTextColor="#999"
          />
        </View>

        {/* Record Button */}
        <View style={styles.recordButtonContainer}>
          <TouchableOpacity
            style={[
              styles.recordButton,
              recording && styles.recordButtonActive,
            ]}
            onPress={recording ? stopRecording : startRecording}
          >
            <Text style={styles.recordButtonText}>
              {recording ? "⏹ Stop Recording" : "🎤 Record"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Recordings List */}
        {visible.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No recordings yet</Text>
            <Text style={styles.emptySubText}>
              Tap Record to create your first voice note
            </Text>
          </View>
        ) : (
          <FlatList
            data={visible}
            keyExtractor={(i) => i.uri}
            renderItem={({ item }) => (
              <View style={styles.item}>
                <TouchableOpacity
                  style={styles.itemMain}
                  onPress={() => play(item.uri)}
                >
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemIcon}>
                      {playingUri === item.uri ? "▶️" : "🔊"}
                    </Text>
                    <Text style={styles.itemTitle} numberOfLines={1}>
                      {item.name}
                    </Text>
                  </View>
                  <Text style={styles.itemSub}>
                    {new Date(item.createdAt).toLocaleString()}
                    {playingUri === item.uri &&
                      ` • ${formatMs(position)} / ${formatMs(duration)}`}
                  </Text>
                </TouchableOpacity>

                <View style={styles.itemActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => openRename(item)}
                  >
                    <Text style={styles.actionButtonText}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => confirmDelete(item)}
                  >
                    <Text style={styles.actionButtonText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )}

        {/* Rename Modal */}
        <Modal
          visible={renameVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setRenameVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>Rename Note</Text>
              <TextInput
                value={renameText}
                onChangeText={setRenameText}
                style={styles.modalInput}
                placeholder="Enter new name"
                placeholderTextColor="#999"
                autoFocus
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setRenameVisible(false)}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={doRename}
                >
                  <Text style={[styles.modalButtonText, { color: "#fff" }]}>
                    Save
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f5f5f5" },
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: "700", color: "#000" },
  searchContainer: { paddingHorizontal: 16, marginBottom: 12 },
  search: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#fff",
    fontSize: 16,
  },
  recordButtonContainer: { paddingHorizontal: 16, marginBottom: 16 },
  recordButton: {
    backgroundColor: "#FF6B6B",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  recordButtonActive: { backgroundColor: "#FF5252" },
  recordButtonText: { fontSize: 16, fontWeight: "600", color: "#fff" },
  emptyState: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#999",
    marginBottom: 8,
  },
  emptySubText: { fontSize: 14, color: "#bbb" },
  item: {
    marginHorizontal: 16,
    marginVertical: 6,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemMain: { flex: 1 },
  itemHeader: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  itemIcon: { fontSize: 18, marginRight: 8 },
  itemTitle: { fontSize: 16, fontWeight: "600", color: "#333", flex: 1 },
  itemSub: { fontSize: 12, color: "#999", marginLeft: 26 },
  itemActions: { flexDirection: "row", gap: 8 },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButton: { backgroundColor: "#ffe0e0" },
  actionButtonText: { fontSize: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    width: "85%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
    color: "#333",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    fontSize: 16,
  },
  modalButtons: { flexDirection: "row", gap: 12 },
  modalButton: { flex: 1, padding: 12, borderRadius: 10, alignItems: "center" },
  cancelButton: { backgroundColor: "#f0f0f0" },
  saveButton: { backgroundColor: "#FF6B6B" },
  modalButtonText: { fontSize: 16, fontWeight: "600", color: "#333" },
});
