import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
}

export default function SearchBar({ value, onChangeText }: SearchBarProps) {
  return (
    <View style={styles.searchContainer}>
      <TextInput
        placeholder="Search notes..."
        value={value}
        onChangeText={onChangeText}
        style={styles.search}
        placeholderTextColor="#999"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  searchContainer: { paddingHorizontal: 16, marginBottom: 12 },
  search: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#fff",
    fontSize: 16,
  },
});
