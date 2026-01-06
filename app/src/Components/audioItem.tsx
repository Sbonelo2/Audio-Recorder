// import React from "react";
// import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

// export type RecItem = {
//   name: string;
//   uri: string;
//   createdAt: number;
// };

// type Props = {
//   item: RecItem;
//   isPlaying: boolean;
//   position?: number;
//   duration?: number;
//   onPlay: (uri: string) => void;
//   onRename: (item: RecItem) => void;
//   onDelete: (item: RecItem) => void;
// };

// export default function AudioItem({
//   item,
//   isPlaying,
//   position = 0,
//   duration = 0,
//   onPlay,
//   onRename,
//   onDelete,
// }: Props) {
//   const formatMs = (ms: number): string => {
//     if (!ms || ms <= 0) return "0:00";
//     const s = Math.floor(ms / 1000);
//     const mm = Math.floor(s / 60);
//     const ss = s % 60;
//     return `${mm}:${ss.toString().padStart(2, "0")}`;
//   };

//   return (
//     <View style={styles.item}>
//       <TouchableOpacity
//         style={styles.main}
//         onPress={() => onPlay(item.uri)}
//         activeOpacity={0.7}
//       >
//         <View style={styles.header}>
//           <Text style={styles.icon}>{isPlaying ? "▶️" : "🔊"}</Text>
//           <Text style={styles.title} numberOfLines={1}>
//             {item.name}
//           </Text>
//         </View>
//         <Text style={styles.sub}>
//           {new Date(item.createdAt).toLocaleString()}
//           {isPlaying && ` • ${formatMs(position)} / ${formatMs(duration)}`}
//         </Text>
//       </TouchableOpacity>

//       <View style={styles.actions}>
//         <TouchableOpacity
//           style={styles.actionButton}
//           onPress={() => onRename(item)}
//           activeOpacity={0.7}
//         >
//           <Text style={styles.action}>✏️</Text>
//         </TouchableOpacity>
//         <TouchableOpacity
//           style={[styles.actionButton, styles.deleteButton]}
//           onPress={() => onDelete(item)}
//           activeOpacity={0.7}
//         >
//           <Text style={styles.action}>🗑️</Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   item: {
//     marginHorizontal: 16,
//     marginVertical: 6,
//     paddingVertical: 12,
//     paddingHorizontal: 12,
//     borderRadius: 10,
//     backgroundColor: "#fff",
//     flexDirection: "row",
//     alignItems: "center",
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//     elevation: 2,
//   },
//   main: { flex: 1 },
//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 6,
//   },
//   icon: { fontSize: 18, marginRight: 8 },
//   title: { fontSize: 16, fontWeight: "600", color: "#333", flex: 1 },
//   sub: { fontSize: 12, color: "#999", marginLeft: 26 },
//   actions: { flexDirection: "row", gap: 8 },
//   actionButton: {
//     padding: 8,
//     borderRadius: 8,
//     backgroundColor: "#f0f0f0",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   deleteButton: { backgroundColor: "#ffe0e0" },
//   action: { fontSize: 18 },
// });
