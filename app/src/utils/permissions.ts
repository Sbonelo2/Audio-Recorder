// import { Alert } from "react-native";
// import { Audio } from "expo-av";

// export const requestRecordingPermission = async () => {
//   try {
//     const perm = await Audio.requestPermissionsAsync();
//     const granted = perm?.granted ?? perm?.status === "granted";
//     if (!granted) {
//       Alert.alert(
//         "Permission required",
//         "Microphone permission is required to record."
//       );
//     }
//     return granted;
//   } catch (e) {
//     console.error("Permission error", e);
//     return false;
//   }
// };
