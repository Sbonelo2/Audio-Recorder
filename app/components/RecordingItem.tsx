import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DeleteButton from './DeleteButton';
import EditButton from './EditButton';
import PlayButton from './PlayButton';

type RecItem = { name: string; uri: string; createdAt: number };

interface RecordingItemProps {
  item: RecItem;
  isPlaying: boolean;
  position: number;
  duration: number;
  onPlay: (uri: string) => void;
  onEdit: (item: RecItem) => void;
  onDelete: (item: RecItem) => void;
}

export default function RecordingItem({ 
  item, 
  isPlaying, 
  position, 
  duration, 
  onPlay, 
  onEdit, 
  onDelete 
}: RecordingItemProps) {
  const formatMs = (ms: number) => {
    if (!ms || ms <= 0) return "0:00";
    const s = Math.floor(ms / 1000);
    const mm = Math.floor(s / 60);
    const ss = s % 60;
    return `${mm}:${ss.toString().padStart(2, "0")}`;
  };

  return (
    <View style={styles.item}>
      <TouchableOpacity
        style={styles.itemMain}
        onPress={() => onPlay(item.uri)}
      >
        <View style={styles.itemHeader}>
          <PlayButton
            uri={item.uri}
            isPlaying={isPlaying}
            onPlay={onPlay}
          />
          <Text style={styles.itemTitle} numberOfLines={1}>
            {item.name}
          </Text>
        </View>
        <Text style={styles.itemSub}>
          {new Date(item.createdAt).toLocaleString()}
          {isPlaying &&
            ` • ${formatMs(position)} / ${formatMs(duration)}`}
        </Text>
      </TouchableOpacity>

      <View style={styles.itemActions}>
        <EditButton onPress={() => onEdit(item)} />
        <DeleteButton onPress={() => onDelete(item)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  itemTitle: { fontSize: 16, fontWeight: "600", color: "#333", flex: 1 },
  itemSub: { fontSize: 12, color: "#999", marginLeft: 26 },
  itemActions: { flexDirection: "row", gap: 8 },
});
