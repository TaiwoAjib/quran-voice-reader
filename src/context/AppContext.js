import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_RECITER_ID } from '../data/reciters';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [currentProfile, setCurrentProfile] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [lastRead, setLastRead] = useState(null);
  const [isNightMode, setIsNightMode] = useState(false);
  const [showTranslation, setShowTranslation] = useState(true);
  const [showTransliteration, setShowTransliteration] = useState(false);
  const [readingSpeed, setReadingSpeed] = useState(0.9);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [fontSize, setFontSize] = useState('medium'); // small | medium | large
  const [subscription, setSubscriptionState] = useState({ plan: 'basic', activatedAt: null });
  const [recitationLanguage, setRecitationLanguageState] = useState('arabic'); // 'arabic' | 'english' | 'both'
  const [voiceMode, setVoiceModeState] = useState('authentic'); // 'authentic' | 'personalized'
  const [ttsGender, setTtsGender] = useState('male'); // 'male' | 'female'
  const [reciter, setReciterState] = useState(DEFAULT_RECITER_ID); // selected qari
  const [hydrated, setHydrated] = useState(false); // true once AsyncStorage has been read

  useEffect(() => {
    loadStoredData();
  }, []);

  const loadStoredData = async () => {
    try {
      const stored = await AsyncStorage.multiGet([
        'profiles', 'currentProfileId', 'bookmarks',
        'lastRead', 'isNightMode', 'showTranslation',
        'readingSpeed', 'isOnboarded', 'fontSize', 'showTransliteration',
        'subscription', 'recitationLanguage', 'voiceMode', 'ttsGender', 'reciter'
      ]);
      const data = Object.fromEntries(stored.map(([k, v]) => [k, v ? JSON.parse(v) : null]));

      if (data.profiles) setProfiles(data.profiles);
      if (data.bookmarks) setBookmarks(data.bookmarks);
      if (data.lastRead) setLastRead(data.lastRead);
      if (data.isNightMode !== null) setIsNightMode(data.isNightMode);
      if (data.showTranslation !== null) setShowTranslation(data.showTranslation);
      if (data.readingSpeed) setReadingSpeed(data.readingSpeed);
      if (data.isOnboarded) setIsOnboarded(data.isOnboarded);
      if (data.fontSize) setFontSize(data.fontSize);
      if (data.showTransliteration !== null) setShowTransliteration(data.showTransliteration);
      if (data.subscription) setSubscriptionState(data.subscription);
      if (data.recitationLanguage) setRecitationLanguageState(data.recitationLanguage);
      if (data.voiceMode) setVoiceModeState(data.voiceMode);
      if (data.ttsGender) setTtsGender(data.ttsGender);
      if (data.reciter) setReciterState(data.reciter);

      if (data.profiles && data.currentProfileId) {
        const profile = data.profiles.find(p => p.id === data.currentProfileId);
        if (profile) setCurrentProfile(profile);
      }
    } catch (e) {
      console.error('Error loading stored data:', e);
    } finally {
      setHydrated(true);
    }
  };

  const saveProfile = useCallback(async (profile) => {
    try {
      const updated = [...profiles.filter(p => p.id !== profile.id), profile];
      setProfiles(updated);
      setCurrentProfile(profile);
      await AsyncStorage.multiSet([
        ['profiles', JSON.stringify(updated)],
        ['currentProfileId', JSON.stringify(profile.id)],
      ]);
    } catch (e) {
      console.error('Error saving profile:', e);
    }
  }, [profiles]);

  // Bug Fix #3 & #5: Persist recordings array back into the profile object in AsyncStorage
  const updateProfileRecordings = useCallback(async (profileId, recordings) => {
    try {
      const updatedProfiles = profiles.map(p =>
        p.id === profileId ? { ...p, recordings } : p
      );
      setProfiles(updatedProfiles);
      const updatedProfile = updatedProfiles.find(p => p.id === profileId);
      if (updatedProfile && currentProfile?.id === profileId) {
        setCurrentProfile(updatedProfile);
      }
      await AsyncStorage.setItem('profiles', JSON.stringify(updatedProfiles));
    } catch (e) {
      console.error('Error updating profile recordings:', e);
    }
  }, [profiles, currentProfile]);

  const deleteProfile = useCallback(async (profileId) => {
    try {
      const updated = profiles.filter(p => p.id !== profileId);
      setProfiles(updated);
      if (currentProfile?.id === profileId) {
        setCurrentProfile(updated[0] || null);
        await AsyncStorage.setItem('currentProfileId', JSON.stringify(updated[0]?.id || null));
      }
      await AsyncStorage.setItem('profiles', JSON.stringify(updated));
    } catch (e) {
      console.error('Error deleting profile:', e);
    }
  }, [profiles, currentProfile]);

  const switchProfile = useCallback(async (profileId) => {
    const profile = profiles.find(p => p.id === profileId);
    if (profile) {
      setCurrentProfile(profile);
      await AsyncStorage.setItem('currentProfileId', JSON.stringify(profileId));
    }
  }, [profiles]);

  const addBookmark = useCallback(async (surahId, ayahId, surahName) => {
    const bookmark = { surahId, ayahId, surahName, timestamp: Date.now() };
    const key = `${surahId}-${ayahId}`;
    const updated = { ...bookmarks, [key]: bookmark };
    setBookmarks(updated);
    await AsyncStorage.setItem('bookmarks', JSON.stringify(updated));
  }, [bookmarks]);

  const removeBookmark = useCallback(async (surahId, ayahId) => {
    const key = `${surahId}-${ayahId}`;
    const updated = { ...bookmarks };
    delete updated[key];
    setBookmarks(updated);
    await AsyncStorage.setItem('bookmarks', JSON.stringify(updated));
  }, [bookmarks]);

  const isBookmarked = useCallback((surahId, ayahId) => {
    return !!bookmarks[`${surahId}-${ayahId}`];
  }, [bookmarks]);

  const updateLastRead = useCallback(async (surahId, ayahId) => {
    const data = { surahId, ayahId, timestamp: Date.now() };
    setLastRead(data);
    await AsyncStorage.setItem('lastRead', JSON.stringify(data));
  }, []);

  const completeOnboarding = useCallback(async () => {
    setIsOnboarded(true);
    await AsyncStorage.setItem('isOnboarded', JSON.stringify(true));
  }, []);

  const setRecitationLanguage = useCallback(async (lang) => {
    setRecitationLanguageState(lang);
    await AsyncStorage.setItem('recitationLanguage', JSON.stringify(lang));
  }, []);

  const setVoiceMode = useCallback(async (mode) => {
    setVoiceModeState(mode);
    await AsyncStorage.setItem('voiceMode', JSON.stringify(mode));
  }, []);

  const updateTtsGender = useCallback(async (gender) => {
    setTtsGender(gender);
    await AsyncStorage.setItem('ttsGender', JSON.stringify(gender));
  }, []);

  const setReciter = useCallback(async (reciterId) => {
    setReciterState(reciterId);
    await AsyncStorage.setItem('reciter', JSON.stringify(reciterId));
  }, []);

  const setSubscription = useCallback(async (plan) => {
    const sub = { plan, activatedAt: Date.now() };
    setSubscriptionState(sub);
    await AsyncStorage.setItem('subscription', JSON.stringify(sub));
  }, []);

  const toggleNightMode = useCallback(async () => {
    const next = !isNightMode;
    setIsNightMode(next);
    await AsyncStorage.setItem('isNightMode', JSON.stringify(next));
  }, [isNightMode]);

  const updateSettings = useCallback(async (settings) => {
    if (settings.showTranslation !== undefined) {
      setShowTranslation(settings.showTranslation);
      await AsyncStorage.setItem('showTranslation', JSON.stringify(settings.showTranslation));
    }
    if (settings.showTransliteration !== undefined) {
      setShowTransliteration(settings.showTransliteration);
      await AsyncStorage.setItem('showTransliteration', JSON.stringify(settings.showTransliteration));
    }
    if (settings.readingSpeed !== undefined) {
      setReadingSpeed(settings.readingSpeed);
      await AsyncStorage.setItem('readingSpeed', JSON.stringify(settings.readingSpeed));
    }
    if (settings.fontSize !== undefined) {
      setFontSize(settings.fontSize);
      await AsyncStorage.setItem('fontSize', JSON.stringify(settings.fontSize));
    }
  }, []);

  // Arabian palette — emerald green, gold, and warm sand (classic Islamic art colours)
  const GOLD    = '#C9A227';  // primary accent
  const EMERALD = '#0E7C5A';  // secondary accent
  const EMERALD_DEEP = '#0A5C43';
  const theme = {
    bg:        isNightMode ? '#081711' : '#F7F3E8',
    bgCard:    isNightMode ? '#10241C' : '#FFFFFF',
    bgMuted:   isNightMode ? '#142B21' : '#F0EAD6',
    text:      isNightMode ? '#EFF5EC' : '#1F2A1F',
    textMuted: isNightMode ? '#8FAF9D' : '#5C6F5C',
    textLight: isNightMode ? '#4E6B5C' : '#C9BD8F',
    blue:      GOLD,       // keep 'blue' key for compat across all screens
    blueLight: '#E3CE8F',
    gold:      GOLD,
    goldLight: '#E3CE8F',
    green:     EMERALD,
    greenLight:'#4CAF8E',
    border:    isNightMode ? '#1E3A2E' : '#E4D9B8',
    accent:    EMERALD_DEEP,
  };

  return (
    <AppContext.Provider value={{
      currentProfile, profiles, bookmarks, lastRead,
      isNightMode, showTranslation, showTransliteration, readingSpeed, isOnboarded, fontSize, hydrated,
      subscription, recitationLanguage, voiceMode, ttsGender, reciter,
      theme, saveProfile, deleteProfile, switchProfile,
      addBookmark, removeBookmark, isBookmarked, updateLastRead,
      completeOnboarding, toggleNightMode, updateSettings, setSubscription,
      setRecitationLanguage, setVoiceMode, updateTtsGender, setReciter,
      updateProfileRecordings, // Bug fix: now exposed so VoiceSettings can persist recordings
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
