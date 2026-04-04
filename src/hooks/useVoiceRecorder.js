import { useState, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

const RECORDINGS_DIR = `${FileSystem.documentDirectory}voice_profiles/`;

export const useVoiceRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordings, setRecordings] = useState([]);
  const recordingRef = useRef(null);
  const soundRef = useRef(null);
  const timerRef = useRef(null);
  const levelTimerRef = useRef(null);

  const ensureDirectory = async () => {
    const info = await FileSystem.getInfoAsync(RECORDINGS_DIR);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(RECORDINGS_DIR, { intermediates: true });
    }
  };

  const requestPermissions = async () => {
    const { status } = await Audio.requestPermissionsAsync();
    return status === 'granted';
  };

  const startRecording = useCallback(async () => {
    try {
      const granted = await requestPermissions();
      if (!granted) throw new Error('Microphone permission denied');

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        (status) => {
          if (status.metering !== undefined) {
            // Convert dBFS to 0-1 range
            const level = Math.max(0, (status.metering + 60) / 60);
            setAudioLevel(level);
          }
        },
        100
      );

      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration(d => d + 1);
      }, 1000);
    } catch (e) {
      console.error('Failed to start recording:', e);
      throw e;
    }
  }, []);

  const stopRecording = useCallback(async () => {
    try {
      if (!recordingRef.current) return null;

      clearInterval(timerRef.current);
      setIsRecording(false);
      setAudioLevel(0);

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      if (uri) setRecordings(prev => [...prev, uri]);

      return uri;
    } catch (e) {
      console.error('Failed to stop recording:', e);
      throw e;
    }
  }, []);

  const saveRecording = useCallback(async (uri, profileId, sampleIndex) => {
    try {
      await ensureDirectory();
      const dest = `${RECORDINGS_DIR}${profileId}_sample${sampleIndex}.m4a`;
      await FileSystem.copyAsync({ from: uri, to: dest });
      return dest;
    } catch (e) {
      console.error('Failed to save recording:', e);
      throw e;
    }
  }, []);

  const playRecording = useCallback(async (uri) => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        allowsRecordingIOS: false,
      });

      const { sound } = await Audio.Sound.createAsync({ uri });
      soundRef.current = sound;
      setIsPlaying(true);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
        }
      });

      await sound.playAsync();
    } catch (e) {
      console.error('Failed to play recording:', e);
      setIsPlaying(false);
      throw e;
    }
  }, []);

  const stopPlayback = useCallback(async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      setIsPlaying(false);
    } catch (e) {
      console.error('Failed to stop playback:', e);
    }
  }, []);

  const deleteRecording = useCallback(async (uri) => {
    try {
      const info = await FileSystem.getInfoAsync(uri);
      if (info.exists) {
        await FileSystem.deleteAsync(uri);
      }
      setRecordings(prev => prev.filter(r => r !== uri));
    } catch (e) {
      console.error('Failed to delete recording:', e);
    }
  }, []);

  const clearRecordings = useCallback(() => {
    setRecordings([]);
  }, []);

  const getProfileRecordings = useCallback(async (profileId) => {
    try {
      await ensureDirectory();
      const files = await FileSystem.readDirectoryAsync(RECORDINGS_DIR);
      return files
        .filter(f => f.startsWith(profileId))
        .map(f => `${RECORDINGS_DIR}${f}`);
    } catch (e) {
      return [];
    }
  }, []);

  const cleanup = useCallback(async () => {
    clearInterval(timerRef.current);
    clearInterval(levelTimerRef.current);
    if (recordingRef.current) {
      try { await recordingRef.current.stopAndUnloadAsync(); } catch {}
    }
    if (soundRef.current) {
      try { await soundRef.current.unloadAsync(); } catch {}
    }
  }, []);

  return {
    isRecording, isPlaying, recordingDuration, audioLevel, recordings,
    startRecording, stopRecording, saveRecording, clearRecordings,
    playRecording, stopPlayback, deleteRecording,
    getProfileRecordings, cleanup,
  };
};
