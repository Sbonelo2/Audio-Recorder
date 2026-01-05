import { Stack } from "expo-router";
import React from "react";
import { SafeAreaView, StatusBar, StyleSheet } from "react-native";
import Index from "./index";

export default function Layout() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Stack />
      <Index />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
});
