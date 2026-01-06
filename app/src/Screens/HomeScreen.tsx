// import { Audio } from "expo-av";
// import React, { useEffect, useRef, useState } from "react";
// import {
//   Alert,
//   FlatList,
//   SafeAreaView,
//   StyleSheet,
//   Text,
//   View,
// } from "react-native";
// import AudioItem, { RecItem } from "../Components/audioItem";
// import RecordButton from "../Components/RecordButton";
// // import RenameModal from "../Components/RenameModal";
// import SearchBar from "../Components/SearchBar";
// import {
//   deleteRecording,
//   loadRecordings,
//   renameRecording,
// } from "../utils/audioStorage";

// export default function HomeScreen() {
//   const [recordings, setRecordings] = useState<RecItem[]>([]);
//   const [search, setSearch] = useState("");
//   const [playingUri, setPlayingUri] = useState<string | null>(null);
//   const [position, setPosition] = useState(0);
//   const [duration, setDuration] = useState(0);
//   const [recording, setRecording] = useState<Audio.Recording | null>(null);
//   const [renameVisible, setRenameVisible] = useState(false);
//   const [renameText, setRenameText] = useState("");
//   const [renameTarget, setRenameTarget] = useState<RecItem | null>(null);
//   const soundRef = useRef<Audio.Sound | null>(null);

//   const load = async () => {
//     try {
//       const data = await loadRecordings();
//       setRecordings(data || []);
//     } catch (e) {
//       console.error("loadRecordings error", e);
//       Alert.alert("Error", "Could not load recordings");
//     }
//   };

//   useEffect(() => {
//     load();
//     return () => {
//       if (soundRef.current) {
//         soundRef.current.unloadAsync().catch(() => {});
//       }
//     };
//   }, []);

//   const startRecording = async () => {
//     try {
//       const perm: any = await Audio.requestPermissionsAsync();
//       const granted = perm?.granted ?? perm?.status === "granted";
//       if (!granted) {
//         Alert.alert(
//           "Permission required",
//           "Microphone permission is required to record."
//         );
//         return;
//       }
//       await Audio.setAudioModeAsync({
//         allowsRecordingIOS: true,
//         playsInSilentModeIOS: true,
//       });
//       const rec = new Audio.Recording();
//       await rec.prepareToRecordAsync(
//         Audio.RecordingOptionsPresets.HIGH_QUALITY
//       );
//       await rec.startAsync();
//       setRecording(rec);
//     } catch (e) {
//       console.error("startRecording error", e);
//       Alert.alert("Recording error", "Could not start recording");
//     }
//   };

//   const stopRecording = async () => {
//     if (!recording) return;
//     try {
//       await recording.stopAndUnloadAsync();
//       setRecording(null);
//       await load();
//     } catch (e) {
//       console.error("stopRecording error", e);
//       Alert.alert("Recording error", "Could not stop recording");
//     }
//   };

//   const play = async (uri: string) => {
//     try {
//       if (playingUri === uri) {
//         await stopPlayback();
//         return;
//       }
//       await stopPlayback();
//       const { sound } = await Audio.Sound.createAsync(
//         { uri },
//         { shouldPlay: true }
//       );
//       soundRef.current = sound;
//       setPlayingUri(uri);

//       sound.setOnPlaybackStatusUpdate((status) => {
//         if (!status || !status.isLoaded) return;
//         setPosition(status.positionMillis ?? 0);
//         setDuration(status.durationMillis ?? 0);
//         if (status.didJustFinish) {
//           stopPlayback();
//         }
//       });
//     } catch (e) {
//       console.error("play error", e);
//       Alert.alert("Playback error", "Could not play recording");
//     }
//   };

//   const stopPlayback = async () => {
//     if (soundRef.current) {
//       await soundRef.current.stopAsync();
//       await soundRef.current.unloadAsync();
//       soundRef.current = null;
//     }
//     setPlayingUri(null);
//     setPosition(0);
//     setDuration(0);
//   };

//   const confirmDelete = (item: RecItem) => {
//     Alert.alert("Delete", `Delete "${item.name}"?`, [
//       { text: "Cancel", style: "cancel" },
//       {
//         text: "Delete",
//         style: "destructive",
//         onPress: async () => {
//           try {
//             if (playingUri === item.uri) await stopPlayback();
//             await deleteRecording(item.uri);
//             await load();
//           } catch (e) {
//             console.error("delete error", e);
//             Alert.alert("Delete failed", "Could not delete recording");
//           }
//         },
//       },
//     ]);
//   };

//   const openRename = (item: RecItem) => {
//     setRenameText(item.name);
//     setRenameTarget(item);
//     setRenameVisible(true);
//   };

//   const doRename = async () => {
//     if (!renameTarget) return;
//     const newName = renameText.trim();
//     if (!newName) {
//       Alert.alert("Invalid name", "Name cannot be empty");
//       return;
//     }
//     try {
//       await renameRecording(renameTarget.uri, newName);
//       setRenameVisible(false);
//       setRenameTarget(null);
//       setRenameText("");
//       await load();
//     } catch (e) {
//       console.error("rename error", e);
//       Alert.alert("Rename failed", "Could not rename recording");
//     }
//   };

//   const filtered = recordings.filter((r) =>
//     r.name.toLowerCase().includes(search.toLowerCase())
//   );

//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <View style={styles.container}>
//         <Text style={styles.title}>🎙️ Voice Notes</Text>

//         <SearchBar value={search} onChange={setSearch} />

//         <View style={styles.recordButtonContainer}>
//           <RecordButton
//             recording={!!recording}
//             onPress={recording ? stopRecording : startRecording}
//           />
//         </View>

//         {filtered.length === 0 ? (
//           <View style={styles.emptyState}>
//             <Text style={styles.emptyText}>No recordings yet</Text>
//             <Text style={styles.emptySubText}>
//               Tap Record to create your first voice note
//             </Text>
//           </View>
//         ) : (
//           <FlatList
//             data={filtered}
//             keyExtractor={(i) => i.uri}
//             renderItem={({ item }) => (
//               <AudioItem
//                 item={item}
//                 isPlaying={playingUri === item.uri}
//                 position={position}
//                 duration={duration}
//                 onPlay={() => play(item.uri)}
//                 onRename={() => openRename(item)}
//                 onDelete={() => confirmDelete(item)}
//               />
//             )}
//           />
//         )}

//         <RenameModal
//           visible={renameVisible}
//           value={renameText}
//           onChange={setRenameText}
//           onCancel={() => setRenameVisible(false)}
//           onSave={doRename}
//         />
//       </View>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   safeArea: { flex: 1, backgroundColor: "#f5f5f5" },
//   container: { flex: 1, backgroundColor: "#f5f5f5" },
//   title: {
//     fontSize: 28,
//     fontWeight: "700",
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//   },
//   recordButtonContainer: { paddingHorizontal: 16, marginBottom: 16 },
//   emptyState: { flex: 1, justifyContent: "center", alignItems: "center" },
//   emptyText: {
//     fontSize: 18,
//     fontWeight: "600",
//     color: "#999",
//     marginBottom: 8,
//   },
//   emptySubText: { fontSize: 14, color: "#bbb" },
// });
