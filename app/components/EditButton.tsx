import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

interface EditButtonProps {
  onPress: () => void;
}

export default function EditButton({ onPress }: EditButtonProps) {
  return (
    <TouchableOpacity
      style={styles.actionButton}
      onPress={onPress}
    >
      <Text style={styles.actionButtonText}>✏️</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  actionButtonText: { fontSize: 16 },
});
