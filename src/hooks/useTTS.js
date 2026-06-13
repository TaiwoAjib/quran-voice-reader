import { useState, useRef, useCallback, useEffect } from 'react';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';

// ── Voice strategy ────────────────────────────────────────────────────────────
// For Arabic, the app streams REAL reciter audio (melodic murattal recitation)
// when an `audioUrl` is provided — device text-to-speech is flat and cannot
// reproduce a Qur'anic melody. TTS is kept as an offline fallback and for the
// English translation.
//
// Standard Arabic voice selection (fallback only): prefer ar-SA (Modern
// Standard Arabic), then any Arabic voice, then enhanced-quality voices.
const ARABIC_MALE_HINTS   = ['maged', 'tarik', 'ar-xa-x-ard', 'ar-xa-x-arm', 'ahmed', 'hamed', '#male'];
const ARABIC_FEMALE_HINTS = ['laila', 'rana', 'salma', 'zariyah', 'ar-xa-x-arf', 'fatima', '#female'];
const ENGLISH_MALE_HINTS  = ['alex', 'aaron', 'arthur', 'daniel', 'fred', '#male'];
const ENGLISH_FEMALE_HINTS= ['samantha', 'karen', 'victoria', 'moira', 'tessa', '#female'];

const _voiceCache = {};

const getVoicesForLang = async (langPrefix) => {
  if (_voiceCache[langPrefix]) return _voiceCache[langPrefix];
  try {
    const all = await Speech.getAvailableVoicesAsync();
    const filtered = all.filter(v => (v.language || '').toLowerCase().replace('_', '-').startsWith(langPrefix));
    if (filtered.length) _voiceCache[langPrefix] = filtered;
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

  const score = (v) => {
    const lang = (v.language || '').toLowerCase().replace('_', '-');
    const label = `${v.name || ''} ${v.identifier || ''}`.toLowerCase();
    let s = 0;
    if (langPrefix === 'ar') {
      if (lang === 'ar-sa') s += 100;
      else if (lang.startsWith('ar')) s += 40;
    }
    if (hints.some(h => label.includes(h.replace('#', '')))) s += 30;
    if (`${v.quality || ''}`.toLowerCase().includes('enhanced')) s += 20;
    return s;
  };

  const best = [...voices].sort((a, b) => score(b) - score(a))[0];
  return best?.identifier;
};

export const useTTS = ({ speed = 0.9, onWordSpoken, onFinished, ttsGender = 'male' } = {}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const soundRef = useRef(null);
  const wordTimersRef = useRef([]);
  const currentTextRef = useRef('');
  const wordsRef = useRef([]);
  const currentOptsRef = useRef({});

  const onFinishedRef = useRef(onFinished);
  useEffect(() => { onFinishedRef.current = onFinished; }, [onFinished]);

  const clearWordTimers = () => {
    wordTimersRef.current.forEach(t => clearTimeout(t));
    wordTimersRef.current = [];
  };

  // Distribute word highlights across a known duration, weighted by word length,
  // so highlighting tracks the real recitation/utterance instead of guessing.
  const scheduleWordHighlights = (words, durationMillis) => {
    clearWordTimers();
    if (!words || !words.length || !durationMillis) return;
    const totalWeight = words.reduce((a, w) => a + Math.max(1, (w || '').length), 0);
    let elapsed = 0;
    words.forEach((w, i) => {
      const at = elapsed;
      elapsed += (Math.max(1, (w || '').length) / totalWeight) * durationMillis;
      const t = setTimeout(() => {
        setCurrentWordIndex(i);
        if (onWordSpoken) onWordSpoken(i);
      }, at);
      wordTimersRef.current.push(t);
    });
  };

  const stopSpeaking = useCallback(async () => {
    clearWordTimers();
    try { await Speech.stop(); } catch {}
    if (soundRef.current) {
      try { await soundRef.current.stopAsync(); } catch {}
      try { await soundRef.current.unloadAsync(); } catch {}
      soundRef.current = null;
    }
    setIsSpeaking(false);
    setIsPaused(false);
    setIsBuffering(false);
    setCurrentWordIndex(-1);
  }, []);

  // Play an audio source (remote recitation URL or a local custom-voice file).
  // Resolves { finished } once playback ends. Word highlights are synced to the
  // real clip duration when `words` are supplied.
  const playSound = useCallback((source, { words = [], notifyFinish = true } = {}) => {
    return new Promise(async (resolve) => {
      let settled = false;
      const settle = (finished) => {
        if (settled) return;
        settled = true;
        clearWordTimers();
        setIsSpeaking(false);
        setIsBuffering(false);
        setCurrentWordIndex(-1);
        if (finished && notifyFinish && onFinishedRef.current) onFinishedRef.current();
        resolve({ finished });
      };
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          allowsRecordingIOS: false,
          staysActiveInBackground: false,
        });
        setIsBuffering(true);
        setIsSpeaking(true);
        setIsPaused(false);

        const { sound, status } = await Audio.Sound.createAsync(
          source,
          { shouldPlay: true },
        );
        soundRef.current = sound;
        setIsBuffering(false);

        if (status?.isLoaded && status.durationMillis) {
          scheduleWordHighlights(words, status.durationMillis);
        }

        sound.setOnPlaybackStatusUpdate((st) => {
          if (!st.isLoaded) {
            if (st.error) settle(false);
            return;
          }
          if (st.didJustFinish) settle(true);
        });
      } catch (e) {
        console.error('Audio playback error:', e);
        settle(false);
      }
    });
  }, []);

  /**
   * Speak `text`. Resolves with { finished } once it ends.
   * Options:
   *  - audioUrl: stream real reciter audio (Arabic melodic recitation)
   *  - useCustomVoice / customVoiceUri: play the user's own recording
   *  - notifyFinish: false to suppress onFinished (used for Arabic half of "Both")
   */
  const speak = useCallback((text, {
    words = [],
    lang = 'en-US',
    audioUrl = null,
    useCustomVoice = false,
    customVoiceUri = null,
    notifyFinish = true,
  } = {}) => {
    return new Promise(async (resolve) => {
      try {
        await stopSpeaking();
        currentTextRef.current = text;
        wordsRef.current = words;
        currentOptsRef.current = { lang, notifyFinish };

        // 1) User's own recording
        if (useCustomVoice && customVoiceUri) {
          resolve(await playSound({ uri: customVoiceUri }, { words, notifyFinish }));
          return;
        }

        // 2) Real reciter audio (melodic recitation). Falls back to TTS on failure.
        if (audioUrl) {
          const result = await playSound({ uri: audioUrl }, { words, notifyFinish });
          if (result.finished) { resolve(result); return; }
          // else: network/clip failed — fall through to device TTS below
        }

        // 3) Device text-to-speech (offline fallback / translation)
        setCurrentWordIndex(-1);
        setIsSpeaking(true);
        setIsPaused(false);

        const langPrefix = lang.substring(0, 2).toLowerCase();
        const voices = await getVoicesForLang(langPrefix);
        const selectedVoice = pickVoice(voices, ttsGender, langPrefix);
        const rate = langPrefix === 'ar' ? speed * 0.9 : speed;

        if (words.length > 0) {
          const avgWordsPerMin = Math.round(150 * speed);
          const estDuration = words.length * (60 / avgWordsPerMin) * 1000;
          scheduleWordHighlights(words, estDuration);
        }

        let settled = false;
        const settle = (finished) => {
          if (settled) return;
          settled = true;
          clearWordTimers();
          setIsSpeaking(false);
          setCurrentWordIndex(-1);
          if (finished && notifyFinish && onFinishedRef.current) onFinishedRef.current();
          resolve({ finished });
        };

        Speech.speak(text, {
          language: lang,
          rate,
          voice: selectedVoice,
          onDone: () => settle(true),
          onStopped: () => settle(false),
          onError: (e) => { console.error('Speech error:', e); settle(false); },
        });
      } catch (e) {
        console.error('TTS error:', e);
        setIsSpeaking(false);
        setIsBuffering(false);
        resolve({ finished: false });
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speed, onWordSpoken, ttsGender, stopSpeaking, playSound]);

  const speakArabic = useCallback((text, words = [], opts = {}) => {
    return speak(text, { words, lang: 'ar-SA', ...opts });
  }, [speak]);

  const speakTranslation = useCallback((text, words = [], opts = {}) => {
    return speak(text, { words, lang: 'en-US', ...opts });
  }, [speak]);

  const pauseSpeaking = useCallback(async () => {
    try {
      clearWordTimers();
      if (soundRef.current) {
        await soundRef.current.pauseAsync();
      } else {
        await Speech.pause(); // not supported on Android — falls through to stop
      }
      setIsPaused(true);
      setIsSpeaking(false);
    } catch {
      await stopSpeaking();
    }
  }, [stopSpeaking]);

  const resumeSpeaking = useCallback(async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.playAsync();
        setIsPaused(false);
        setIsSpeaking(true);
        return;
      }
      await Speech.resume();
      setIsPaused(false);
      setIsSpeaking(true);
    } catch {
      if (currentTextRef.current) {
        await speak(currentTextRef.current, {
          words: wordsRef.current,
          ...currentOptsRef.current,
        });
      }
    }
  }, [speak]);

  // Voice preview helper — plays a short recitation clip if a URL is given,
  // otherwise previews the device's standard Arabic voice.
  const previewArabicVoice = useCallback(async (genderOrUrl) => {
    if (typeof genderOrUrl === 'string' && genderOrUrl.startsWith('http')) {
      await stopSpeaking();
      await playSound({ uri: genderOrUrl }, { notifyFinish: false });
      return;
    }
    const phrase = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ';
    const voices = await getVoicesForLang('ar');
    const selectedVoice = pickVoice(voices, genderOrUrl, 'ar');
    try { await Speech.stop(); } catch {}
    Speech.speak(phrase, { language: 'ar-SA', rate: 0.75, voice: selectedVoice });
  }, [playSound, stopSpeaking]);

  useEffect(() => {
    return () => {
      clearWordTimers();
      Speech.stop().catch(() => {});
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  return {
    isSpeaking, isPaused, isBuffering, currentWordIndex,
    speak, speakArabic, speakTranslation,
    pauseSpeaking, resumeSpeaking, stopSpeaking,
    previewArabicVoice,
  };
};
