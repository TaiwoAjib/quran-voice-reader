import React, { useState, useRef } from 'react';
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

const { width } = Dimensions.get('window');


// Build full list using proper ALL_SURAHS_META names
const FULL_LIST = ALL_SURAHS_META.map(meta => {
  const loaded = SURAHS.find(s => s.id === meta.id);
  return {
    ...meta,
    ayahs: loaded ? loaded.ayahs : null,
  };
});

export default function SurahSelectionScreen({ navigation }) {
  const { theme, lastRead, isNightMode, toggleNightMode, ttsGender } = useApp();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All'); // All | Meccan | Medinan
  const scrollY = useRef(new Animated.Value(0)).current;

  const { speakTranslation, stopSpeaking } = useTTS({ speed: 0.95, ttsGender });
  
  // Voice Assistant State
  const [showAssistant, setShowAssistant] = useState(false);
  const [assistantText, setAssistantText] = useState("How can I help you?");
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const { isListening, partialText, startListening, stopListening } = useVoiceCommands({
    enabled: showAssistant,
    onCommand: async (cmd, rawText) => {
      stopListening();
      if (cmd && cmd.type === 'NAVIGATE_SURAH') {
        const query = cmd.text.replace(/read|surah|chapter|play/g, '').trim().toLowerCase();
        const match = SURAHS.find(s => s.name.toLowerCase().includes(query) || s.meaning.toLowerCase().includes(query));
        if (match) {
          setAssistantText(`Playing Surah ${match.name}`);
          speakTranslation(`Playing Surah ${match.name}`);
          setTimeout(() => {
            setShowAssistant(false);
            navigation.navigate('Recitation', { surahId: match.id });
          }, 1500);
        } else {
          setAssistantText("I couldn't find that Surah.");
          speakTranslation("I couldn't find that Surah.");
          setTimeout(() => setShowAssistant(false), 2000);
        }
      } else {
        setAssistantText("I didn't catch a valid command.");
        speakTranslation("I didn't catch a valid command.");
        setTimeout(() => setShowAssistant(false), 2000);
      }
    }
  });

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
          isLastRead && { borderColor: '#3B82F6', borderWidth: 1.5 },
        ]}>
          {/* Number badge */}
          <View style={[styles.numberBadge, { borderColor: item.revelationType === 'Meccan' ? '#3B82F6' : '#0EA5E9' }]}>
            <Text style={[styles.numberText, { color: theme.text }]}>{item.id}</Text>
          </View>

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
              <View style={[styles.typeBadge, { backgroundColor: item.revelationType === 'Meccan' ? '#2563EB22' : '#0EA5E922' }]}>
                <Text style={[styles.typeText, { color: item.revelationType === 'Meccan' ? '#3B82F6' : '#38BDF8' }]}>
                  {item.revelationType}
                </Text>
              </View>
              <Text style={[styles.ayahCount, { color: theme.textMuted }]}>{item.totalAyahs} verses</Text>
            </View>
          </View>

          {/* Arabic name */}
          <Text style={[styles.arabicName, { color: '#3B82F6' }]}>{item.nameArabic}</Text>

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
            <LinearGradient colors={['#2563EB22', '#2563EB11']} style={styles.resumeGrad}>
              <Ionicons name="play-circle" size={22} color="#3B82F6" />
              <Text style={styles.resumeText}>Continue where you left off</Text>
              <Ionicons name="chevron-forward" size={16} color="#3B82F6" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Search */}
        <View style={[styles.searchWrap, { backgroundColor: theme.bgMuted }]}>
          <Ionicons name="search" size={16} color={theme.textMuted} />
          <TextInput
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
              <Text style={[styles.filterText, { color: filter === f ? '#3B82F6' : theme.textMuted }]}>{f}</Text>
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
        <LinearGradient colors={['#3B82F6', '#60A5FA', '#93C5FD']} style={styles.fabGrad}>
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
                { transform: [{ scale: pulseAnim }], backgroundColor: isListening ? '#3B82F644' : 'transparent' }
              ]} />
              <LinearGradient colors={['#3B82F6', '#8B5CF6']} style={styles.orb}>
                <Ionicons name={isListening ? "mic" : "mic-outline"} size={40} color="#FFF" />
              </LinearGradient>
            </View>

            <Text style={[styles.assistantText, { color: theme.text }]}>
              "{assistantText}"
            </Text>
            <Text style={[styles.assistantHint, { color: theme.textMuted }]}>
              Try saying "Play Surah Yasin"
            </Text>
            
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
  headerTitle: { fontSize: 22, fontWeight: '700' },
  headerSubtitle: { fontSize: 12, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  resumeBanner: { marginHorizontal: 16, marginVertical: 8, borderRadius: 12, overflow: 'hidden' },
  resumeGrad: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, gap: 8 },
  resumeText: { flex: 1, color: '#3B82F6', fontSize: 13, fontWeight: '600' },
  searchWrap: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginVertical: 8, gap: 8 },
  searchInput: { flex: 1, fontSize: 14 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 20, borderBottomWidth: 1, marginBottom: 4 },
  filterTab: { paddingVertical: 10, paddingHorizontal: 16, position: 'relative' },
  filterTabActive: {},
  filterText: { fontSize: 13, fontWeight: '600' },
  filterUnderline: { position: 'absolute', bottom: 0, left: 16, right: 16, height: 2, backgroundColor: '#3B82F6', borderRadius: 1 },
  listContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 100 },
  surahCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 14, borderWidth: 1, gap: 12 },
  numberBadge: { width: 42, height: 42, borderRadius: 21, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  numberText: { fontSize: 13, fontWeight: '700' },
  surahInfo: { flex: 1 },
  surahNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  surahName: { fontSize: 16, fontWeight: '700' },
  lastReadBadge: { backgroundColor: '#2563EB22', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  lastReadText: { color: '#3B82F6', fontSize: 9, fontWeight: '700' },
  surahMeaning: { fontSize: 12, marginTop: 2 },
  surahMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  typeBadge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  typeText: { fontSize: 10, fontWeight: '600' },
  ayahCount: { fontSize: 11 },
  arabicName: { fontSize: 18, fontFamily: Platform.OS === 'ios' ? 'Arial' : 'sans-serif' },
  lockedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#88888822', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  lockedBadgeText: { color: '#888', fontSize: 9, fontWeight: '700' },
  fab: { position: 'absolute', bottom: Platform.OS === 'ios' ? 100 : 80, right: 20, shadowColor: '#3B82F6', shadowOpacity: 0.5, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 8 },
  fabGrad: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  assistantOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  assistantCard: { padding: 30, borderTopLeftRadius: 30, borderTopRightRadius: 30, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 20 },
  assistantTitle: { fontSize: 18, fontWeight: '600', marginBottom: 20 },
  orbContainer: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center', marginVertical: 10 },
  orbPulse: { position: 'absolute', width: 120, height: 120, borderRadius: 60 },
  orb: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  assistantText: { fontSize: 18, fontWeight: '500', textAlign: 'center', marginVertical: 20, minHeight: 50 },
  assistantHint: { fontSize: 13, marginBottom: 30 },
  closeAssistantBtn: { paddingVertical: 12, paddingHorizontal: 30, borderRadius: 20, backgroundColor: '#3B82F622' },
  closeAssistantText: { color: '#3B82F6', fontSize: 15, fontWeight: '600' },
});
