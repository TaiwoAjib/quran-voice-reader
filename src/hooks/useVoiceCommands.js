import { useState, useEffect, useRef, useCallback } from 'react';
import { VOICE_COMMANDS } from '../data/quranData';

// Wrapper around react-native-voice with graceful fallback
let Voice;
try {
  Voice = require('@react-native-voice/voice').default;
} catch (e) {
  Voice = null;
}

const matchCommand = (text) => {
  if (!text) return null;
  const lower = text.toLowerCase().trim();

  for (const [cmd, patterns] of Object.entries(VOICE_COMMANDS)) {
    if (patterns.some(p => lower.includes(p))) return cmd;
  }

  // Conversational navigation
  if (lower.includes('surah') || lower.includes('chapter')) {
    return { type: 'NAVIGATE_SURAH', text: lower };
  }
  if (lower.includes('verse') || lower.includes('ayah')) {
    return { type: 'NAVIGATE_AYAH', text: lower };
  }
  if (lower.includes('continue') || lower.includes('where i stopped') || lower.includes('last position')) {
    return 'RESUME_LAST';
  }
  if (lower.includes('read') || lower.includes('start') || lower.includes('begin') || lower.includes('play')) {
    return 'START';
  }

  return null;
};

export const useVoiceCommands = ({ onCommand, enabled = true }) => {
  const [isListening, setIsListening] = useState(false);
  const [partialText, setPartialText] = useState('');
  const [error, setError] = useState(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const restartTimerRef = useRef(null);
  const enabledRef = useRef(enabled);

  useEffect(() => { enabledRef.current = enabled; }, [enabled]);

  useEffect(() => {
    if (!Voice) return;

    Voice.onSpeechStart = () => setIsListening(true);
    Voice.onSpeechEnd = () => {
      setIsListening(false);
      if (enabledRef.current) {
        restartTimerRef.current = setTimeout(() => startListening(), 1000);
      }
    };
    Voice.onSpeechError = (e) => {
      setError(e.error?.message || 'Voice recognition error');
      setIsListening(false);
      if (enabledRef.current) {
        restartTimerRef.current = setTimeout(() => startListening(), 1000);
      }
    };
    Voice.onSpeechPartialResults = (e) => {
      const text = e.value?.[0] || '';
      setPartialText(text);
    };
    Voice.onSpeechResults = (e) => {
      const text = e.value?.[0] || '';
      setPartialText('');
      const cmd = matchCommand(text);
      if (cmd || text.trim() !== '') {
         // Only trigger onCommand if there's actually a command or significant text, 
         // so we don't accidentally close on empty results
         if (onCommand) onCommand(cmd, text);
      }
    };

    return () => {
      clearTimeout(restartTimerRef.current);
      try { 
        Voice.destroy().then(() => {
          try { Voice.removeAllListeners(); } catch(err) {} 
        }).catch(() => {}); 
      } catch (e) {}
    };
  }, []);

  const startListening = useCallback(async () => {
    if (!Voice) return;
    try {
      // Request permissions first
      const { Audio } = require('expo-av');
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
          setError('Microphone permission denied');
          return;
      }
      
      setError(null);
      await Voice.start('en-US');
    } catch (e) {
      setError(e.message);
    }
  }, []);

  const stopListening = useCallback(async () => {
    if (!Voice) return;
    clearTimeout(restartTimerRef.current);
    try {
      await Voice.stop();
      setIsListening(false);
      setPartialText('');
    } catch (e) {
      if (e && e.message && !e.message.includes('stopSpeech')) {
        console.error(e);
      }
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      startListening();
    } else {
      stopListening();
    }
    return () => stopListening();
  }, [enabled, startListening, stopListening]);

  return { isListening, partialText, error, startListening, stopListening };
};
