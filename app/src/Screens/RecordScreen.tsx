// import { Audio } from "expo-av";
// import * as FileSystem from "expo-file-system";
// import { useState } from "react";
// import { Alert, SafeAreaView, StyleSheet, View } from "react-native";
// import RecordButton from "../Components/RecordButton";
// import { RECORDINGS_DIR, initializeRecordingsDir } from "../utils/audioStorage";
// import { requestRecordingPermission } from "../utils/permissions";

// type RecordScreenProps = {
//   navigation: any;
// };

// export default function RecordScreen({ navigation }: RecordScreenProps) {
//   const [recording, setRecording] = useState<Audio.Recording | null>(null);

//   const startRecording = async () => {
//     try {
//       if (!(await requestRecordingPermission())) return;
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
//       const uri = recording.getURI();
//       setRecording(null);
//       if (!uri) {
//         Alert.alert("Error", "Could not get recording URI");
//         return;
//       }
//       await initializeRecordingsDir();
//       const name = `note-${Date.now()}.m4a`;
//       const destination = RECORDINGS_DIR + name;
//       await FileSystem.moveAsync({ from: uri, to: destination });
//       Alert.alert("Success", "Recording saved successfully");
//       navigation?.goBack();
//     } catch (e) {
//       console.error("stopRecording error", e);
//       Alert.alert("Save error", "Could not save recording");
//     }
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <View style={styles.content}>
//         <RecordButton
//           recording={!!recording}
//           onPress={recording ? stopRecording : startRecording}
//         />
//       </View>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: "#f5f5f5" },
//   content: { flex: 1, justifyContent: "center", alignItems: "center" },
// });
