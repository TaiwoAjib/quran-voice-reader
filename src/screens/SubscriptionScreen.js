import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Animated, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ARABIC_FONT } from '../components/Ornaments';
import PayPalCheckout from '../components/PayPalCheckout';

const DONATION_AMOUNTS = [
  {
    id: 'sadaqah',
    label: 'Sadaqah',
    amount: '$1',
    arabicLabel: 'صَدَقَة',
    description: 'Small act of kindness',
    icon: 'leaf-outline',
    gradColors: ['#0D4A0D', '#0A3D0A'],
    borderColor: '#166534',
    accentColor: '#4ADE80',
  },
  {
    id: 'support',
    label: 'Supporter',
    amount: '$5',
    arabicLabel: 'دَعْم',
    description: 'Help keep the app free',
    icon: 'heart-outline',
    gradColors: ['#0F4636', '#0A2E23'],
    borderColor: '#0E7C5A',
    accentColor: '#D9B845',
    badge: 'POPULAR',
  },
  {
    id: 'generous',
    label: 'Generous',
    amount: '$10',
    arabicLabel: 'كَرَم',
    description: 'A generous contribution',
    icon: 'star-outline',
    gradColors: ['#3B2E0A', '#2E2408'],
    borderColor: '#D97706',
    accentColor: '#FBBF24',
  },
  {
    id: 'patron',
    label: 'Patron',
    amount: '$25',
    arabicLabel: 'رَاعٍ',
    description: 'Champion of this mission',
    icon: 'diamond-outline',
    gradColors: ['#3A2E08', '#2A2206'],
    borderColor: '#9A7A1C',
    accentColor: '#D9B845',
    badge: 'MOST IMPACT',
  },
];

export default function SubscriptionScreen({ navigation, route }) {
  const [selectedId, setSelectedId] = useState('support');
  const [donated, setDonated] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const heartAnim = useRef(new Animated.Value(1)).current;

  const fromOnboarding = route?.params?.fromOnboarding;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(heartAnim, { toValue: 1.15, duration: 900, useNativeDriver: true }),
        Animated.timing(heartAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleDonate = () => {
    const selected = DONATION_AMOUNTS.find(d => d.id === selectedId);
    if (!selected) return;

    if (donated) {
      navigation.goBack?.();
      return;
    }

    // Open the secure PayPal checkout for the selected amount.
    setShowCheckout(true);
  };

  const handlePaymentSuccess = (result) => {
    setShowCheckout(false);
    setDonated(true);
    const payer = result?.payer ? `, ${result.payer}` : '';
    Alert.alert(
      'جَزَاكَ اللَّهُ خَيْرًا',
      `Jazakallahu Khayran${payer}! 🤲\n\nYour donation was received. May Allah reward you abundantly.`,
      [{
        text: 'Ameen',
        onPress: () => { if (fromOnboarding) setTimeout(() => navigation.replace('Main'), 800); },
      }]
    );
  };

  const handlePaymentCancel = (reason) => {
    setShowCheckout(false);
    if (reason && reason !== 'cancel') {
      Alert.alert('Payment not completed', 'The donation could not be processed. Please try again.');
    }
  };

  const handleSkip = () => {
    if (fromOnboarding) {
      navigation.replace('Main');
    } else {
      navigation.goBack?.();
    }
  };

  const selected = DONATION_AMOUNTS.find(d => d.id === selectedId);

  return (
    <LinearGradient colors={['#04100B', '#081711', '#0C1F17']} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleSkip} style={styles.closeBtn}>
            {fromOnboarding
              ? <Text style={styles.skipText}>Maybe later</Text>
              : <Ionicons name="close" size={22} color="#8FAF9D" />
            }
          </TouchableOpacity>
        </View>

        <Animated.ScrollView
          style={{ opacity: fadeAnim }}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <Animated.View style={[styles.heroSection, { transform: [{ translateY: slideAnim }] }]}>
            <Animated.Text style={[styles.heroIcon, { transform: [{ scale: heartAnim }] }]}>
              ❤️
            </Animated.Text>
            <Text style={styles.heroTitle}>Support This Project</Text>
            <Text style={styles.heroSubtitle}>
              This app is free and will always remain free.{'\n'}
              Your donation helps keep it alive.
            </Text>
          </Animated.View>

          {/* Hadith Quote */}
          <View style={styles.quoteCard}>
            <Text style={styles.quoteArabic}>«الصَّدَقَةُ تُطْفِئُ الخَطِيئَةَ»</Text>
            <Text style={styles.quoteText}>
              "Charity extinguishes sin as water extinguishes fire."
            </Text>
            <Text style={styles.quoteSource}>— Prophet Muhammad ﷺ (Tirmidhi)</Text>
          </View>

          {/* Donation Cards */}
          <Text style={styles.sectionLabel}>Choose an amount</Text>
          <View style={styles.cardsGrid}>
            {DONATION_AMOUNTS.map((item) => {
              const isSelected = selectedId === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => setSelectedId(item.id)}
                  activeOpacity={0.85}
                  style={[
                    styles.donationCard,
                    { borderColor: isSelected ? item.borderColor : '#1E3A2E' },
                    isSelected && { backgroundColor: '#10241C' },
                  ]}
                >
                  {item.badge && (
                    <LinearGradient colors={item.gradColors} style={styles.badge}>
                      <Text style={styles.badgeText}>{item.badge}</Text>
                    </LinearGradient>
                  )}

                  <LinearGradient
                    colors={isSelected ? item.gradColors : ['#10241C', '#081711']}
                    style={styles.cardIconCircle}
                  >
                    <Ionicons name={item.icon} size={22} color={isSelected ? item.accentColor : '#4E6B5C'} />
                  </LinearGradient>

                  <Text style={[styles.cardAmount, { color: isSelected ? item.accentColor : '#8FAF9D' }]}>
                    {item.amount}
                  </Text>
                  <Text style={[styles.cardArabic, { color: isSelected ? item.accentColor : '#4E6B5C' }]}>
                    {item.arabicLabel}
                  </Text>
                  <Text style={[styles.cardLabel, { color: isSelected ? '#F0EAD6' : '#8FAF9D' }]}>
                    {item.label}
                  </Text>
                  <Text style={[styles.cardDesc, { color: isSelected ? '#C9BD8F' : '#4E6B5C' }]}>
                    {item.description}
                  </Text>

                  {isSelected && (
                    <View style={[styles.selectedBar, { backgroundColor: item.accentColor }]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* CTA */}
          <TouchableOpacity
            onPress={handleDonate}
            style={styles.ctaBtn}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={donated ? ['#14532D', '#166534'] : (selected?.gradColors || ['#0E7C5A', '#0A5C43'])}
              style={styles.ctaBtnGrad}
            >
              {donated ? (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#4ADE80" />
                  <Text style={styles.ctaBtnText}>JazakAllahu Khayran! 🤲</Text>
                </>
              ) : (
                <>
                  <Ionicons name="heart" size={18} color="#FFF" />
                  <Text style={styles.ctaBtnText}>
                    Donate {selected?.amount} — {selected?.label}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Trust row */}
          <View style={styles.trustRow}>
            {[
              { icon: 'lock-closed-outline', text: 'Private & Secure' },
              { icon: 'gift-outline', text: 'Always Free' },
              { icon: 'heart-outline', text: 'For the Ummah' },
            ].map((item, i) => (
              <View key={i} style={styles.trustItem}>
                <Ionicons name={item.icon} size={13} color="#4E6B5C" />
                <Text style={styles.trustText}>{item.text}</Text>
              </View>
            ))}
          </View>

          {/* About the Developer */}
          <View style={styles.aboutSection}>
            <Text style={styles.aboutTitle}>About the Developer</Text>
            <Text style={styles.aboutText}>
              Qur'an Voice Reader is built with ❤️ by
            </Text>
            <Text style={styles.developerName}>Ajibode Taiwo Sulaimon</Text>
            <Text style={styles.aboutEmail}>realitytaiwo2@gmail.com</Text>
            <Text style={styles.aboutFooter}>
              This app is free and open-source, dedicated to helping Muslims{'\n'}
              engage with the Qur'an in a meaningful, accessible way.
            </Text>
          </View>

          <View style={{ height: 40 }} />
        </Animated.ScrollView>
      </SafeAreaView>

      <PayPalCheckout
        visible={showCheckout}
        amount={selected?.amount}
        label={selected?.label}
        onSuccess={handlePaymentSuccess}
        onCancel={handlePaymentCancel}
        onClose={() => setShowCheckout(false)}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  closeBtn: { padding: 8 },
  skipText: { color: '#4E6B5C', fontSize: 14 },
  scroll: { paddingHorizontal: 16, paddingBottom: 20 },

  heroSection: { alignItems: 'center', paddingVertical: 28 },
  heroIcon: { fontSize: 52, marginBottom: 14 },
  heroTitle: {
    fontSize: 26, fontWeight: '800', color: '#F0EAD6',
    marginBottom: 10, textAlign: 'center', letterSpacing: 0.3,
  },
  heroSubtitle: { fontSize: 14, color: '#8FAF9D', textAlign: 'center', lineHeight: 22 },

  quoteCard: {
    backgroundColor: '#081711', borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: '#1E3A2E', marginBottom: 28, alignItems: 'center',
  },
  quoteArabic: { fontSize: 20, color: '#C9A227', marginBottom: 10, textAlign: 'center', lineHeight: 34, fontFamily: ARABIC_FONT },
  quoteText: { fontSize: 14, color: '#C9BD8F', textAlign: 'center', fontStyle: 'italic', lineHeight: 22, marginBottom: 6 },
  quoteSource: { fontSize: 11, color: '#4E6B5C', textAlign: 'center' },

  sectionLabel: { fontSize: 13, color: '#8FAF9D', fontWeight: '700', letterSpacing: 1, marginBottom: 12, textTransform: 'uppercase' },

  cardsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  donationCard: {
    width: '47%', backgroundColor: '#081711', borderRadius: 16,
    borderWidth: 1.5, padding: 16, alignItems: 'center',
    position: 'relative', overflow: 'hidden',
  },
  badge: {
    position: 'absolute', top: 10, right: 10,
    borderRadius: 8, paddingHorizontal: 6, paddingVertical: 3,
  },
  badgeText: { color: '#FFF', fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },
  cardIconCircle: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10, marginTop: 4,
  },
  cardAmount: { fontSize: 26, fontWeight: '800', marginBottom: 2 },
  cardArabic: { fontSize: 16, marginBottom: 4, fontFamily: ARABIC_FONT },
  cardLabel: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  cardDesc: { fontSize: 11, textAlign: 'center', lineHeight: 16 },
  selectedBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, borderRadius: 16, opacity: 0.8 },

  ctaBtn: {
    borderRadius: 16, overflow: 'hidden', marginBottom: 16,
    shadowColor: '#C9A227', shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  ctaBtnGrad: {
    paddingVertical: 17, alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 10,
  },
  ctaBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },

  trustRow: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 8 },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  trustText: { fontSize: 11, color: '#4E6B5C' },

  aboutSection: {
    marginTop: 20, paddingHorizontal: 20, paddingVertical: 16,
    borderTopWidth: 1, borderTopColor: '#1E3A2E', alignItems: 'center',
  },
  aboutTitle: { fontSize: 14, fontWeight: '700', color: '#C9A227', marginBottom: 8 },
  aboutText: { fontSize: 13, color: '#8FAF9D', marginBottom: 6, textAlign: 'center' },
  developerName: { fontSize: 15, fontWeight: '800', color: '#EFF5EC', marginBottom: 2 },
  aboutEmail: { fontSize: 12, color: '#6B9B8A', marginBottom: 12 },
  aboutFooter: { fontSize: 12, color: '#4E6B5C', textAlign: 'center', lineHeight: 18 },
});
