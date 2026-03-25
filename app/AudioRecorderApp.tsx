import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioRecorder,
  useAudioRecorderState
} from 'expo-audio';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  SafeAreaView,
  StyleSheet, Text,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

interface Recording {
  id: string;
  uri: string;
  duration: string;
}

const STORAGE_KEY = '@my_recordings';

export default function App() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [activePlayingUri, setActivePlayingUri] = useState<string | null>(null);
  
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);

  // Load recordings on startup
  useEffect(() => {
    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) Alert.alert('Permission Denied');
      
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });

      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      console.log('Loaded recordings:', saved);
      if (saved) setRecordings(JSON.parse(saved));
    })();
  }, []);

  // Save recordings whenever the list changes
  const saveToStorage = async (list: Recording[]) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleRecordPress = async () => {
    if (recorderState.isRecording) {
      await audioRecorder.stop();
      const newRecording: Recording = {
        id: Date.now().toString(),
        uri: audioRecorder.uri || '',
        duration: formatTime(recorderState.durationMillis),
      };
      const newList = [newRecording, ...recordings];
      setRecordings(newList);
      saveToStorage(newList);
    } else {
      setActivePlayingUri(null); // Stop any music before recording
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Recorder</Text></View>
      
      <View style={styles.recorderSection}>
        <Text style={[styles.counter, recorderState.isRecording && styles.activeCounter]}>
          {formatTime(recorderState.durationMillis)}
        </Text>
        <TouchableOpacity 
          style={[styles.recordButton, recorderState.isRecording && styles.recordingActive]} 
          onPress={handleRecordPress}
        >
          <Ionicons name={recorderState.isRecording ? "stop" : "mic"} size={40} color="white" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={recordings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RecordingItem 
            item={item} 
            activeUri={activePlayingUri} 
            setActiveUri={setActivePlayingUri} 
          />
        )}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={<Text style={styles.emptyText}>No memos yet</Text>}
      />
    </SafeAreaView>
  );
}

function RecordingItem({ item, activeUri, setActiveUri }: { 
  item: Recording; 
  activeUri: string | null; 
  setActiveUri: (uri: string | null) => void 
}) {
  const player = useAudioPlayer(item.uri);
  const isCurrentActive = activeUri === item.uri;
  const scale = useSharedValue(1);

  // EFFECT: Stop this player if another one starts
  useEffect(() => {
    if (!isCurrentActive && player.playing) {
      player.pause();
    }
  }, [activeUri, player]);

  // EFFECT: Handle natural finish
  useEffect(() => {
    const sub = player.addListener('playbackStatusUpdate', (status) => {
      if (status.didJustFinish) {
        player.seekTo(0);
        player.pause();
        setActiveUri(null);
      }
    });
    return () => sub.remove();
  }, [player]);

  useEffect(() => {
    if (isCurrentActive && player.playing) {
      scale.value = withRepeat(withTiming(1.1, { duration: 500 }), -1, true);
    } else {
      scale.value = withTiming(1);
    }
  }, [isCurrentActive, player.playing]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const togglePlay = () => {
    if (player.playing) {
      player.pause();
      setActiveUri(null);
    } else {
      setActiveUri(item.uri); // This triggers the other players to stop via the first useEffect
      player.play();
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle}>Voice Memo</Text>
        <Text style={styles.cardSubtitle}>{item.duration}</Text>
        {isCurrentActive && player.playing && (
          <View style={styles.waveContainer}>
            {[1, 2, 3, 4, 5].map((i) => <WaveBar key={i} />)}
          </View>
        )}
      </View>
      <TouchableOpacity onPress={togglePlay}>
        <Animated.View style={[styles.playButton, isCurrentActive && player.playing && styles.playingBtn, animatedStyle]}>
          <Ionicons name={(isCurrentActive && player.playing) ? "pause" : "play"} size={22} color={(isCurrentActive && player.playing) ? "white" : "#007AFF"} />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

function WaveBar() {
  const height = useSharedValue(5);
  useEffect(() => {
    height.value = withRepeat(withTiming(Math.random() * 15 + 5, { duration: 300 }), -1, true);
  }, []);
  return <Animated.View style={[styles.waveBar, useAnimatedStyle(() => ({ height: height.value }))]} />;
}

// ... Keep your previous styles ...
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FBFCFE' },
  header: { paddingHorizontal: 25, paddingVertical: 20 },
  title: { fontSize: 34, fontWeight: '800', color: '#1A1A1A' },
  recorderSection: { alignItems: 'center', paddingBottom: 40, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  counter: { fontSize: 50, fontWeight: '300', color: '#8E8E93', marginBottom: 20, fontVariant: ['tabular-nums'] },
  activeCounter: { color: '#FF3B30', fontWeight: '500' },
  recordButton: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#FF3B30', justifyContent: 'center', alignItems: 'center',
  },
  recordingActive: { borderRadius: 20, backgroundColor: '#000' },
  listContainer: { padding: 20 },
  card: { backgroundColor: 'white', borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 15, borderWidth: 1, borderColor: '#F0F0F0' },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: '600' },
  cardSubtitle: { fontSize: 13, color: '#8E8E93', marginTop: 4 },
  playButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F0F7FF', justifyContent: 'center', alignItems: 'center' },
  playingBtn: { backgroundColor: '#007AFF' },
  emptyText: { textAlign: 'center', color: '#CCC', marginTop: 100, fontSize: 16 },
  waveContainer: { flexDirection: 'row', alignItems: 'center', height: 20, marginTop: 8, gap: 3 },
  waveBar: { width: 3, backgroundColor: '#007AFF', borderRadius: 2 },
});