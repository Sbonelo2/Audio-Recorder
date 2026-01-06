import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

interface PlayButtonProps {
  uri: string;
  isPlaying: boolean;
  onPlay: (uri: string) => void;
}

export default function PlayButton({ uri, isPlaying, onPlay }: PlayButtonProps) {
  return (
    <TouchableOpacity
      style={styles.playButton}
      onPress={() => onPlay(uri)}
    >
      <Text style={styles.playButtonText}>
        {isPlaying ? "▶️" : "🔊"}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  playButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  playButtonText: { fontSize: 16 },
});
