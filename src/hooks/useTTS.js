import { useState, useRef, useCallback, useEffect } from 'react';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';

// ── Arabian voice name hints (male / female) ──────────────────────────────────
// Android Google TTS: ar-XA voices (network-based); common identifiers below
// iOS: "Maged" (male, ar-SA), "Tarik" (male), "Laila" (female, ar-SA)
const ARABIC_MALE_HINTS   = ['maged', 'tarik', 'male', 'ar-xa-x-ard', 'ar-xa-x-arm', 'ahmed'];
const ARABIC_FEMALE_HINTS = ['laila', 'rana', 'salma', 'female', 'ar-xa-x-arf', 'fatimah', 'fatima'];
const ENGLISH_MALE_HINTS  = ['alex', 'aaron', 'arthur', 'daniel', 'fred', 'male'];
const ENGLISH_FEMALE_HINTS= ['samantha', 'karen', 'victoria', 'moira', 'tessa', 'female'];

// Cache available voices per language to avoid repeated async calls on each speak
const _voiceCache = {};

const getVoicesForLang = async (langPrefix) => {
  if (_voiceCache[langPrefix]) return _voiceCache[langPrefix];
  try {
    const all = await Speech.getAvailableVoicesAsync();
    const filtered = all.filter(v => (v.language || '').toLowerCase().startsWith(langPrefix));
    _voiceCache[langPrefix] = filtered;
    return filtered;
  } catch {
    return [];
  }
};

const pickVoice = (voices, gender, langPrefix) => {
  if (!voices.length) return undefined;
  const hints = langPrefix === 'ar'
    ? (gender === 'male' ? ARABIC_MALE_HINTS : ARABIC_FEMALE_HINTS)
    : (gender === 'male' ? ENGLISH_MALE_HINTS : ENGLISH_FEMALE_HINTS);

  let match = voices.find(v =>
    hints.some(h => (v.name || v.identifier || '').toLowerCase().includes(h))
  );

  if (!match) {
    // Fallback: sort by identifier and pick first/last to get two distinct voices
    const sorted = [...voices].sort((a, b) => a.identifier.localeCompare(b.identifier));
    match = gender === 'male' ? sorted[sorted.length - 1] : sorted[0];
  }

  return match?.identifier;
};

export const useTTS = ({ speed = 0.9, onWordSpoken, onFinished, ttsGender = 'male' }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const soundRef = useRef(null);
  const wordTimerRef = useRef(null);
  const currentTextRef = useRef('');
  const wordsRef = useRef([]);

  const onFinishedRef = useRef(onFinished);
  useEffect(() => { onFinishedRef.current = onFinished; }, [onFinished]);

  const speak = useCallback(async (text, words = [], lang = 'en-US', useCustomVoice = false, customVoiceUri = null) => {
    try {
      await stopSpeaking();

      if (useCustomVoice && customVoiceUri) {
        await playCustomVoice(customVoiceUri, words);
        return;
      }

      currentTextRef.current = text;
      wordsRef.current = words;
      setCurrentWordIndex(-1);
      setIsSpeaking(true);
      setIsPaused(false);

      const langPrefix = lang.substring(0, 2).toLowerCase();
      const voices = await getVoicesForLang(langPrefix);
      const selectedVoice = pickVoice(voices, ttsGender, langPrefix);

      // Simulate word-by-word highlighting
      let wordIdx = 0;
      const avgWordsPerMin = Math.round(150 * speed);
      const avgWordDuration = (60 / avgWordsPerMin) * 1000;

      const highlightNextWord = () => {
        if (wordIdx < words.length) {
          setCurrentWordIndex(wordIdx);
          if (onWordSpoken) onWordSpoken(wordIdx);
          wordIdx++;
          const wordLen = (words[wordIdx - 1] || '').length;
          const duration = Math.max(200, avgWordDuration * (0.5 + wordLen / 10));
          wordTimerRef.current = setTimeout(highlightNextWord, duration);
        }
      };

      if (words.length > 0) {
        wordTimerRef.current = setTimeout(highlightNextWord, 200);
      }

      Speech.speak(text, {
        language: lang,
        rate: speed,
        voice: selectedVoice,
        onDone: () => {
          clearTimeout(wordTimerRef.current);
          setIsSpeaking(false);
          setCurrentWordIndex(-1);
          if (onFinishedRef.current) onFinishedRef.current();
        },
        onError: (e) => {
          console.error('Speech error:', e);
          clearTimeout(wordTimerRef.current);
          setIsSpeaking(false);
          setCurrentWordIndex(-1);
        },
      });
    } catch (e) {
      console.error('TTS error:', e);
      setIsSpeaking(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speed, onWordSpoken, ttsGender]);

  const speakArabic = useCallback(async (text, words = [], useCustomVoice = false, customVoiceUri = null) => {
    await speak(text, words, 'ar-SA', useCustomVoice, customVoiceUri);
  }, [speak]);

  const speakTranslation = useCallback(async (text, words = [], useCustomVoice = false, customVoiceUri = null) => {
    await speak(text, words, 'en-US', useCustomVoice, customVoiceUri);
  }, [speak]);

  const pauseSpeaking = useCallback(async () => {
    try {
      clearTimeout(wordTimerRef.current);
      await Speech.pause();
      setIsPaused(true);
      setIsSpeaking(false);
    } catch {
      await stopSpeaking();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resumeSpeaking = useCallback(async () => {
    try {
      await Speech.resume();
      setIsPaused(false);
      setIsSpeaking(true);
    } catch {
      if (currentTextRef.current) {
        await speak(currentTextRef.current, wordsRef.current);
      }
    }
  }, [speak]);

  const stopSpeaking = useCallback(async () => {
    clearTimeout(wordTimerRef.current);
    try { await Speech.stop(); } catch {}
    if (soundRef.current) {
      try { await soundRef.current.stopAsync(); } catch {}
      try { await soundRef.current.unloadAsync(); } catch {}
      soundRef.current = null;
    }
    setIsSpeaking(false);
    setIsPaused(false);
    setCurrentWordIndex(-1);
  }, []);

  const playCustomVoice = useCallback(async (uri, words = []) => {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        allowsRecordingIOS: false,
      });
      const { sound } = await Audio.Sound.createAsync({ uri });
      soundRef.current = sound;
      setIsSpeaking(true);
      setIsPaused(false);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsSpeaking(false);
          setCurrentWordIndex(-1);
          if (onFinishedRef.current) onFinishedRef.current();
        }
      });

      await sound.playAsync();
    } catch (e) {
      console.error('Custom voice playback error:', e);
      setIsSpeaking(false);
    }
  }, []);

  // Expose helper for voice previews (e.g. VoiceSettingsScreen)
  const previewArabicVoice = useCallback(async (gender) => {
    const phrase = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ';
    const voices = await getVoicesForLang('ar');
    const selectedVoice = pickVoice(voices, gender, 'ar');
    try {
      await Speech.stop();
    } catch {}
    Speech.speak(phrase, {
      language: 'ar-SA',
      rate: 0.75,
      voice: selectedVoice,
    });
  }, []);

  useEffect(() => {
    return () => {
      clearTimeout(wordTimerRef.current);
      Speech.stop().catch(() => {});
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  return {
    isSpeaking, isPaused, currentWordIndex,
    speak, speakArabic, speakTranslation,
    pauseSpeaking, resumeSpeaking, stopSpeaking,
    previewArabicVoice,
  };
};
