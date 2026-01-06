// import React from "react";
// import { StyleSheet, Text, TouchableOpacity } from "react-native";

// type Props = {
//   recording: boolean;
//   onPress: () => void;
// };

// export default function RecordButton({ recording, onPress }: Props) {
//   return (
//     <TouchableOpacity
//       style={[styles.button, recording && styles.active]}
//       onPress={onPress}
//       activeOpacity={0.8}
//     >
//       <Text style={styles.text}>
//         {recording ? "⏹ Stop Recording" : "🎤 Record"}
//       </Text>
//     </TouchableOpacity>
//   );
// }

// const styles = StyleSheet.create({
//   button: {
//     backgroundColor: "#FF6B6B",
//     paddingVertical: 14,
//     borderRadius: 10,
//     alignItems: "center",
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.25,
//     shadowRadius: 3.84,
//     elevation: 5,
//   },
//   active: {
//     backgroundColor: "#FF5252",
//   },
//   text: { fontSize: 16, fontWeight: "600", color: "#fff" },
// });
