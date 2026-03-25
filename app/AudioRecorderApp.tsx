import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AudioModule, RecordingPresets, setAudioModeAsync,
  useAudioPlayer,
  useAudioRecorder, useAudioRecorderState
} from 'expo-audio';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet, Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

interface Recording {
  id: string;
  uri: string;
  name: string;
  duration: string;
  createdAt: number;
}

const STORAGE_KEY = '@my_recordings_v3';

export default function App() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activePlayingUri, setActivePlayingUri] = useState<string | null>(null);
  
  // State for Renaming
  const [isRenameVisible, setIsRenameVisible] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);
  const [newName, setNewName] = useState('');

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);

  useEffect(() => {
    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) Alert.alert('Permission Denied', 'Mic access needed');
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) setRecordings(JSON.parse(saved));
    })();
  }, []);

  const saveToStorage = async (list: Recording[]) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleRecordPress = async () => {
    if (recorderState.isRecording) {
      await audioRecorder.stop();
      const newRec: Recording = {
        id: Date.now().toString(),
        uri: audioRecorder.uri || '',
        name: `Recording ${recordings.length + 1}`,
        duration: formatTime(recorderState.durationMillis),
        createdAt: Date.now(),
      };
      const newList = [newRec, ...recordings];
      setRecordings(newList);
      saveToStorage(newList);
    } else {
      setActivePlayingUri(null);
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
    }
  };

  const deleteRecording = (id: string) => {
    Alert.alert("Delete Memo", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => {
          const newList = recordings.filter(r => r.id !== id);
          setRecordings(newList);
          saveToStorage(newList);
      }}
    ]);
  };

  const openRenameModal = (rec: Recording) => {
    setSelectedRecording(rec);
    setNewName(rec.name);
    setIsRenameVisible(true);
  };

  const confirmRename = () => {
    if (selectedRecording && newName.trim()) {
      const newList = recordings.map(r => 
        r.id === selectedRecording.id ? { ...r, name: newName.trim() } : r
      );
      setRecordings(newList);
      saveToStorage(newList);
      setIsRenameVisible(false);
    }
  };

  // --- Search Logic ---
  const filteredRecordings = useMemo(() => {
    return recordings.filter(r => 
      r.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [recordings, searchQuery]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Voice Memos</Text>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="#8E8E93" />
          <TextInput 
            placeholder="Search by name..." 
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>
      </View>
      
      <View style={styles.recorderSection}>
        <Text style={[styles.counter, recorderState.isRecording && styles.activeCounter]}>
          {formatTime(recorderState.durationMillis)}
        </Text>
        <TouchableOpacity 
          activeOpacity={0.7}
          style={[styles.recordButton, recorderState.isRecording && styles.recordingActive]} 
          onPress={handleRecordPress}
        >
          <View style={recorderState.isRecording ? styles.stopSquare : styles.recordCircle} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredRecordings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RecordingItem 
            item={item} 
            activeUri={activePlayingUri} 
            setActiveUri={setActivePlayingUri} 
            onRename={() => openRenameModal(item)}
            onDelete={() => deleteRecording(item.id)}
          />
        )}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {searchQuery ? "No matches found" : "No recordings yet"}
          </Text>
        }
      />

      {/* Rename Modal */}
      <Modal visible={isRenameVisible} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rename Memo</Text>
            <TextInput 
              style={styles.modalInput} 
              value={newName} 
              onChangeText={setNewName}
              autoFocus
              selectTextOnFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setIsRenameVisible(false)}>
                <Text style={styles.btnCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmRename}>
                <Text style={styles.btnSave}>Rename</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function RecordingItem({ item, activeUri, setActiveUri, onRename, onDelete }: any) {
  const player = useAudioPlayer(item.uri);
  const isCurrentActive = activeUri === item.uri;

  useEffect(() => {
    if (!isCurrentActive && player.playing) player.pause();
  }, [activeUri]);

  useEffect(() => {
    const sub = player.addListener('playbackStatusUpdate', (s) => {
      if (s.didJustFinish) { 
        player.seekTo(0); 
        player.pause(); 
        setActiveUri(null); 
      }
    });
    return () => sub.remove();
  }, [player]);

  const togglePlay = () => {
    if (player.playing) { 
      player.pause(); 
      setActiveUri(null); 
    } else { 
      setActiveUri(item.uri); 
      player.play(); 
    }
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity 
        style={styles.cardMain} 
        onPress={togglePlay} 
        onLongPress={onRename}
      >
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.cardSubtitle}>{item.duration}</Text>
          {isCurrentActive && player.playing && (
            <View style={styles.waveContainer}>
              {[1, 2, 3, 4, 5].map((i) => <WaveBar key={i} />)}
            </View>
          )}
        </View>
        <Ionicons 
          name={(isCurrentActive && player.playing) ? "pause-circle" : "play-circle"} 
          size={44} 
          color="#007AFF" 
        />
      </TouchableOpacity>
      
      <View style={styles.actionRow}>
        <TouchableOpacity onPress={onRename} style={styles.iconBtn}>
          <Ionicons name="pencil-outline" size={18} color="#8E8E93" />
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete} style={styles.iconBtn}>
          <Ionicons name="trash-outline" size={18} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function WaveBar() {
  const height = useSharedValue(5);
  useEffect(() => {
    height.value = withRepeat(withTiming(Math.random() * 15 + 5, { duration: 300 }), -1, true);
  }, []);
  const style = useAnimatedStyle(() => ({ height: height.value }));
  return <Animated.View style={[styles.waveBar, style]} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { padding: 20 },
  title: { fontSize: 34, fontWeight: '800', marginBottom: 15 },
  searchContainer: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F2F2F7', 
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, gap: 10 
  },
  searchInput: { flex: 1, fontSize: 16 },
  recorderSection: { alignItems: 'center', paddingBottom: 20 },
  counter: { fontSize: 55, fontWeight: '200', fontVariant: ['tabular-nums'], marginBottom: 10 },
  activeCounter: { color: '#FF3B30', fontWeight: '400' },
  recordButton: {
    width: 70, height: 70, borderRadius: 35, borderWidth: 3, borderColor: '#E5E5EA',
    justifyContent: 'center', alignItems: 'center'
  },
  recordCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FF3B30' },
  stopSquare: { width: 28, height: 28, borderRadius: 4, backgroundColor: '#000' },
  recordingActive: { borderColor: '#FF3B30' },
  listContainer: { paddingHorizontal: 20, paddingBottom: 100 },
  card: { 
    flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, 
    borderBottomColor: '#F2F2F7', paddingVertical: 12 
  },
  cardMain: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: '600', color: '#1C1C1E' },
  cardSubtitle: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  actionRow: { flexDirection: 'row', gap: 5, marginLeft: 10 },
  iconBtn: { padding: 8 },
  waveContainer: { flexDirection: 'row', alignItems: 'center', height: 20, marginTop: 5, gap: 3 },
  waveBar: { width: 3, backgroundColor: '#007AFF', borderRadius: 2 },
  emptyText: { textAlign: 'center', color: '#8E8E93', marginTop: 40, fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: 'white', borderRadius: 15, padding: 20, shadowOpacity: 0.1 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 15, textAlign: 'center' },
  modalInput: { backgroundColor: '#F2F2F7', padding: 12, borderRadius: 8, fontSize: 16, marginBottom: 20 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-around' },
  btnCancel: { color: '#8E8E93', fontSize: 16, fontWeight: '500' },
  btnSave: { color: '#007AFF', fontSize: 16, fontWeight: '700' },
});