import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { useTTS } from '../hooks/useTTS';
import { TRAINING_SENTENCES } from '../data/quranData';
import { RECITERS, getAyahAudioUrl } from '../data/reciters';
import { ARABIC_FONT } from '../components/Ornaments';

// ── Animated waveform shown while recording ────────────────────────────────────
function Waveform({ isActive, audioLevel }) {
  const bars = [useRef(new Animated.Value(0.3)).current,
                useRef(new Animated.Value(0.3)).current,
                useRef(new Animated.Value(0.3)).current,
                useRef(new Animated.Value(0.3)).current,
                useRef(new Animated.Value(0.3)).current];

  useEffect(() => {
    if (!isActive) {
      bars.forEach(b => Animated.timing(b, { toValue: 0.3, duration: 200, useNativeDriver: true }).start());
      return;
    }
    const animations = bars.map((bar, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(bar, {
            toValue: 0.3 + Math.random() * 0.7,
            duration: 200 + i * 80,
            useNativeDriver: true,
          }),
          Animated.timing(bar, {
            toValue: 0.2 + Math.random() * 0.4,
            duration: 200 + i * 60,
            useNativeDriver: true,
          }),
        ])
      )
    );
    animations.forEach(a => a.start());
    return () => animations.forEach(a => a.stop());
  }, [isActive]);

  return (
    <View style={waveStyles.container}>
      {bars.map((bar, i) => (
        <Animated.View
          key={i}
          style={[waveStyles.bar, { transform: [{ scaleY: bar }] }]}
        />
      ))}
    </View>
  );
}

const waveStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 40 },
  bar: { width: 5, height: 36, borderRadius: 3, backgroundColor: '#EF4444' },
});

// ── Main Voice Settings Screen ─────────────────────────────────────────────────
export default function VoiceSettingsScreen({ navigation }) {
  const {
    theme, currentProfile, readingSpeed, showTranslation, showTransliteration,
    isNightMode, fontSize, updateSettings, recitationLanguage, setRecitationLanguage,
    voiceMode, setVoiceMode, ttsGender, updateTtsGender, updateProfileRecordings,
    reciter, setReciter,
  } = useApp();

  const {
    isRecording, recordingDuration, audioLevel,
    startRecording, stopRecording, saveRecording, playRecording, deleteRecording,
  } = useVoiceRecorder();

  const { previewArabicVoice, stopSpeaking } = useTTS({ ttsGender });

  const [activeSection, setActiveSection] = useState(null);
  // Map: sampleIndex → saved URI (either freshly recorded or from profile)
  const [sampleUris, setSampleUris] = useState({});

  // Re-sync from the profile whenever it loads/changes — the profile arrives
  // asynchronously from AsyncStorage, so a mount-time initializer misses it.
  useEffect(() => {
    const map = {};
    (currentProfile?.recordings || []).forEach((uri, i) => { if (uri) map[i] = uri; });
    setSampleUris(map);
  }, [currentProfile?.id, currentProfile?.recordings?.length]);
  const [activeSampleIdx, setActiveSampleIdx] = useState(null); // which sample is being recorded
  const [previewingGender, setPreviewingGender] = useState(null);
  const [previewingReciter, setPreviewingReciter] = useState(null);

  // Stop any preview audio when leaving the screen
  useEffect(() => () => { stopSpeaking?.(); }, []);

  // ── Recording handlers ──────────────────────────────────────────────────────
  const handleToggleRecord = async (sampleIdx) => {
    if (isRecording && activeSampleIdx === sampleIdx) {
      // Stop recording for this sample
      try {
        const uri = await stopRecording();
        if (uri && currentProfile) {
          const saved = await saveRecording(uri, currentProfile.id, sampleIdx);
          const next = { ...sampleUris, [sampleIdx]: saved };
          setSampleUris(next);
          // Bug fix: persist recordings array back into the profile
          const newRecordings = [];
          Object.keys(next).forEach(k => { newRecordings[parseInt(k)] = next[k]; });
          await updateProfileRecordings(currentProfile.id, newRecordings);
        }
      } catch (e) {
        Alert.alert('Recording Error', e.message || 'Failed to save recording.');
      } finally {
        setActiveSampleIdx(null);
      }
    } else {
      if (isRecording) {
        // Stop any other in-progress recording first
        await stopRecording();
        setActiveSampleIdx(null);
        return;
      }
      try {
        await startRecording();
        setActiveSampleIdx(sampleIdx);
      } catch (e) {
        Alert.alert('Microphone Error', e.message || 'Could not access microphone.');
      }
    }
  };

  const handleDeleteSample = (sampleIdx) => {
    Alert.alert('Delete Recording', 'Delete this voice sample?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          if (!currentProfile) return;
          const uri = sampleUris[sampleIdx];
          if (uri) await deleteRecording(uri);
          const next = { ...sampleUris };
          delete next[sampleIdx];
          setSampleUris(next);
          const newRecordings = [];
          Object.keys(next).forEach(k => { newRecordings[parseInt(k)] = next[k]; });
          await updateProfileRecordings(currentProfile.id, newRecordings);
        }
      },
    ]);
  };

  // ── Voice / reciter previews ────────────────────────────────────────────────
  const handlePreviewVoice = async (gender) => {
    setPreviewingGender(gender);
    await previewArabicVoice(gender);
    setTimeout(() => setPreviewingGender(null), 3000);
  };

  // Streams Al-Fatiha v1 in the chosen qari's voice so the melody can be heard.
  const handlePreviewReciter = async (reciterId) => {
    setPreviewingReciter(reciterId);
    const url = getAyahAudioUrl(reciterId, 1, 1);
    try {
      await previewArabicVoice(url);
    } catch {}
    setTimeout(() => setPreviewingReciter(null), 9000);
  };

  const speedOptions = [
    { label: 'Slow', value: 0.6 },
    { label: 'Normal', value: 0.9 },
    { label: 'Fast', value: 1.2 },
  ];

  const fontOptions = [
    { label: 'A', value: 'small', size: 14 },
    { label: 'A', value: 'medium', size: 18 },
    { label: 'A', value: 'large', size: 22 },
  ];

  const COMMANDS = [
    { icon: 'pause', cmd: '"Pause recitation"', desc: 'Pauses the audio' },
    { icon: 'play', cmd: '"Resume reading"', desc: 'Continues playback' },
    { icon: 'stop', cmd: '"Stop"', desc: 'Stops completely' },
    { icon: 'play-skip-forward', cmd: '"Next ayah"', desc: 'Goes to next verse' },
    { icon: 'play-skip-back', cmd: '"Previous ayah"', desc: 'Goes to previous verse' },
    { icon: 'repeat', cmd: '"Repeat ayah"', desc: 'Replays current verse' },
    { icon: 'arrow-forward-circle', cmd: '"Go to next Surah"', desc: 'Advances to next chapter' },
  ];

  const recordedCount = Object.keys(sampleUris).length;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <SafeAreaView edges={['top']}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Voice & Settings</Text>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Voice Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
          <View style={styles.profileTop}>
            <Text style={{ fontSize: 32 }}>{currentProfile?.avatar || '👤'}</Text>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: theme.text }]}>{currentProfile?.name || 'Guest'}</Text>
              <Text style={[styles.profileMeta, { color: theme.textMuted }]}>
                {recordedCount > 0
                  ? `${recordedCount} voice sample${recordedCount > 1 ? 's' : ''} recorded`
                  : 'No voice samples yet'}
              </Text>
            </View>
            <View style={[styles.profileBadge, { backgroundColor: '#0E7C5A22' }]}>
              <Ionicons name="mic-outline" size={16} color="#C9A227" />
              <Text style={[styles.profileBadgeText, { color: '#C9A227' }]}>Voice</Text>
            </View>
          </View>
        </View>

        {/* ── Voice Samples Section ─────────────────────────────────────────── */}
        <SectionHeader
          title="🎙️ Voice Samples"
          theme={theme}
          onPress={() => setActiveSection(s => s === 'voice' ? null : 'voice')}
          isOpen={activeSection === 'voice'}
        />
        {activeSection === 'voice' && (
          <View style={[styles.section, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
            <Text style={[styles.sectionDesc, { color: theme.textMuted }]}>
              Record yourself reading these sentences to practise your recitation. With "My Recitation" mode you can listen back to your own recordings.
            </Text>

            {TRAINING_SENTENCES.slice(0, 5).map((sentence, idx) => {
              const hasRecording = !!sampleUris[idx];
              const isThisRecording = isRecording && activeSampleIdx === idx;

              return (
                <View key={idx} style={[styles.sampleCard, { borderColor: isThisRecording ? '#EF4444' : theme.border }]}>
                  {/* Sentence text */}
                  <Text style={[styles.sampleText, { color: theme.text }]}>{sentence.text}</Text>

                  {/* Waveform shown while recording THIS sample */}
                  {isThisRecording && (
                    <View style={styles.recordingRow}>
                      <Waveform isActive={true} audioLevel={audioLevel} />
                      <Text style={styles.timerText}>{recordingDuration}s</Text>
                    </View>
                  )}

                  {/* Action buttons */}
                  <View style={styles.sampleActions}>
                    {/* Play button — shown if recording exists */}
                    {hasRecording && !isThisRecording && (
                      <TouchableOpacity
                        onPress={() => playRecording(sampleUris[idx])}
                        style={[styles.sampleBtn, { backgroundColor: '#0E7C5A18' }]}
                      >
                        <Ionicons name="play-circle" size={18} color="#C9A227" />
                        <Text style={[styles.sampleBtnText, { color: '#C9A227' }]}>Play</Text>
                      </TouchableOpacity>
                    )}

                    {/* Record / Stop button */}
                    <TouchableOpacity
                      onPress={() => handleToggleRecord(idx)}
                      style={[
                        styles.sampleBtn,
                        isThisRecording
                          ? { backgroundColor: '#FEE2E2' }
                          : hasRecording
                            ? { backgroundColor: theme.bgMuted }
                            : { backgroundColor: '#0E7C5A18' },
                      ]}
                    >
                      <Ionicons
                        name={isThisRecording ? 'stop-circle' : 'mic'}
                        size={18}
                        color={isThisRecording ? '#EF4444' : '#C9A227'}
                      />
                      <Text style={[styles.sampleBtnText, { color: isThisRecording ? '#EF4444' : '#C9A227' }]}>
                        {isThisRecording ? 'Stop' : hasRecording ? 'Re-record' : 'Record'}
                      </Text>
                    </TouchableOpacity>

                    {/* Delete button */}
                    {hasRecording && !isThisRecording && (
                      <TouchableOpacity
                        onPress={() => handleDeleteSample(idx)}
                        style={[styles.sampleBtn, { backgroundColor: '#FEE2E2' }]}
                      >
                        <Ionicons name="trash-outline" size={16} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}

            {recordedCount === 0 && (
              <View style={styles.noSamplesHint}>
                <Ionicons name="information-circle-outline" size={18} color={theme.textMuted} />
                <Text style={[styles.noSamplesText, { color: theme.textMuted }]}>
                  Record at least one sample to enable "My Voice" mode.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ── Arabian Voice Selection ───────────────────────────────────────── */}
        <SectionHeader
          title="🕌 Recitation Voice"
          theme={theme}
          onPress={() => setActiveSection(s => s === 'mode' ? null : 'mode')}
          isOpen={activeSection === 'mode'}
        />
        {activeSection === 'mode' && (
          <View style={[styles.section, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
            <Text style={[styles.sectionDesc, { color: theme.textMuted, marginBottom: 12 }]}>
              Listen to real reciters (qaris) with authentic melodic recitation, or play back your own practice.
            </Text>

            {/* Reciter / My Recitation toggle */}
            <View style={styles.speedRow}>
              {[
                { id: 'authentic', label: '🕌 Reciter', desc: 'Melodic recitation by a qari' },
                { id: 'personalized', label: '👤 My Recitation', desc: 'Plays back your own recordings' },
              ].map(opt => (
                <TouchableOpacity
                  key={opt.id}
                  onPress={() => {
                    if (opt.id === 'personalized' && recordedCount === 0) {
                      Alert.alert('No Samples', 'Please record at least one voice sample first.');
                      return;
                    }
                    setVoiceMode(opt.id);
                  }}
                  style={[
                    styles.speedChip,
                    voiceMode === opt.id && styles.speedChipActive,
                    { flex: 1, alignItems: 'center', paddingVertical: 12 },
                  ]}
                >
                  <Text style={[styles.speedChipText, voiceMode === opt.id && styles.speedChipTextActive, { fontWeight: '700', fontSize: 13, marginBottom: 4 }]}>
                    {opt.label}
                  </Text>
                  <Text style={[styles.speedChipText, voiceMode === opt.id && styles.speedChipTextActive, { textAlign: 'center', fontSize: 10 }]}>
                    {opt.desc}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Reciter (qari) picker — real melodic recitation */}
            {voiceMode === 'authentic' && (
              <View style={{ marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.border }}>
                <Text style={[styles.settingLabel, { color: theme.text, marginBottom: 4 }]}>
                  Choose a Reciter
                </Text>
                <Text style={[styles.sectionDesc, { color: theme.textMuted, marginBottom: 14 }]}>
                  Streamed online. Tap Preview to hear the opening of Al-Fātiḥah.
                </Text>

                {RECITERS.map(r => {
                  const isSelected = reciter === r.id;
                  const isPreviewing = previewingReciter === r.id;
                  return (
                    <TouchableOpacity
                      key={r.id}
                      onPress={() => setReciter(r.id)}
                      style={[
                        styles.reciterCard,
                        { borderColor: isSelected ? '#C9A227' : theme.border, backgroundColor: isSelected ? '#0E7C5A12' : theme.bgMuted },
                      ]}
                    >
                      <View style={styles.reciterStar}>
                        <Text style={{ fontSize: 18, color: isSelected ? '#C9A227' : theme.textMuted }}>۞</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.reciterName, { color: isSelected ? '#C9A227' : theme.text }]}>{r.name}</Text>
                        <Text style={[styles.reciterNameAr, { color: isSelected ? '#C9A227' : theme.text }]}>{r.nameAr}</Text>
                        <Text style={[styles.reciterStyle, { color: theme.textMuted }]}>{r.style}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 8 }}>
                        {isSelected && <Ionicons name="checkmark-circle" size={20} color="#C9A227" />}
                        <TouchableOpacity
                          onPress={() => handlePreviewReciter(r.id)}
                          style={[styles.previewBtn, isPreviewing && styles.previewBtnActive]}
                        >
                          <Ionicons name={isPreviewing ? 'volume-high' : 'play'} size={13} color={isPreviewing ? '#FFF' : '#C9A227'} />
                          <Text style={[styles.previewBtnText, isPreviewing && { color: '#FFF' }]}>
                            {isPreviewing ? 'Playing…' : 'Preview'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  );
                })}

                {/* Offline fallback voice (device TTS, used only when audio can't load) */}
                <Text style={[styles.settingLabel, { color: theme.text, marginTop: 18, marginBottom: 10 }]}>
                  Offline fallback voice
                </Text>
                <View style={styles.speedRow}>
                  {[
                    { id: 'male', label: '🎙️ Male', nameAr: 'أحمد' },
                    { id: 'female', label: '🎵 Female', nameAr: 'فاطمة' },
                  ].map(voice => {
                    const isSelected = ttsGender === voice.id;
                    const isPreviewing = previewingGender === voice.id;
                    return (
                      <TouchableOpacity
                        key={voice.id}
                        onPress={() => updateTtsGender(voice.id)}
                        onLongPress={() => handlePreviewVoice(voice.id)}
                        style={[
                          styles.speedChip,
                          isSelected && styles.speedChipActive,
                          { flex: 1, alignItems: 'center', paddingVertical: 12 },
                        ]}
                      >
                        <Text style={[styles.speedChipText, isSelected && styles.speedChipTextActive, { fontWeight: '700', fontSize: 13 }]}>
                          {voice.label}{isPreviewing ? ' ▸' : ''}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <Text style={[styles.previewPhraseEn, { color: theme.textMuted, marginTop: 8 }]}>
                  Used only when a reciter clip can't be streamed (e.g. offline). Long-press to preview.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ── Reading Speed ────────────────────────────────────────────────── */}
        <SectionHeader title="⚡ Reading Speed" theme={theme} onPress={() => setActiveSection(s => s === 'speed' ? null : 'speed')} isOpen={activeSection === 'speed'} />
        {activeSection === 'speed' && (
          <View style={[styles.section, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
            <View style={styles.speedRow}>
              {speedOptions.map(opt => (
                <TouchableOpacity key={opt.value} onPress={() => updateSettings({ readingSpeed: opt.value })}
                  style={[styles.speedChip, Math.abs(readingSpeed - opt.value) < 0.1 && styles.speedChipActive]}>
                  <Text style={[styles.speedChipText, Math.abs(readingSpeed - opt.value) < 0.1 && styles.speedChipTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ── Recitation Language ──────────────────────────────────────────── */}
        <SectionHeader title="🌐 Recitation Language" theme={theme} onPress={() => setActiveSection(s => s === 'lang' ? null : 'lang')} isOpen={activeSection === 'lang'} />
        {activeSection === 'lang' && (
          <View style={[styles.section, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
            <Text style={[styles.sectionDesc, { color: theme.textMuted, marginBottom: 12 }]}>
              Choose the language used when the app reads ayahs aloud. Arabic uses your chosen reciter; English is narrated by Ibrahim Walk (Sahih International).
            </Text>
            <View style={styles.speedRow}>
              {[
                { id: 'arabic', label: '🕌 Arabic', desc: 'Arabic recitation only' },
                { id: 'both', label: '⚡ Both', desc: 'Arabic then English' },
                { id: 'english', label: '🌐 English', desc: 'English translation only' },
              ].map(opt => (
                <TouchableOpacity
                  key={opt.id}
                  onPress={() => setRecitationLanguage(opt.id)}
                  style={[
                    styles.speedChip,
                    recitationLanguage === opt.id && styles.speedChipActive,
                    { flex: 1, alignItems: 'center', paddingVertical: 10 },
                  ]}
                >
                  <Text style={[styles.speedChipText, recitationLanguage === opt.id && styles.speedChipTextActive, { textAlign: 'center', fontSize: 11 }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ── Display Settings ─────────────────────────────────────────────── */}
        <SectionHeader title="📱 Display Settings" theme={theme} onPress={() => setActiveSection(s => s === 'display' ? null : 'display')} isOpen={activeSection === 'display'} />
        {activeSection === 'display' && (
          <View style={[styles.section, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
            <SettingRow label="Show Translation" value={showTranslation} onChange={v => updateSettings({ showTranslation: v })} theme={theme} />
            <SettingRow label="Show Transliteration" value={showTransliteration} onChange={v => updateSettings({ showTransliteration: v })} theme={theme} />
            <View style={styles.fontSizeRow}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>Font Size</Text>
              <View style={styles.fontOptions}>
                {fontOptions.map(opt => (
                  <TouchableOpacity key={opt.value} onPress={() => updateSettings({ fontSize: opt.value })}
                    style={[styles.fontChip, fontSize === opt.value && styles.fontChipActive]}>
                    <Text style={[{ fontSize: opt.size, color: fontSize === opt.value ? '#C9A227' : theme.textMuted, fontWeight: '700' }]}>A</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ── Voice Commands Reference ─────────────────────────────────────── */}
        <SectionHeader title="🎤 Voice Commands" theme={theme} onPress={() => setActiveSection(s => s === 'cmds' ? null : 'cmds')} isOpen={activeSection === 'cmds'} />
        {activeSection === 'cmds' && (
          <View style={[styles.section, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
            <Text style={[styles.sectionDesc, { color: theme.textMuted }]}>Say these commands while the app is listening:</Text>
            {COMMANDS.map((cmd, i) => (
              <View key={i} style={[styles.cmdRow, { borderColor: theme.border }]}>
                <Ionicons name={cmd.icon} size={16} color="#C9A227" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.cmdText, { color: theme.text }]}>{cmd.cmd}</Text>
                  <Text style={[styles.cmdDesc, { color: theme.textMuted }]}>{cmd.desc}</Text>
                </View>
              </View>
            ))}
            <View style={[styles.navCmds, { backgroundColor: theme.bgMuted }]}>
              <Text style={[styles.navCmdsTitle, { color: theme.text }]}>Navigation</Text>
              {[
                '"Read Surah Al-Fatiha"',
                '"Start Surah Al-Baqarah verse 10"',
                '"Continue from where I stopped"',
                '"Repeat last ayah"',
              ].map((c, i) => (
                <Text key={i} style={[styles.navCmd, { color: '#C9A227' }]}>{c}</Text>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

function SectionHeader({ title, onPress, isOpen, theme }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.sectionHeader, { borderColor: theme.border, backgroundColor: theme.bgCard }]}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color={theme.textMuted} />
    </TouchableOpacity>
  );
}

function SettingRow({ label, value, onChange, theme }) {
  return (
    <View style={[styles.settingRow, { borderColor: theme.border }]}>
      <Text style={[styles.settingLabel, { color: theme.text }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: '#2A4034', true: '#0E7C5A88' }}
        thumbColor={value ? '#C9A227' : '#888'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  headerTitle: { fontSize: 22, fontWeight: '700' },
  content: { padding: 16 },
  profileCard: { borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1 },
  profileTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: '700' },
  profileMeta: { fontSize: 12, marginTop: 2 },
  profileBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  profileBadgeText: { fontSize: 12, fontWeight: '600' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 4, borderWidth: 1, marginTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  section: { borderRadius: 12, padding: 16, borderWidth: 1, marginBottom: 4 },
  sectionDesc: { fontSize: 13, marginBottom: 14, lineHeight: 20 },

  // Sample recording cards
  sampleCard: { borderRadius: 12, borderWidth: 1.5, padding: 14, marginBottom: 12 },
  sampleText: { fontSize: 14, lineHeight: 22, marginBottom: 10, fontStyle: 'italic' },
  recordingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  timerText: { fontSize: 15, fontWeight: '700', color: '#EF4444', minWidth: 32 },
  sampleActions: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  sampleBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  sampleBtnText: { fontSize: 13, fontWeight: '600' },
  noSamplesHint: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, padding: 12, borderRadius: 8, backgroundColor: '#F0EAD8' },
  noSamplesText: { flex: 1, fontSize: 13, lineHeight: 18 },

  // Reciter (qari) picker rows
  reciterCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, borderWidth: 1.5, padding: 14, marginBottom: 10 },
  reciterStar: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  reciterName: { fontSize: 15, fontWeight: '700' },
  reciterNameAr: { fontSize: 16, fontWeight: '600', marginTop: 1, fontFamily: ARABIC_FONT },
  reciterStyle: { fontSize: 11, marginTop: 3 },

  // Voice cards (Ahmed / Fatimah)
  voiceCardsRow: { flexDirection: 'row', gap: 12 },
  voiceCard: { flex: 1, borderRadius: 14, borderWidth: 1.5, padding: 16, alignItems: 'center' },
  voiceName: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  voiceNameAr: { fontSize: 18, fontWeight: '700', marginBottom: 4, fontFamily: ARABIC_FONT },
  voiceDesc: { fontSize: 11, textAlign: 'center', marginBottom: 10 },
  selectedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  selectedBadgeText: { color: '#C9A227', fontSize: 11, fontWeight: '700' },
  previewBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: '#C9A227', backgroundColor: 'transparent' },
  previewBtnActive: { backgroundColor: '#C9A227' },
  previewBtnText: { color: '#C9A227', fontSize: 12, fontWeight: '600' },
  previewPhrase: { marginTop: 16, borderRadius: 12, padding: 14, alignItems: 'center' },
  previewPhraseAr: { fontSize: 19, marginBottom: 6, textAlign: 'center', fontFamily: ARABIC_FONT },
  previewPhraseEn: { fontSize: 11, textAlign: 'center' },

  speedRow: { flexDirection: 'row', gap: 12 },
  speedChip: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#14241D', alignItems: 'center', borderWidth: 1, borderColor: '#2A4034' },
  speedChipActive: { borderColor: '#C9A227', backgroundColor: '#0E7C5A22' },
  speedChipText: { color: '#888', fontWeight: '600' },
  speedChipTextActive: { color: '#C9A227' },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  settingLabel: { fontSize: 15 },
  fontSizeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  fontOptions: { flexDirection: 'row', gap: 12 },
  fontChip: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#14241D', borderWidth: 1, borderColor: '#2A4034' },
  fontChipActive: { borderColor: '#C9A227' },
  cmdRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10, borderBottomWidth: 1 },
  cmdText: { fontSize: 14, fontWeight: '600' },
  cmdDesc: { fontSize: 12, marginTop: 2 },
  navCmds: { marginTop: 12, borderRadius: 10, padding: 14 },
  navCmdsTitle: { fontSize: 13, fontWeight: '700', marginBottom: 8 },
  navCmd: { fontSize: 13, marginBottom: 6 },
});
