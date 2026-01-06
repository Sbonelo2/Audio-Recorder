import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface RecordButtonProps {
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

export default function RecordButton({ 
  isRecording, 
  onStartRecording, 
  onStopRecording 
}: RecordButtonProps) {
  return (
    <View style={styles.recordButtonContainer}>
      <TouchableOpacity
        style={[
          styles.recordButton,
          isRecording && styles.recordButtonActive,
        ]}
        onPress={isRecording ? onStopRecording : onStartRecording}
      >
        <Text style={styles.recordButtonText}>
          {isRecording ? "⏹ Stop Recording" : "🎤 Record"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
