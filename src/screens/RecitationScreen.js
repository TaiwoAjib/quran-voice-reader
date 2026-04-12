import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Platform, Dimensions, Alert, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useApp } from '../context/AppContext';
import { useTTS } from '../hooks/useTTS';
import { useVoiceCommands } from '../hooks/useVoiceCommands';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { SURAHS, getSurahById } from '../data/quranData';

const { width, height } = Dimensions.get('window');

const MODES = { READING: 'reading', PRACTICE: 'practice' };

export default function RecitationScreen({ route, navigation }) {
  const { surahId: initSurahId = 1, ayahId: initAyahId = 1 } = route.params || {};
  const {
    theme, currentProfile, showTranslation, showTransliteration, readingSpeed,
    isNightMode, addBookmark, removeBookmark, isBookmarked, updateLastRead,
    recitationLanguage, setRecitationLanguage, voiceMode, ttsGender,
    updateProfileRecordings,
  } = useApp();

  const [surah, setSurah] = useState(getSurahById(initSurahId));
  const [currentAyahIndex, setCurrentAyahIndex] = useState(initAyahId - 1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [highlightedWordIndex, setHighlightedWordIndex] = useState(-1);
  const [mode, setMode] = useState(MODES.READING);
  const [voiceCommandsEnabled, setVoiceCommandsEnabled] = useState(true);
  const [showReflection, setShowReflection] = useState(false);
  const [showModeMenu, setShowModeMenu] = useState(false);

  // Practice Mode recording state
  const [practiceRecUri, setPracticeRecUri] = useState(null);
  const [showPracticeSaved, setShowPracticeSaved] = useState(false);

  const scrollRef = useRef(null);
  const ayahRefs = useRef({});
  const micPulse = useRef(new Animated.Value(1)).current;
  const recordPulse = useRef(new Animated.Value(1)).current;

  // Keep latest values in refs so callbacks never go stale
  const isPlayingRef = useRef(isPlaying);
  const currentAyahIndexRef = useRef(currentAyahIndex);
  const surahRef = useRef(surah);
  const handleVoiceCommandRef = useRef(null);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { currentAyahIndexRef.current = currentAyahIndex; }, [currentAyahIndex]);
  useEffect(() => { surahRef.current = surah; }, [surah]);

  const currentAyah = surah?.ayahs?.[currentAyahIndex];
  const bookmarked = currentAyah ? isBookmarked(surah.id, currentAyah.id) : false;

  // ── TTS ────────────────────────────────────────────────────────────────────
  // Bug fix #4: onFinished uses refs so it doesn't capture stale isPlaying / currentAyahIndex
  const handleAyahFinishedRef = useRef(null);

  const { isSpeaking, speak, speakArabic, speakTranslation, pauseSpeaking, resumeSpeaking, stopSpeaking } = useTTS({
    speed: readingSpeed,
    ttsGender,
    onWordSpoken: (idx) => setHighlightedWordIndex(idx),
    onFinished: () => { if (handleAyahFinishedRef.current) handleAyahFinishedRef.current(); },
  });

  // ── Voice Recorder (Practice Mode) ────────────────────────────────────────
  const {
    isRecording, recordingDuration, audioLevel,
    startRecording, stopRecording, saveRecording, playRecording,
  } = useVoiceRecorder();

  // ── Voice Commands ─────────────────────────────────────────────────────────
  // Use a stable ref-forwarding wrapper so useVoiceCommands (empty-dep useEffect) always
  // calls the latest version of handleVoiceCommand — same pattern as handleAyahFinishedRef.
  const stableVoiceCommand = useCallback((cmd, rawText) => {
    if (handleVoiceCommandRef.current) handleVoiceCommandRef.current(cmd, rawText);
  }, []);

  const { isListening } = useVoiceCommands({
    enabled: voiceCommandsEnabled && mode === MODES.READING,
    onCommand: stableVoiceCommand,
  });

  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(micPulse, { toValue: 1.2, duration: 700, useNativeDriver: true }),
          Animated.timing(micPulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        ])
      ).start();
    } else {
      micPulse.setValue(1);
    }
  }, [isListening]);

  // Pulse animation on record button in Practice Mode
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(recordPulse, { toValue: 1.15, duration: 600, useNativeDriver: true }),
          Animated.timing(recordPulse, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      recordPulse.setValue(1);
    }
  }, [isRecording]);

  useEffect(() => {
    if (currentAyah) {
      updateLastRead(surah.id, currentAyah.id);
      scrollToCurrentAyah();
    }
  }, [currentAyahIndex, surah]);

  // ── playAyah (defined before handleAyahFinished so ref can be set) ─────────
  const playAyah = useCallback(async (ayah) => {
    if (!ayah) return;
    setIsPlaying(true);
    setIsPaused(false);
    setHighlightedWordIndex(-1);
    try {
      const useCustomVoice = voiceMode === 'personalized';
      const customVoiceUri = useCustomVoice && currentProfile?.recordings?.length > 0
        ? currentProfile.recordings[0]
        : null;

      if (recitationLanguage === 'arabic') {
        await speakArabic(ayah.arabic, ayah.words || [], useCustomVoice, customVoiceUri);
      } else if (recitationLanguage === 'english') {
        await speakTranslation(ayah.translation, [], useCustomVoice, customVoiceUri);
      } else {
        await speakArabic(ayah.arabic, ayah.words || [], useCustomVoice, customVoiceUri);
        if (ayah.translation) {
          await new Promise(res => setTimeout(res, 400));
          await speakTranslation(ayah.translation, [], useCustomVoice, customVoiceUri);
        }
      }
    } catch (e) {
      console.error('Playback error:', e);
    }
  }, [speakArabic, speakTranslation, recitationLanguage, voiceMode, currentProfile]);

  // Bug fix #4: define handleAyahFinished using refs so it's never stale
  handleAyahFinishedRef.current = useCallback(() => {
    setHighlightedWordIndex(-1);
    const idx = currentAyahIndexRef.current;
    const s = surahRef.current;
    const nextIndex = idx + 1;
    if (nextIndex < s.ayahs.length) {
      setCurrentAyahIndex(nextIndex);
      if (isPlayingRef.current) {
        const nextAyah = s.ayahs[nextIndex];
        setTimeout(() => playAyah(nextAyah), 600);
      }
    } else {
      setIsPlaying(false);
      setShowReflection(true);
    }
  }, [playAyah]);

  const handleStop = useCallback(async () => {
    await stopSpeaking();
    setIsPlaying(false);
    setIsPaused(false);
    setHighlightedWordIndex(-1);
  }, [stopSpeaking]);

  const handlePlayPause = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isSpeaking && !isPaused) {
      await pauseSpeaking();
      setIsPaused(true);
      setIsPlaying(false);
    } else if (isPaused) {
      await resumeSpeaking();
      setIsPaused(false);
      setIsPlaying(true);
    } else {
      await playAyah(currentAyah);
    }
  }, [isSpeaking, isPaused, pauseSpeaking, resumeSpeaking, playAyah, currentAyah]);

  const handleNext = useCallback(async () => {
    await handleStop();
    if (currentAyahIndex < surah.ayahs.length - 1) {
      setCurrentAyahIndex(i => i + 1);
    }
  }, [currentAyahIndex, surah, handleStop]);

  const handlePrev = useCallback(async () => {
    await handleStop();
    if (currentAyahIndex > 0) {
      setCurrentAyahIndex(i => i - 1);
    }
  }, [currentAyahIndex, handleStop]);

  const handleRepeat = useCallback(async () => {
    await handleStop();
    setTimeout(() => playAyah(currentAyah), 200);
  }, [currentAyah, handleStop, playAyah]);

  const handleNextSurah = useCallback(async () => {
    await handleStop();
    const nextSurah = getSurahById(surah.id + 1);
    if (nextSurah) {
      setSurah(nextSurah);
      setCurrentAyahIndex(0);
      setShowReflection(false);
    }
  }, [surah, handleStop]);

  // ── Practice Mode: record user recitation ──────────────────────────────────
  const handlePracticeRecord = useCallback(async () => {
    if (isRecording) {
      try {
        const uri = await stopRecording();
        if (uri && currentProfile) {
          const idx = (currentProfile?.recordings?.length || 0);
          const saved = await saveRecording(uri, currentProfile.id, idx);
          setPracticeRecUri(saved);
          // Persist to profile
          const existing = currentProfile?.recordings || [];
          const updated = [...existing, saved];
          await updateProfileRecordings(currentProfile.id, updated);
          setShowPracticeSaved(true);
          setTimeout(() => setShowPracticeSaved(false), 2500);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } catch (e) {
        Alert.alert('Recording Error', e.message || 'Failed to save.');
      }
    } else {
      try {
        await startRecording();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch (e) {
        Alert.alert('Microphone Error', e.message || 'Could not access microphone.');
      }
    }
  }, [isRecording, currentProfile, startRecording, stopRecording, saveRecording, updateProfileRecordings]);

  // Assign latest handleVoiceCommand to ref so stableVoiceCommand always calls current version
  handleVoiceCommandRef.current = (cmd, rawText) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (typeof cmd === 'object' && cmd !== null) {
      if (cmd.type === 'NAVIGATE_SURAH') {
        const query = cmd.text.replace(/read|surah|chapter|play/g, '').trim().toLowerCase();
        const match = SURAHS.find(s => s.name.toLowerCase().includes(query) || s.meaning.toLowerCase().includes(query));
        if (match) { handleStop(); setSurah(match); setCurrentAyahIndex(0); }
      } else if (cmd.type === 'NAVIGATE_AYAH') {
        const numMatch = cmd.text.match(/\d+/);
        if (numMatch) {
          const num = parseInt(numMatch[0], 10);
          if (num > 0 && num <= surah.ayahs.length) { handleStop(); setCurrentAyahIndex(num - 1); }
        }
      }
      return;
    }
    switch (cmd) {
      case 'PAUSE': handlePlayPause(); break;
      case 'RESUME': handlePlayPause(); break;
      case 'STOP': handleStop(); break;
      case 'NEXT': handleNext(); break;
      case 'PREVIOUS': handlePrev(); break;
      case 'REPEAT': handleRepeat(); break;
      case 'NEXT_SURAH': handleNextSurah(); break;
      case 'START': handlePlayPause(); break;
    }
  };

  const scrollToCurrentAyah = () => {
    const ref = ayahRefs.current[currentAyahIndex];
    if (ref && scrollRef.current) {
      ref.measureLayout(scrollRef.current, (x, y) => {
        scrollRef.current.scrollTo({ y: y - 100, animated: true });
      }, () => {});
    }
  };

  const handleBookmark = async () => {
    if (bookmarked) {
      await removeBookmark(surah.id, currentAyah.id);
    } else {
      await addBookmark(surah.id, currentAyah.id, surah.name);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const fontSizeMap = { small: { arabic: 26, trans: 13 }, medium: { arabic: 32, trans: 15 }, large: { arabic: 40, trans: 17 } };
  const fs = fontSizeMap[fontSize] || fontSizeMap['medium'];

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <SafeAreaView edges={['top']}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={() => { handleStop(); navigation.goBack(); }} style={styles.backBtn}>
            <Ionicons name="chevron-down" size={22} color={theme.text} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={[styles.headerSurahName, { color: theme.text }]}>{surah?.name}</Text>
            <Text style={[styles.headerArabicName, { color: '#3B82F6' }]}>{surah?.nameArabic}</Text>
          </View>

          <View style={styles.headerRight}>
            <Animated.View style={[styles.micIndicator, { transform: [{ scale: micPulse }] },
              isListening && styles.micIndicatorActive]}>
              <Ionicons name="mic" size={14} color={isListening ? '#38BDF8' : theme.textLight} />
            </Animated.View>
            <TouchableOpacity onPress={() => setShowModeMenu(true)} style={styles.modeBtn}>
              <Ionicons name="options" size={20} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* Surah header card */}
      <LinearGradient colors={isNightMode ? ['#1A1A1A', '#111'] : ['#FAF0DC', '#FFF7E6']} style={styles.surahHeaderCard}>
        <Text style={[styles.surahHeaderArabic, { color: '#3B82F6' }]}>{surah?.nameArabic}</Text>
        <Text style={[styles.surahHeaderName, { color: theme.text }]}>{surah?.name} — {surah?.meaning}</Text>
        <Text style={[styles.surahHeaderMeta, { color: theme.textMuted }]}>
          {surah?.revelationType} · {surah?.ayahs?.length || surah?.totalAyahs} verses
        </Text>
        <View style={styles.basmala}>
          <Text style={[styles.basmalaText, { color: '#3B82F6' }]}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</Text>
        </View>
      </LinearGradient>

      {/* Practice Mode banner */}
      {mode === MODES.PRACTICE && (
        <View style={[styles.practiceBanner, { backgroundColor: isRecording ? '#FEF2F2' : '#EFF6FF' }]}>
          <Animated.View style={{ transform: [{ scale: recordPulse }] }}>
            <Ionicons name={isRecording ? 'radio' : 'mic-outline'} size={16} color={isRecording ? '#EF4444' : '#3B82F6'} />
          </Animated.View>
          <Text style={[styles.practiceBannerText, { color: isRecording ? '#EF4444' : '#3B82F6' }]}>
            {isRecording
              ? `Recording your recitation… ${recordingDuration}s`
              : showPracticeSaved
                ? '✅ Recitation saved to your voice profile!'
                : 'Practice Mode — Tap 🎙️ to record your recitation'}
          </Text>
        </View>
      )}

      {/* Ayah list */}
      <ScrollView
        ref={scrollRef}
        style={styles.ayahList}
        contentContainerStyle={styles.ayahContent}
        showsVerticalScrollIndicator={false}
      >
        {surah?.ayahs?.map((ayah, index) => {
          const isActive = index === currentAyahIndex;
          return (
            <TouchableOpacity
              key={ayah.id}
              ref={el => { if (el) ayahRefs.current[index] = el; }}
              onPress={() => { setCurrentAyahIndex(index); if (isPlaying) playAyah(ayah); }}
              activeOpacity={0.85}
            >
              <View style={[
                styles.ayahCard,
                { backgroundColor: theme.bgCard, borderColor: theme.border },
                isActive && { borderColor: '#3B82F6', borderWidth: 1.5 },
                isActive && isRecording && { borderColor: '#EF4444' },
              ]}>
                {/* Verse number */}
                <View style={styles.verseNumWrap}>
                  <View style={[styles.verseNumCircle, { borderColor: isActive ? '#3B82F6' : theme.border }]}>
                    <Text style={[styles.verseNum, { color: isActive ? '#3B82F6' : theme.textMuted }]}>{ayah.number}</Text>
                  </View>
                </View>

                {/* Arabic text with word highlighting */}
                <View style={styles.ayahTextWrap}>
                  <Text style={[styles.arabicText, { color: theme.text, fontSize: fs.arabic }]} dir="rtl">
                    {isActive && highlightedWordIndex >= 0
                      ? ayah.words?.map((word, wi) => (
                        <Text key={wi} style={[wi === highlightedWordIndex && { color: '#3B82F6', fontWeight: '700' }]}>
                          {word}{' '}
                        </Text>
                      ))
                      : ayah.arabic
                    }
                  </Text>

                  {showTransliteration && (
                    <Text style={[styles.translitText, { color: theme.textMuted }]}>{ayah.transliteration}</Text>
                  )}

                  {showTranslation && (
                    <Text style={[styles.translationText, { color: theme.textMuted, fontSize: fs.trans }]}>
                      {ayah.translation}
                    </Text>
                  )}

                  {/* Ayah actions */}
                  <View style={styles.ayahActions}>
                    <TouchableOpacity
                      onPress={() => { setCurrentAyahIndex(index); playAyah(ayah); }}
                      style={styles.ayahAction}
                    >
                      <Ionicons name="play-circle-outline" size={18} color={isActive ? '#3B82F6' : theme.textLight} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleBookmark} style={styles.ayahAction}>
                      <Ionicons
                        name={isBookmarked(surah.id, ayah.id) ? 'bookmark' : 'bookmark-outline'}
                        size={18}
                        color={isBookmarked(surah.id, ayah.id) ? '#3B82F6' : theme.textLight}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Next surah button */}
        {surah && getSurahById(surah.id + 1) && (
          <TouchableOpacity onPress={handleNextSurah} style={styles.nextSurahBtn}>
            <LinearGradient colors={['#2563EB22', '#2563EB11']} style={styles.nextSurahGrad}>
              <Text style={styles.nextSurahText}>Continue to {getSurahById(surah.id + 1)?.name}</Text>
              <Ionicons name="arrow-forward" size={16} color="#3B82F6" />
            </LinearGradient>
          </TouchableOpacity>
        )}
        <View style={{ height: 200 }} />
      </ScrollView>

      {/* Voice command listener banner */}
      {isListening && (
        <View style={styles.listeningBanner}>
          <Animated.View style={{ transform: [{ scale: micPulse }] }}>
            <Ionicons name="mic" size={14} color="#38BDF8" />
          </Animated.View>
          <Text style={styles.listeningText}>Listening for commands…</Text>
        </View>
      )}

      {/* Playback controls */}
      <View style={[styles.controls, { backgroundColor: theme.bgCard, borderTopColor: theme.border }]}>
        {/* Progress */}
        <View style={styles.progress}>
          <Text style={[styles.progressText, { color: theme.textMuted }]}>
            Ayah {currentAyahIndex + 1} of {surah?.ayahs?.length}
          </Text>
          <View style={[styles.progressTrack, { backgroundColor: theme.bgMuted }]}>
            <View style={[styles.progressFill, {
              width: `${((currentAyahIndex + 1) / (surah?.ayahs?.length || 1)) * 100}%`,
              backgroundColor: theme.blue,
            }]} />
          </View>
        </View>

        {/* Language Toggle Pill */}
        <View style={styles.langToggleRow}>
          {[
            { id: 'arabic', label: 'Arabic', icon: 'text-outline' },
            { id: 'both', label: 'Both', icon: 'swap-horizontal-outline' },
            { id: 'english', label: 'English', icon: 'globe-outline' },
          ].map((opt) => {
            const active = recitationLanguage === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                onPress={() => setRecitationLanguage(opt.id)}
                style={[
                  styles.langBtn,
                  active && styles.langBtnActive,
                  { borderColor: active ? theme.blue : theme.border },
                ]}
                activeOpacity={0.75}
              >
                <Ionicons name={opt.icon} size={13} color={active ? '#FFF' : theme.textMuted} />
                <Text style={[styles.langBtnText, { color: active ? '#FFF' : theme.textMuted }]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Control buttons */}
        <View style={styles.controlBtns}>
          <TouchableOpacity onPress={handlePrev} style={styles.controlBtn} disabled={currentAyahIndex === 0}>
            <Ionicons name="play-skip-back" size={22} color={currentAyahIndex === 0 ? theme.textLight : theme.text} />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleRepeat} style={styles.controlBtn}>
            <Ionicons name="repeat" size={20} color={theme.textMuted} />
          </TouchableOpacity>

          {/* Main play button */}
          <TouchableOpacity onPress={handlePlayPause} style={styles.playBtn}>
            <LinearGradient colors={['#2563EB', '#1D4ED8']} style={styles.playBtnGrad}>
              <Ionicons
                name={isSpeaking && !isPaused ? 'pause' : 'play'}
                size={28}
                color="#FFF"
              />
            </LinearGradient>
          </TouchableOpacity>

          {/* Practice mode: record button replaces stop */}
          {mode === MODES.PRACTICE ? (
            <TouchableOpacity onPress={handlePracticeRecord} style={styles.controlBtn}>
              <Animated.View style={{ transform: [{ scale: recordPulse }] }}>
                <Ionicons
                  name={isRecording ? 'stop-circle' : 'mic-circle-outline'}
                  size={28}
                  color={isRecording ? '#EF4444' : '#3B82F6'}
                />
              </Animated.View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleStop} style={styles.controlBtn}>
              <Ionicons name="stop-circle-outline" size={20} color={theme.textMuted} />
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={handleNext} style={styles.controlBtn} disabled={currentAyahIndex === (surah?.ayahs?.length || 1) - 1}>
            <Ionicons name="play-skip-forward" size={22} color={currentAyahIndex === (surah?.ayahs?.length || 1) - 1 ? theme.textLight : theme.text} />
          </TouchableOpacity>
        </View>

        {/* Practice recording playback */}
        {mode === MODES.PRACTICE && practiceRecUri && !isRecording && (
          <TouchableOpacity
            onPress={() => playRecording(practiceRecUri)}
            style={[styles.voiceCmdToggle, { backgroundColor: '#2563EB18', marginBottom: 4 }]}
          >
            <Ionicons name="play-circle-outline" size={16} color="#3B82F6" />
            <Text style={[styles.voiceCmdText, { color: '#3B82F6' }]}>Play my last recitation</Text>
          </TouchableOpacity>
        )}

        {/* Voice commands toggle (only in Reading mode) */}
        {mode === MODES.READING && (
          <TouchableOpacity
            onPress={() => setVoiceCommandsEnabled(v => !v)}
            style={[styles.voiceCmdToggle, { backgroundColor: theme.bgMuted }]}
          >
            <Ionicons name={voiceCommandsEnabled ? 'mic' : 'mic-off'} size={14} color={voiceCommandsEnabled ? '#38BDF8' : theme.textMuted} />
            <Text style={[styles.voiceCmdText, { color: voiceCommandsEnabled ? '#38BDF8' : theme.textMuted }]}>
              {voiceCommandsEnabled ? 'Voice Commands On' : 'Voice Commands Off'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Reflection Modal */}
      <Modal visible={showReflection} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.reflectionCard, { backgroundColor: theme.bgCard }]}>
            <Text style={styles.reflectionArabic}>الحمد لله</Text>
            <Text style={[styles.reflectionTitle, { color: theme.text }]}>Surah Complete</Text>
            <Text style={[styles.reflectionSubtitle, { color: theme.textMuted }]}>You've finished {surah?.name}</Text>

            <TouchableOpacity onPress={handleNextSurah} style={styles.reflectionBtn}>
              <LinearGradient colors={['#2563EB', '#1D4ED8']} style={styles.reflectionBtnGrad}>
                <Text style={styles.reflectionBtnText}>Continue to next Surah</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { setCurrentAyahIndex(0); setShowReflection(false); }}
              style={[styles.reflectionBtnSecondary, { backgroundColor: theme.bgMuted }]}>
              <Text style={[styles.reflectionBtnSecondaryText, { color: theme.textMuted }]}>Repeat this Surah</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { addBookmark(surah.id, 1, surah.name); setShowReflection(false); }}
              style={styles.bookmarkReflectionBtn}>
              <Ionicons name="bookmark-outline" size={16} color="#3B82F6" />
              <Text style={styles.bookmarkReflectionText}>Save to Bookmarks</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShowReflection(false)} style={styles.closeReflection}>
              <Text style={[styles.closeReflectionText, { color: theme.textMuted }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Mode menu modal */}
      <Modal visible={showModeMenu} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowModeMenu(false)}>
          <View style={[styles.modeMenuCard, { backgroundColor: theme.bgCard }]}>
            <Text style={[styles.modeMenuTitle, { color: theme.text }]}>Reading Modes</Text>
            {[
              { id: MODES.READING, icon: 'book-outline', label: 'Standard Reading', desc: 'Listen and follow along with voice commands' },
              { id: MODES.PRACTICE, icon: 'mic-outline', label: 'Practice Mode', desc: 'Record your recitation and play it back' },
            ].map(m => (
              <TouchableOpacity key={m.id} onPress={() => { setMode(m.id); setShowModeMenu(false); }}
                style={[styles.modeOption, mode === m.id && { borderColor: '#3B82F6', borderWidth: 1 }, { backgroundColor: theme.bgMuted }]}>
                <Ionicons name={m.icon} size={20} color={mode === m.id ? '#3B82F6' : theme.textMuted} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.modeLabel, { color: theme.text }]}>{m.label}</Text>
                  <Text style={[styles.modeDesc, { color: theme.textMuted }]}>{m.desc}</Text>
                </View>
                {mode === m.id && <Ionicons name="checkmark-circle" size={18} color="#3B82F6" />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn: { padding: 4 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerSurahName: { fontSize: 16, fontWeight: '700' },
  headerArabicName: { fontSize: 14 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  micIndicator: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center' },
  micIndicatorActive: { backgroundColor: '#38BDF822' },
  modeBtn: { padding: 4 },
  surahHeaderCard: { paddingVertical: 20, paddingHorizontal: 24, alignItems: 'center', gap: 4 },
  surahHeaderArabic: { fontSize: 28 },
  surahHeaderName: { fontSize: 16, fontWeight: '700' },
  surahHeaderMeta: { fontSize: 12 },
  basmala: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#2563EB33', width: '100%', alignItems: 'center' },
  basmalaText: { fontSize: 20 },
  practiceBanner: { paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  practiceBannerText: { flex: 1, fontSize: 13, fontWeight: '600' },
  ayahList: { flex: 1 },
  ayahContent: { paddingHorizontal: 16, paddingTop: 12 },
  ayahCard: { borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, flexDirection: 'row', gap: 12 },
  verseNumWrap: { paddingTop: 4 },
  verseNumCircle: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  verseNum: { fontSize: 12, fontWeight: '700' },
  ayahTextWrap: { flex: 1 },
  arabicText: { textAlign: 'right', lineHeight: 52, fontFamily: Platform.OS === 'ios' ? 'Arial' : 'sans-serif', marginBottom: 10 },
  translitText: { fontSize: 13, fontStyle: 'italic', marginBottom: 8, lineHeight: 20 },
  translationText: { lineHeight: 22, marginBottom: 10 },
  ayahActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  ayahAction: { padding: 4 },
  listeningBanner: { position: 'absolute', top: 100, alignSelf: 'center', backgroundColor: '#38BDF822', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#38BDF844' },
  listeningText: { color: '#38BDF8', fontSize: 12 },
  controls: { borderTopWidth: 1, paddingHorizontal: 20, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 34 : 16 },
  progress: { marginBottom: 12 },
  progressText: { fontSize: 11, marginBottom: 6 },
  progressTrack: { height: 3, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#3B82F6', borderRadius: 2 },
  controlBtns: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 10 },
  controlBtn: { padding: 8 },
  playBtn: { borderRadius: 32, overflow: 'hidden', shadowColor: '#3B82F6', shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },
  playBtnGrad: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center', borderRadius: 32 },
  voiceCmdToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 6, borderRadius: 20, paddingHorizontal: 14, alignSelf: 'center', marginBottom: 2 },
  voiceCmdText: { fontSize: 11 },
  langToggleRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 10 },
  langBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, backgroundColor: 'transparent' },
  langBtnActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  langBtnText: { fontSize: 12, fontWeight: '600' },
  nextSurahBtn: { marginTop: 8, borderRadius: 12, overflow: 'hidden' },
  nextSurahGrad: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20, gap: 8, justifyContent: 'center' },
  nextSurahText: { color: '#3B82F6', fontWeight: '600', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' },
  reflectionCard: { margin: 20, borderRadius: 24, padding: 28, alignItems: 'center' },
  reflectionArabic: { fontSize: 32, color: '#3B82F6', marginBottom: 8 },
  reflectionTitle: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  reflectionSubtitle: { fontSize: 14, marginBottom: 24 },
  reflectionBtn: { width: '100%', borderRadius: 12, overflow: 'hidden', marginBottom: 10 },
  reflectionBtnGrad: { paddingVertical: 14, alignItems: 'center' },
  reflectionBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  reflectionBtnSecondary: { width: '100%', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
  reflectionBtnSecondaryText: { fontSize: 15, fontWeight: '600' },
  bookmarkReflectionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10 },
  bookmarkReflectionText: { color: '#3B82F6', fontSize: 14 },
  closeReflection: { padding: 10 },
  closeReflectionText: { fontSize: 13 },
  modeMenuCard: { marginHorizontal: 16, marginBottom: 40, borderRadius: 20, padding: 20 },
  modeMenuTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  modeOption: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, marginBottom: 8 },
  modeLabel: { fontSize: 15, fontWeight: '600' },
  modeDesc: { fontSize: 12, marginTop: 2 },
});
