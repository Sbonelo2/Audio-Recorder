// import * as FileSystem from "expo-file-system";

// export type RecItem = {
//   name: string;
//   uri: string;
//   createdAt: number;
// };

// const documentDir =
//   FileSystem.documentDirectory || FileSystem.cacheDirectory || "";

// export const RECORDINGS_DIR = documentDir + "recordings/";

// export const initializeRecordingsDir = async (): Promise<void> => {
//   try {
//     await FileSystem.makeDirectoryAsync(RECORDINGS_DIR, {
//       intermediates: true,
//     });
//   } catch (e) {
//     // Directory already exists or error - continue
//     console.warn("initializeRecordingsDir error", e);
//   }
// };

// export const loadRecordings = async (): Promise<RecItem[]> => {
//   try {
//     await initializeRecordingsDir();
//     const files = await FileSystem.readDirectoryAsync(RECORDINGS_DIR);
//     const items: RecItem[] = await Promise.all(
//       files.map(async (name): Promise<RecItem> => {
//         const uri = RECORDINGS_DIR + name;
//         const info = await FileSystem.getInfoAsync(uri);
//         const raw = info.modificationTime ?? Date.now();
//         const createdAt = raw < 1e12 ? raw * 1000 : raw;
//         return { name, uri, createdAt };
//       })
//     );
//     items.sort((a, b) => b.createdAt - a.createdAt);
//     return items;
//   } catch (e) {
//     console.warn("loadRecordings error", e);
//     return [];
//   }
// };

// export const deleteRecording = async (uri: string): Promise<void> => {
//   try {
//     await FileSystem.deleteAsync(uri, { idempotent: true });
//   } catch (e) {
//     console.error("deleteRecording error", e);
//     throw e;
//   }
// };

// export const renameRecording = async (
//   oldUri: string,
//   newName: string
// ): Promise<void> => {
//   try {
//     const safeName = newName.replace(/[/\\]/g, "_");
//     const ext = oldUri.includes(".") ? "" : ".m4a";
//     const newUri = RECORDINGS_DIR + safeName + ext;
//     await FileSystem.moveAsync({ from: oldUri, to: newUri });
//   } catch (e) {
//     console.error("renameRecording error", e);
//     throw e;
//   }
// };
