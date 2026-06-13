import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Animated, Platform, Alert, Modal, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { useApp } from '../context/AppContext';
import { SURAHS, ALL_SURAHS_META } from '../data/quranData';
import { useVoiceCommands } from '../hooks/useVoiceCommands';
import { useTTS } from '../hooks/useTTS';
import { StarBadge, ARABIC_FONT } from '../components/Ornaments';

const { width } = Dimensions.get('window');


// Build full list using proper ALL_SURAHS_META names
const FULL_LIST = ALL_SURAHS_META.map(meta => {
  const loaded = SURAHS.find(s => s.id === meta.id);
  return {
    ...meta,
    ayahs: loaded ? loaded.ayahs : null,
  };
});

// ── Voice-search matching ─────────────────────────────────────────────────────
// Reduce a transliterated Arabic name to its consonant skeleton so spoken
// variants match (e.g. "Yaseen" → "ysn" matches spoken "yasin" → "ysn";
// "Al-Faatiha" → "fth" matches "fatiha"). Leading articles are stripped.
const skeleton = (s) => (s || '')
  .toLowerCase()
  .replace(/[^a-z]/g, '')
  .replace(/^(ash|ath|al|ar|an|as|ad|at|az)/, '')
  .replace(/[aeiou]/g, '');

const FILLER = /\b(read|reads|play|plays|open|go|goes|to|the|a|an|surah|sura|soorah|chapter|recite|recitation|start|please|put|on|number|no|listen|find|search|for)\b/g;

// Find the surah a user spoke, tolerant of filler words, numbers, and spelling.
const findSurahFromSpeech = (rawText) => {
  if (!rawText) return null;
  const lower = rawText.toLowerCase();

  // "surah 36" / "number 36" / "chapter 2"
  const numMatch = lower.match(/\b(\d{1,3})\b/);
  if (numMatch) {
    const byId = SURAHS.find(s => s.id === parseInt(numMatch[1], 10));
    if (byId) return byId;
  }

  const cleaned = lower.replace(FILLER, ' ').replace(/\s+/g, ' ').trim();
  if (!cleaned) return null;

  const q = skeleton(cleaned);
  let best = null;
  let bestScore = 0;
  for (const s of SURAHS) {
    const nameSk = skeleton(s.name);
    let score = 0;
    if (q && nameSk && nameSk === q) score = 100;
    else if (q && nameSk.length >= 3 && q.length >= 3 && (nameSk.startsWith(q) || q.startsWith(nameSk))) score = 75;
    else if (q && nameSk.length >= 3 && q.length >= 3 && (nameSk.includes(q) || q.includes(nameSk))) score = 55;
    if (cleaned.length >= 3 && s.meaning.toLowerCase().includes(cleaned)) score = Math.max(score, 65);
    if (score > bestScore) { bestScore = score; best = s; }
  }
  return bestScore >= 55 ? best : null;
};

export default function SurahSelectionScreen({ navigation }) {
  const { theme, lastRead, isNightMode, toggleNightMode, ttsGender } = useApp();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All'); // All | Meccan | Medinan
  const scrollY = useRef(new Animated.Value(0)).current;
  const searchInputRef = useRef(null);

  // Close the assistant and drop focus into the text search box as a fallback.
  const useTextSearchInstead = () => {
    stopSpeaking();
    setShowAssistant(false);
    setTimeout(() => searchInputRef.current?.focus(), 350);
  };

  const { speakTranslation, stopSpeaking } = useTTS({ speed: 0.95, ttsGender });
  
  // Voice Assistant State
  const [showAssistant, setShowAssistant] = useState(false);
  const [assistantText, setAssistantText] = useState("How can I help you?");
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Forward to the latest handler so the empty-dep listener never goes stale.
  const assistantCommandRef = useRef(null);
  const stableAssistantCommand = useCallback((cmd, rawText) => {
    if (assistantCommandRef.current) assistantCommandRef.current(cmd, rawText);
  }, []);

  const { isListening, partialText, error, isAvailable, startListening, stopListening } = useVoiceCommands({
    enabled: showAssistant,
    onCommand: stableAssistantCommand,
  });

  // Voice search: resolve whatever the user said to a surah and open it.
  assistantCommandRef.current = (cmd, rawText) => {
    stopListening();
    const match = findSurahFromSpeech(rawText);
    if (match) {
      setAssistantText(`Opening Surah ${match.name}`);
      speakTranslation(`Opening Surah ${match.name}`);
      setTimeout(() => {
        setShowAssistant(false);
        navigation.navigate('Recitation', { surahId: match.id });
      }, 1300);
    } else {
      const heard = (rawText || '').trim();
      setAssistantText(heard ? `I couldn't find "${heard}". Try a surah name.` : "I didn't catch that. Please try again.");
      setTimeout(() => setShowAssistant(false), 2400);
    }
  };

  // Surface recognition errors instead of hanging on "How can I help you?"
  useEffect(() => {
    if (error && showAssistant) {
      const unavailable = /not (available|allowed)|recognizer|permission|insufficient/i.test(error);
      if (unavailable) {
        setAssistantText('Voice search needs a speech recognizer & microphone access. You can type in the search box instead.');
        const t = setTimeout(() => setShowAssistant(false), 3500);
        return () => clearTimeout(t);
      }
      // soft errors (e.g. "no match"): let the listener retry, just nudge the user
      setAssistantText('I didn\'t catch that — please say a surah name.');
    }
  }, [error, showAssistant]);

  React.useEffect(() => {
    if (showAssistant) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true })
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
    }
  }, [showAssistant]);

  React.useEffect(() => {
    if (partialText && showAssistant) {
      setAssistantText(partialText);
    }
  }, [partialText]);

  const filtered = FULL_LIST.filter(s => {
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.id.toString().includes(search) || s.nameArabic.includes(search);
    const matchFilter = filter === 'All' || s.revelationType === filter;
    return matchSearch && matchFilter;
  });

  const headerOpacity = scrollY.interpolate({ inputRange: [0, 80], outputRange: [1, 0], extrapolate: 'clamp' });
  const headerHeight = scrollY.interpolate({ inputRange: [0, 80], outputRange: [120, 0], extrapolate: 'clamp' });

  const handleSurahPress = (surah) => {
    if (!surah.ayahs) {
      Alert.alert('Coming Soon', 'Full text for this Surah is being added. Stay tuned!');
      return;
    }
    navigation.navigate('Recitation', { surahId: surah.id });
  };

  const renderSurah = ({ item }) => {
    const isLoaded = !!item.ayahs;
    const isLastRead = lastRead?.surahId === item.id;

    return (
      <TouchableOpacity
        onPress={() => handleSurahPress(item)}
        activeOpacity={0.7}
      >
        <View style={[
          styles.surahCard,
          { backgroundColor: theme.bgCard, borderColor: theme.border },
          isLastRead && { borderColor: '#C9A227', borderWidth: 1.5 },
        ]}>
          {/* Number badge — eight-point star, gold for Meccan, emerald for Medinan */}
          <StarBadge size={44} color={item.revelationType === 'Meccan' ? '#C9A227' : '#2E8B6D'}>
            <Text style={[styles.numberText, { color: theme.text }]}>{item.id}</Text>
          </StarBadge>

          {/* Info */}
          <View style={styles.surahInfo}>
            <View style={styles.surahNameRow}>
              <Text style={[styles.surahName, { color: theme.text }]}>{item.name}</Text>
              {isLastRead && (
                <View style={styles.lastReadBadge}>
                  <Text style={styles.lastReadText}>Last Read</Text>
                </View>
              )}
            </View>
            <Text style={[styles.surahMeaning, { color: theme.textMuted }]}>{item.meaning}</Text>
            <View style={styles.surahMeta}>
              <View style={[styles.typeBadge, { backgroundColor: item.revelationType === 'Meccan' ? '#0E7C5A22' : '#2E8B6D22' }]}>
                <Text style={[styles.typeText, { color: item.revelationType === 'Meccan' ? '#C9A227' : '#4CAF8E' }]}>
                  {item.revelationType}
                </Text>
              </View>
              <Text style={[styles.ayahCount, { color: theme.textMuted }]}>{item.totalAyahs} verses</Text>
            </View>
          </View>

          {/* Arabic name */}
          <Text style={[styles.arabicName, { color: '#C9A227' }]}>{item.nameArabic}</Text>


          {isLoaded
            ? <Ionicons name="chevron-forward" size={16} color={theme.textLight} />
            : <Ionicons name="time-outline" size={16} color={theme.textLight} />
          }
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <View>
            <Text style={[styles.headerTitle, { color: theme.text }]}>القرآن الكريم</Text>
            <Text style={[styles.headerSubtitle, { color: theme.textMuted }]}>Holy Qur'an · 114 Surahs</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={toggleNightMode} style={[styles.iconBtn, { backgroundColor: theme.bgMuted }]}>
              <Ionicons name={isNightMode ? 'sunny' : 'moon'} size={18} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Last read banner */}
        {lastRead && (
          <TouchableOpacity
            onPress={() => navigation.navigate('Recitation', { surahId: lastRead.surahId, ayahId: lastRead.ayahId })}
            style={styles.resumeBanner}
          >
            <LinearGradient colors={['#0E7C5A22', '#0E7C5A11']} style={styles.resumeGrad}>
              <Ionicons name="play-circle" size={22} color="#C9A227" />
              <Text style={styles.resumeText}>Continue where you left off</Text>
              <Ionicons name="chevron-forward" size={16} color="#C9A227" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Search */}
        <View style={[styles.searchWrap, { backgroundColor: theme.bgMuted }]}>
          <Ionicons name="search" size={16} color={theme.textMuted} />
          <TextInput
            ref={searchInputRef}
            value={search}
            onChangeText={setSearch}
            placeholder="Search surah or number..."
            placeholderTextColor={theme.textMuted}
            style={[styles.searchInput, { color: theme.text }]}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={theme.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter tabs */}
        <View style={[styles.filterRow, { borderBottomColor: theme.border }]}>
          {['All', 'Meccan', 'Medinan'].map(f => (
            <TouchableOpacity key={f} onPress={() => setFilter(f)} style={[styles.filterTab, filter === f && styles.filterTabActive]}>
              <Text style={[styles.filterText, { color: filter === f ? '#C9A227' : theme.textMuted }]}>{f}</Text>
              {filter === f && <View style={styles.filterUnderline} />}
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>

      <Animated.FlatList
        data={filtered}
        keyExtractor={item => item.id.toString()}
        renderItem={renderSurah}
        contentContainerStyle={styles.listContent}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />

      {/* Assistant FAB */}
      <TouchableOpacity 
        style={styles.fab} 
        activeOpacity={0.8}
        onPress={() => {
          setAssistantText("How can I help you?");
          setShowAssistant(true);
        }}
      >
        <LinearGradient colors={['#C9A227', '#D9B845', '#E3CE8F']} style={styles.fabGrad}>
          <Ionicons name="mic" size={24} color="#FFF" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Voice Assistant Modal */}
      <Modal visible={showAssistant} transparent animationType="fade">
        <View style={styles.assistantOverlay}>
          <TouchableOpacity 
            style={StyleSheet.absoluteFillObject} 
            onPress={() => { stopSpeaking(); setShowAssistant(false); }} 
          />
          <View style={[styles.assistantCard, { backgroundColor: theme.bgCard }]}>
            <Text style={[styles.assistantTitle, { color: theme.text }]}>Voice Assistant</Text>
            
            <View style={styles.orbContainer}>
              <Animated.View style={[
                styles.orbPulse, 
                { transform: [{ scale: pulseAnim }], backgroundColor: isListening ? '#C9A22744' : 'transparent' }
              ]} />
              <LinearGradient colors={['#C9A227', '#0E7C5A']} style={styles.orb}>
                <Ionicons name={isListening ? "mic" : "mic-outline"} size={40} color="#FFF" />
              </LinearGradient>
            </View>

            <Text style={[styles.assistantText, { color: theme.text }]}>
              "{assistantText}"
            </Text>
            <Text style={[styles.assistantHint, { color: theme.textMuted }]}>
              {!isAvailable
                ? 'Voice search needs a development/release build'
                : isListening
                  ? 'Listening… say a surah name'
                  : 'Try saying "Yaseen", "Al-Kahf", or "Surah 36"'}
            </Text>

            {/* Always-available fallback so the assistant is never a dead end */}
            <TouchableOpacity onPress={useTextSearchInstead} style={styles.typeInsteadBtn}>
              <Ionicons name="keypad-outline" size={16} color="#0E7C5A" />
              <Text style={styles.typeInsteadText}>Type a surah instead</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { stopSpeaking(); setShowAssistant(false); }} style={styles.closeAssistantBtn}>
              <Text style={styles.closeAssistantText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { zIndex: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 24, fontWeight: '700', fontFamily: ARABIC_FONT },
  headerSubtitle: { fontSize: 12, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  resumeBanner: { marginHorizontal: 16, marginVertical: 8, borderRadius: 12, overflow: 'hidden' },
  resumeGrad: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, gap: 8 },
  resumeText: { flex: 1, color: '#C9A227', fontSize: 13, fontWeight: '600' },
  searchWrap: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginVertical: 8, gap: 8 },
  searchInput: { flex: 1, fontSize: 14 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 20, borderBottomWidth: 1, marginBottom: 4 },
  filterTab: { paddingVertical: 10, paddingHorizontal: 16, position: 'relative' },
  filterTabActive: {},
  filterText: { fontSize: 13, fontWeight: '600' },
  filterUnderline: { position: 'absolute', bottom: 0, left: 16, right: 16, height: 2, backgroundColor: '#C9A227', borderRadius: 1 },
  listContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 100 },
  surahCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 14, borderWidth: 1, gap: 12 },
  numberText: { fontSize: 12, fontWeight: '700' },
  surahInfo: { flex: 1 },
  surahNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  surahName: { fontSize: 16, fontWeight: '700' },
  lastReadBadge: { backgroundColor: '#0E7C5A22', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  lastReadText: { color: '#C9A227', fontSize: 9, fontWeight: '700' },
  surahMeaning: { fontSize: 12, marginTop: 2 },
  surahMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  typeBadge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  typeText: { fontSize: 10, fontWeight: '600' },
  ayahCount: { fontSize: 11 },
  arabicName: { fontSize: 19, fontFamily: ARABIC_FONT },
  lockedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#88888822', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  lockedBadgeText: { color: '#888', fontSize: 9, fontWeight: '700' },
  fab: { position: 'absolute', bottom: Platform.OS === 'ios' ? 100 : 80, right: 20, shadowColor: '#C9A227', shadowOpacity: 0.5, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 8 },
  fabGrad: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  assistantOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  assistantCard: { padding: 30, borderTopLeftRadius: 30, borderTopRightRadius: 30, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 20 },
  assistantTitle: { fontSize: 18, fontWeight: '600', marginBottom: 20 },
  orbContainer: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center', marginVertical: 10 },
  orbPulse: { position: 'absolute', width: 120, height: 120, borderRadius: 60 },
  orb: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  assistantText: { fontSize: 18, fontWeight: '500', textAlign: 'center', marginVertical: 20, minHeight: 50 },
  assistantHint: { fontSize: 13, marginBottom: 20, textAlign: 'center' },
  typeInsteadBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, backgroundColor: '#0E7C5A18', marginBottom: 10 },
  typeInsteadText: { color: '#0E7C5A', fontSize: 14, fontWeight: '600' },
  closeAssistantBtn: { paddingVertical: 12, paddingHorizontal: 30, borderRadius: 20, backgroundColor: '#C9A22722' },
  closeAssistantText: { color: '#C9A227', fontSize: 15, fontWeight: '600' },
});
