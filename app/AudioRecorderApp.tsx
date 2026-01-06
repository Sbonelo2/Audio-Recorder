import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    FlatList,
    Linking,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

// Types
interface VoiceNote {
  id: string;
  name: string;
  uri: string;
  duration: number;
  createdAt: Date;
  size: number;
}

export default function AudioRecorderApp() {
  // Core states
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([]);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  
  // UI states
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Refs for cleanup
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Update refs when state changes
  useEffect(() => {
    recordingRef.current = recording;
  }, [recording]);

  useEffect(() => {
    soundRef.current = sound;
  }, [sound]);

  // Recording directory
  const RECORDING_DIR = ((FileSystem as any).documentDirectory ?? '') + 'voice-notes/';
  
  // Debug: Log the recording directory
  console.log('Recording directory:', RECORDING_DIR);
  
  // Load voice notes function
  const loadVoiceNotes = useCallback(async () => {
    // Prevent concurrent loading
    if (isLoading) {
      return;
    }
    
    setIsLoading(true);
    try {
      const recordingDir = ((FileSystem as any).documentDirectory ?? '') + 'voice-notes/';
      const files = await FileSystem.readDirectoryAsync(recordingDir);
      const notes: VoiceNote[] = [];
      const seenUris = new Set<string>(); // Track seen URIs to prevent duplicates
      const seenIds = new Set<string>(); // Track seen IDs to prevent duplicates
      
      for (const file of files) {
        if (file.endsWith('.m4a')) {
          const uri = recordingDir + file;
          
          // Skip if we've already processed this URI
          if (seenUris.has(uri)) {
            continue;
          }
          seenUris.add(uri);
          
          const info = await FileSystem.getInfoAsync(uri);
          
          // Generate unique ID based on file path and modification time
          const uniqueId = `${file}-${(info as any).modificationTime || Date.now()}`;
          
          // Skip if we've already processed this ID
          if (seenIds.has(uniqueId)) {
            continue;
          }
          seenIds.add(uniqueId);
          
          // Get audio metadata
          const { sound } = await Audio.Sound.createAsync({ uri });
          const status = await sound.getStatusAsync();
          
          notes.push({
            id: uniqueId,
            name: file.replace('.m4a', ''),
            uri,
            duration: (status as any).durationMillis || 0,
            createdAt: new Date((info as any).modificationTime || Date.now()),
            size: (info as any).size || 0,
          });
          
          await sound.unloadAsync();
        }
      }
      
      // Sort by creation date (newest first) and remove any remaining duplicates
      const uniqueNotes = notes
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .filter((note, index, array) => 
          array.findIndex(n => n.uri === note.uri) === index
        );
      
      // Only update state if there are actual changes
      setVoiceNotes(prevNotes => {
        if (JSON.stringify(prevNotes) === JSON.stringify(uniqueNotes)) {
          return prevNotes; // No change, prevent unnecessary re-render
        }
        return uniqueNotes;
      });
    } catch (error) {
      console.error('Error loading voice notes:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  // Clean up duplicate files
  const cleanupDuplicateFiles = useCallback(async () => {
    try {
      const recordingDir = ((FileSystem as any).documentDirectory ?? '') + 'voice-notes/';
      const files = await FileSystem.readDirectoryAsync(recordingDir);
      const fileGroups: { [key: string]: string[] } = {};
      
      // Group files by base name (without timestamp and random suffix)
      files.forEach(file => {
        if (file.endsWith('.m4a')) {
          // Extract base name pattern for grouping similar files
          const nameMatch = file.match(/(voice-note-\d+-[a-z0-9]+)/);
          if (nameMatch) {
            const basePattern = nameMatch[1];
            if (!fileGroups[basePattern]) {
              fileGroups[basePattern] = [];
            }
            fileGroups[basePattern].push(file);
          }
        }
      });
      
      // Remove duplicates, keeping only the newest file
      for (const [, fileGroup] of Object.entries(fileGroups)) {
        if (fileGroup.length > 1) {
          // Sort by modification time, keep the newest
          const filesWithInfo = await Promise.all(
            fileGroup.map(async file => {
              const info = await FileSystem.getInfoAsync(recordingDir + file);
              return { file, modificationTime: (info as any).modificationTime || 0 };
            })
          );
          
          filesWithInfo.sort((a, b) => b.modificationTime - a.modificationTime);
          
          // Delete all but the newest file
          for (let i = 1; i < filesWithInfo.length; i++) {
            try {
              await FileSystem.deleteAsync(recordingDir + filesWithInfo[i].file);
              console.log('Deleted duplicate file:', filesWithInfo[i].file);
            } catch (error) {
              console.error('Error deleting duplicate file:', error);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning up duplicate files:', error);
    }
  }, []);

  // Initialize app
  const initializeApp = useCallback(async () => {
    try {
      // Create recording directory using legacy API to avoid deprecation warning
      const recordingDir = ((FileSystem as any).documentDirectory ?? '') + 'voice-notes/';
      await (FileSystem as any).makeDirectoryAsync(recordingDir, { intermediates: true });
      
      // Clean up any duplicate files before loading
      await cleanupDuplicateFiles();
      
      // Load existing voice notes
      await loadVoiceNotes();
      
      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant microphone permission to record audio.');
      }
      
      // Set audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });
    } catch (error) {
      console.error('Initialization error:', error);
      Alert.alert('Error', 'Failed to initialize the app.');
    }
  }, [loadVoiceNotes, cleanupDuplicateFiles]);

  useEffect(() => {
    initializeApp();
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync();
      }
    };
  }, [initializeApp]);

  const startRecording = async () => {
    try {
      if (Platform.OS === 'web') {
        Alert.alert('Not Supported', 'Recording is not supported on web platform.');
        return;
      }

      console.log('Starting recording...');
      
      // Request permissions again just in case
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant microphone permission to record audio.');
        return;
      }

      // Set audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Use the preset recording options
      const recordingOptions = (Audio as any).RECORDING_OPTIONS_PRESET_HIGH_QUALITY;

      console.log('Creating recording with options:', recordingOptions);
      const { recording } = await Audio.Recording.createAsync(recordingOptions);
      console.log('Recording created successfully');
      
      setRecording(recording);
      setIsRecording(true);
      
      Alert.alert('Recording Started', 'Tap the button again to stop recording.');
    } catch (error: any) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', `Failed to start recording: ${error?.message || 'Unknown error'}`);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      console.log('Stopping recording...');
      setIsRecording(false);
      
      await recording.stopAndUnloadAsync();
      console.log('Recording stopped and unloaded');
      
      const uri = recording.getURI();
      console.log('Recording URI:', uri);
      
      if (uri) {
        // Ensure recording directory exists
        console.log('Ensuring directory exists:', RECORDING_DIR);
        const recordingDir = ((FileSystem as any).documentDirectory ?? '') + 'voice-notes/';
        await (FileSystem as any).makeDirectoryAsync(recordingDir, { intermediates: true }).catch(() => {});
        
        // Check if source file exists
        const sourceInfo = await FileSystem.getInfoAsync(uri);
        console.log('Source file exists:', sourceInfo.exists, 'Size:', (sourceInfo as any).size || 0);
        
        if (!sourceInfo.exists) {
          Alert.alert('Error', 'Recording file does not exist.');
          return;
        }
        
        // Generate unique filename with timestamp and random suffix
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const fileName = `voice-note-${timestamp}-${randomSuffix}.m4a`;
        const destination = recordingDir + fileName;
        
        console.log('Moving file from', uri, 'to', destination);
        
        try {
          // Move file to permanent location
          await FileSystem.moveAsync({
            from: uri,
            to: destination,
          });
          console.log('File moved to:', destination);
          
          // Verify the file was moved successfully
          const destInfo = await FileSystem.getInfoAsync(destination);
          if (destInfo.exists && (destInfo as any).size > 0) {
            console.log('File verified at destination, size:', (destInfo as any).size);
            
            // Reload voice notes
            await loadVoiceNotes();
            
            Alert.alert('Success', 'Voice note saved successfully!');
          } else {
            Alert.alert('Error', 'File move verification failed.');
          }
        } catch (moveError: any) {
          console.error('Error moving file, trying copy instead:', moveError);
          
          // Try copy as fallback
          try {
            await FileSystem.copyAsync({
              from: uri,
              to: destination,
            });
            console.log('File copied to:', destination);
            
            // Verify the copy
            const destInfo = await FileSystem.getInfoAsync(destination);
            if (destInfo.exists && (destInfo as any).size > 0) {
              console.log('File verified at destination (copy), size:', (destInfo as any).size);
              
              // Reload voice notes
              await loadVoiceNotes();
              
              Alert.alert('Success', 'Voice note saved successfully!');
            } else {
              Alert.alert('Error', 'File copy verification failed.');
            }
          } catch (copyError: any) {
            console.error('Error copying file:', copyError);
            Alert.alert('Error', `Failed to save recording: ${copyError?.message || 'Unknown error'}`);
          }
        }
      } else {
        Alert.alert('Error', 'Recording URI is null.');
      }
      
      setRecording(null);
    } catch (error: any) {
      console.error('Error stopping recording:', error);
      Alert.alert('Error', `Failed to save recording: ${error?.message || 'Unknown error'}`);
    }
  };

  const playVoiceNote = async (note: VoiceNote) => {
    try {
      if (isPlaying === note.id) {
        // Stop if already playing
        if (sound) {
          await sound.stopAsync();
          await sound.unloadAsync();
        }
        setIsPlaying(null);
        setPlaybackPosition(0);
        setPlaybackDuration(0);
        return;
      }

      // Stop current playback if any
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
      }

      // Create new sound
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: note.uri },
        { shouldPlay: true }
      );

      setSound(newSound);
      setIsPlaying(note.id);

      // Set up playback status updates
      newSound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.isLoaded) {
          setPlaybackPosition(status.positionMillis || 0);
          setPlaybackDuration(status.durationMillis || 0);
          
          if (status.didJustFinish) {
            setIsPlaying(null);
            setPlaybackPosition(0);
          }
        }
      });
    } catch (error) {
      console.error('Error playing voice note:', error);
      Alert.alert('Error', 'Failed to play voice note.');
    }
  };

  const deleteVoiceNote = (note: VoiceNote) => {
    Alert.alert(
      'Delete Voice Note',
      `Are you sure you want to delete "${note.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Stop playback if this note is playing
              if (isPlaying === note.id && sound) {
                await sound.stopAsync();
                await sound.unloadAsync();
                setIsPlaying(null);
              }

              // Delete file
              await FileSystem.deleteAsync(note.uri);
              
              // Reload voice notes
              await loadVoiceNotes();
              
              Alert.alert('Success', 'Voice note deleted successfully.');
            } catch (error) {
              console.error('Error deleting voice note:', error);
              Alert.alert('Error', 'Failed to delete voice note.');
            }
          },
        },
      ]
    );
  };

  const sendFeedback = () => {
    const email = 'support@voicenotes.com';
    const subject = 'Voice Notes App Feedback';
    const body = `
---
Device: ${Platform.OS}
App Version: 1.0.0
`;

    Linking.openURL(`mailto:${email}?subject=${subject}&body=${body}`);
  };

  // Filter voice notes based on search
  const filteredVoiceNotes = voiceNotes.filter(note =>
    note.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format duration
  const formatDuration = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🎙️ Voice Notes</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Search voice notes..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>

      {/* Recording Button */}
      <View style={styles.recordingContainer}>
        <TouchableOpacity
          style={[
            styles.recordButton,
            isRecording && styles.recordButtonActive
          ]}
          onPress={isRecording ? stopRecording : startRecording}
        >
          <Text style={styles.recordButtonText}>
            {isRecording ? '⏹️ Stop Recording' : '🎤 Start Recording'}
          </Text>
        </TouchableOpacity>
        {isRecording && (
          <View style={styles.recordingIndicator}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>Recording in progress...</Text>
          </View>
        )}
      </View>

      {/* Voice Notes List */}
      <View style={styles.listContainer}>
        {filteredVoiceNotes.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No voice notes yet</Text>
            <Text style={styles.emptySubText}>
              {searchQuery ? 'Try a different search term' : 'Tap Start Recording to begin'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredVoiceNotes}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.noteItem}>
                <View style={styles.noteContent}>
                  <Text style={styles.noteName}>{item.name}</Text>
                  <Text style={styles.noteDetails}>
                    {formatDuration(item.duration)} • {formatFileSize(item.size)}
                  </Text>
                  <Text style={styles.noteDate}>
                    {item.createdAt.toLocaleDateString()} {item.createdAt.toLocaleTimeString()}
                  </Text>
                </View>
                <View style={styles.noteActions}>
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      isPlaying === item.id && styles.playButtonActive
                    ]}
                    onPress={() => playVoiceNote(item)}
                  >
                    <Text style={styles.actionButtonText}>
                      {isPlaying === item.id ? '⏸️' : '▶️'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => deleteVoiceNote(item)}
                  >
                    <Text style={styles.actionButtonText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Feedback & Support Button */}
      <TouchableOpacity
        style={styles.feedbackButton}
        onPress={sendFeedback}
      >
        <Text style={styles.feedbackButtonText}>💬 Feedback & Support</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  recordingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  recordButton: {
    backgroundColor: '#ff4757',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  recordButtonActive: {
    backgroundColor: '#ff6348',
  },
  recordButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: '#ffebee',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff4757',
    marginRight: 8,
  },
  recordingText: {
    color: '#ff4757',
    fontSize: 14,
    fontWeight: '500',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  noteItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  noteContent: {
    flex: 1,
  },
  noteName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  noteDetails: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  noteDate: {
    fontSize: 11,
    color: '#999',
  },
  noteActions: {
    flexDirection: 'row',
    marginLeft: 10,
  },
  actionButton: {
    padding: 8,
    borderRadius: 5,
    backgroundColor: '#f0f0f0',
    marginLeft: 5,
  },
  playButtonActive: {
    backgroundColor: '#e8f5e8',
  },
  actionButtonText: {
    fontSize: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 10,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  feedbackButton: {
    backgroundColor: '#007AFF',
    margin: 20,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  feedbackButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
