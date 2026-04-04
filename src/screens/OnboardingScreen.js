import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  Dimensions, TextInput, Platform, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { TRAINING_SENTENCES } from '../data/quranData';

const { width } = Dimensions.get('window');

const STEPS = [
  { id: 'welcome' },
  { id: 'profile' },
  { id: 'training' },
];

export default function OnboardingScreen({ navigation }) {
  const { saveProfile, completeOnboarding } = useApp();

  const [step, setStep] = useState(0);
  const [profileName, setProfileName] = useState('');

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const animateTo = (nextStep) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setStep(nextStep);
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    });
  };

  const handleFinish = async (name) => {
    const profile = {
      id: `profile_${Date.now()}`,
      name: name || 'Guest',
      recordings: [],
      createdAt: Date.now(),
      avatar: '🕌',
    };
    await saveProfile(profile);
    await completeOnboarding();
    navigation.replace('Main');
  };

  return (
    <LinearGradient colors={['#030712', '#060D1A', '#0A1628']} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        {/* Step indicator */}
        <View style={styles.header}>
          <View style={styles.stepDots}>
            {STEPS.map((_, i) => (
              <View key={i} style={[styles.dot, i === step && styles.dotActive, i < step && styles.dotDone]} />
            ))}
          </View>
        </View>

        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {step === 0 && <WelcomeStep onNext={() => animateTo(1)} />}
          {step === 1 && (
            <ProfileStep
              profileName={profileName}
              setProfileName={setProfileName}
              onNext={() => animateTo(2)}
            />
          )}
          {step === 2 && (
            <TrainingStep
              onFinish={handleFinish}
              profileName={profileName}
            />
          )}
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}

function WelcomeStep({ onNext }) {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -12, duration: 2200, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2200, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.5, duration: 1800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.stepContainer}>
      <Animated.View style={[styles.logoWrap, { transform: [{ translateY: floatAnim }] }]}>
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </Animated.View>

      <View style={styles.featureList}>
        {[
          { icon: 'mic-outline', text: 'Record your voice once' },
          { icon: 'book-outline', text: 'Quran read aloud in your voice' },
          { icon: 'language-outline', text: 'Arabic & English recitation' },
          { icon: 'bookmark-outline', text: 'Bookmark your favourite verses' },
        ].map((f, i) => (
          <View key={i} style={styles.featureRow}>
            <View style={styles.featureIconWrap}>
              <Ionicons name={f.icon} size={18} color="#3B82F6" />
            </View>
            <Text style={styles.featureText}>{f.text}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={onNext}>
        <LinearGradient colors={['#2563EB', '#1D4ED8']} style={styles.primaryBtnGrad}>
          <Text style={styles.primaryBtnText}>Begin Your Journey</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFF" style={{ marginLeft: 8 }} />
        </LinearGradient>
      </TouchableOpacity>

      <Text style={styles.footerNote}>Free forever. No subscription required.</Text>
    </View>
  );
}

function ProfileStep({ profileName, setProfileName, onNext }) {
  const [inputVal, setInputVal] = React.useState(profileName);
  const presets = ['Ahmad', 'Fatima', 'Omar', 'Aisha', 'Ibrahim', 'Maryam'];

  return (
    <View style={styles.stepContainer}>
      <View style={styles.iconCircle}>
        <Text style={{ fontSize: 42 }}>👤</Text>
      </View>
      <Text style={styles.stepTitle}>Who's Reading?</Text>
      <Text style={styles.stepSubtitle}>Enter your name to personalise your experience</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Your Name</Text>
        <TextInput
          value={inputVal}
          onChangeText={v => { setInputVal(v); setProfileName(v); }}
          placeholder="Type your name..."
          placeholderTextColor="#555"
          style={styles.nativeInput}
          autoCorrect={false}
          maxLength={30}
          autoFocus
        />
      </View>

      <Text style={styles.orText}>— or choose —</Text>
      <View style={styles.presetsRow}>
        {presets.map(name => (
          <TouchableOpacity key={name} onPress={() => { setInputVal(name); setProfileName(name); }}
            style={[styles.presetChip, inputVal === name && styles.presetChipActive]}>
            <Text style={[styles.presetText, inputVal === name && styles.presetTextActive]}>{name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={() => onNext()}>
        <LinearGradient colors={['#2563EB', '#1D4ED8']} style={styles.primaryBtnGrad}>
          <Text style={styles.primaryBtnText}>Continue to Voice Training</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFF" style={{ marginLeft: 8 }} />
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity style={styles.guestBtn} onPress={() => onNext()}>
        <Text style={styles.guestBtnText}>Continue as Guest</Text>
      </TouchableOpacity>
    </View>
  );
}

function TrainingStep({ onFinish, profileName }) {
  const { isRecording, startRecording, stopRecording, recordings, clearRecordings } = useVoiceRecorder();
  const [currentSentenceIdx, setCurrentSentenceIdx] = useState(0);
  const sentence = TRAINING_SENTENCES[currentSentenceIdx];

  const handleComplete = () => {
    if (recordings.length > 0) {
      onFinish(profileName || 'Guest');
    }
  };

  return (
    <View style={styles.stepContainer}>
      <View style={styles.iconCircle}>
        <Ionicons name="mic" size={42} color="#3B82F6" />
      </View>
      <Text style={styles.stepTitle}>Voice Training</Text>
      <Text style={styles.stepSubtitle}>Record this verse to initialize your voice simulation</Text>

      <View style={[styles.trainingCard, { backgroundColor: '#0D1829' }]}>
        <Text style={styles.trainingText}>"{sentence.text}"</Text>
      </View>

      <View style={styles.recordControls}>
        <TouchableOpacity
          style={[styles.recordBtn, isRecording && styles.recordBtnActive]}
          onPressIn={startRecording}
          onPressOut={stopRecording}
        >
          <Ionicons name={isRecording ? 'stop' : 'mic'} size={32} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.recordHint}>
          {isRecording ? 'Release to stop' : 'Hold to record'}
        </Text>
      </View>

      <View style={styles.progressRow}>
        <Text style={styles.progressText}>
          {recordings.length > 0 ? '✓ Ready to proceed' : 'Please record at least one sample'}
        </Text>
        {recordings.length > 0 && (
          <TouchableOpacity onPress={clearRecordings}>
            <Text style={{ color: '#EF4444', fontSize: 12 }}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={[styles.primaryBtn, recordings.length === 0 && { opacity: 0.5 }]}
        onPress={handleComplete}
        disabled={recordings.length === 0}
      >
        <LinearGradient colors={['#2563EB', '#1D4ED8']} style={styles.primaryBtnGrad}>
          <Text style={styles.primaryBtnText}>Finish Setup</Text>
          <Ionicons name="checkmark" size={18} color="#FFF" style={{ marginLeft: 8 }} />
        </LinearGradient>
      </TouchableOpacity>

      <Text style={styles.footerNote}>This step is required to enable voice features.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 24, paddingTop: 8, paddingBottom: 4,
  },
  stepDots: { flexDirection: 'row', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#1A2E4A' },
  dotActive: { backgroundColor: '#3B82F6', width: 24 },
  dotDone: { backgroundColor: '#0EA5E9' },
  content: { flex: 1 },
  stepContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 28, paddingBottom: 40,
  },
  welcomeIcon: { fontSize: 72, marginBottom: 14 },
  logoWrap: { width: 280, height: 280, marginBottom: 4 },
  logoImage: { width: '100%', height: '100%', borderRadius: 24 },
  arabicBismillah: {
    fontFamily: Platform.OS === 'ios' ? 'Arial' : 'sans-serif',
    fontSize: 22, color: '#3B82F6', marginBottom: 8, textAlign: 'center',
  },
  welcomeTitle: { fontSize: 28, color: '#DBEAFE', fontWeight: '700', marginBottom: 4, textAlign: 'center' },
  welcomeSubtitle: { fontSize: 14, color: '#6B8FB5', marginBottom: 32, textAlign: 'center', letterSpacing: 1 },
  featureList: { width: '100%', marginBottom: 36, gap: 14 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  featureIconWrap: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: '#2563EB22',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#3B82F633',
  },
  featureText: { color: '#93BFEF', fontSize: 15 },
  primaryBtn: { width: '100%', borderRadius: 16, overflow: 'hidden', marginTop: 8 },
  primaryBtnGrad: {
    paddingVertical: 16, alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row',
  },
  primaryBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  footerNote: { color: '#2E4A72', fontSize: 12, marginTop: 18, textAlign: 'center' },
  iconCircle: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: '#060D1A',
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
    borderWidth: 1.5, borderColor: '#2563EB44',
  },
  stepTitle: { fontSize: 26, color: '#DBEAFE', fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  stepSubtitle: { fontSize: 14, color: '#6B8FB5', marginBottom: 28, textAlign: 'center' },
  inputContainer: { width: '100%', marginBottom: 16 },
  inputLabel: { color: '#6B8FB5', fontSize: 12, marginBottom: 8, letterSpacing: 1, textTransform: 'uppercase' },
  nativeInput: {
    backgroundColor: '#0D1829', borderWidth: 1.5, borderColor: '#1A2E4A',
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    color: '#DBEAFE', fontSize: 16, width: '100%',
  },
  orText: { color: '#2E4A72', marginVertical: 14, fontSize: 12, letterSpacing: 2 },
  presetsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 24 },
  presetChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#0D1829', borderWidth: 1, borderColor: '#1A2E4A',
  },
  presetChipActive: { borderColor: '#3B82F6', backgroundColor: '#2563EB22' },
  presetText: { color: '#6B8FB5', fontSize: 14 },
  presetTextActive: { color: '#3B82F6' },
  guestBtn: { marginTop: 14, padding: 10 },
  guestBtnText: { color: '#2E4A72', fontSize: 14 },
  trainingCard: {
    width: '100%', padding: 24, borderRadius: 20, marginBottom: 32,
    borderWidth: 1, borderColor: '#3B82F633', alignItems: 'center',
  },
  trainingText: { color: '#DBEAFE', fontSize: 18, textAlign: 'center', fontStyle: 'italic', lineHeight: 28 },
  recordControls: { alignItems: 'center', marginBottom: 24 },
  recordBtn: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#2563EB',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    shadowColor: '#3B82F6', shadowOpacity: 0.4, shadowRadius: 10, elevation: 8,
  },
  recordBtnActive: { backgroundColor: '#EF4444', transform: [{ scale: 1.1 }] },
  recordHint: { color: '#6B8FB5', fontSize: 12, letterSpacing: 1 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
});
