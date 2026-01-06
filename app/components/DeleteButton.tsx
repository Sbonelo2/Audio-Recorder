import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

interface DeleteButtonProps {
  onPress: () => void;
}

export default function DeleteButton({ onPress }: DeleteButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.actionButton, styles.deleteButton]}
      onPress={onPress}
    >
      <Text style={styles.actionButtonText}>🗑️</Text>
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
  deleteButton: { backgroundColor: "#ffe0e0" },
  actionButtonText: { fontSize: 16 },
});
