import React from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { getSurahById } from '../data/quranData';

export default function BookmarksScreen({ navigation }) {
  const { theme, bookmarks, removeBookmark, lastRead } = useApp();

  const bookmarkList = Object.values(bookmarks).sort((a, b) => b.timestamp - a.timestamp);

  const handleOpen = (bookmark) => {
    const surah = getSurahById(bookmark.surahId);
    if (!surah) {
      Alert.alert('Not Available', 'This Surah is not loaded in this demo version.');
      return;
    }
    navigation.navigate('Recitation', { surahId: bookmark.surahId, ayahId: bookmark.ayahId });
  };

  const handleDelete = (surahId, ayahId) => {
    Alert.alert('Remove Bookmark', 'Remove this bookmark?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeBookmark(surahId, ayahId) },
    ]);
  };

  const formatDate = (ts) => {
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderBookmark = ({ item }) => {
    const surah = getSurahById(item.surahId);
    const ayah = surah?.ayahs?.find(a => a.id === item.ayahId);

    return (
      <TouchableOpacity onPress={() => handleOpen(item)} activeOpacity={0.8}>
        <View style={[styles.card, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
          <View style={styles.cardLeft}>
            <View style={[styles.iconWrap, { backgroundColor: '#2563EB22' }]}>
              <Ionicons name="bookmark" size={18} color="#3B82F6" />
            </View>
          </View>
          <View style={styles.cardBody}>
            <Text style={[styles.surahName, { color: theme.text }]}>{item.surahName}</Text>
            <Text style={[styles.ayahNum, { color: theme.textMuted }]}>Verse {item.ayahId}</Text>
            {ayah && (
              <Text style={[styles.arabicSnippet, { color: '#3B82F6' }]} numberOfLines={1}>
                {ayah.arabic}
              </Text>
            )}
            {ayah && (
              <Text style={[styles.transSnippet, { color: theme.textMuted }]} numberOfLines={2}>
                {ayah.translation}
              </Text>
            )}
            <Text style={[styles.dateText, { color: theme.textLight }]}>{formatDate(item.timestamp)}</Text>
          </View>
          <View style={styles.cardActions}>
            <TouchableOpacity onPress={() => handleOpen(item)} style={styles.actionBtn}>
              <Ionicons name="play-circle-outline" size={24} color="#3B82F6" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item.surahId, item.ayahId)} style={styles.actionBtn}>
              <Ionicons name="trash-outline" size={20} color={theme.textLight} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <SafeAreaView edges={['top']}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Bookmarks</Text>
          <Text style={[styles.headerCount, { color: theme.textMuted }]}>
            {bookmarkList.length} saved
          </Text>
        </View>
      </SafeAreaView>

      {/* Last read */}
      {lastRead && (
        <TouchableOpacity
          onPress={() => {
            const surah = getSurahById(lastRead.surahId);
            if (surah) navigation.navigate('Recitation', { surahId: lastRead.surahId, ayahId: lastRead.ayahId });
          }}
          style={[styles.lastReadCard, { backgroundColor: theme.bgCard, borderColor: '#2563EB44' }]}
        >
          <View style={[styles.iconWrap, { backgroundColor: '#0EA5E922' }]}>
            <Ionicons name="time" size={18} color="#38BDF8" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.lastReadLabel, { color: theme.textMuted }]}>Last Read</Text>
            <Text style={[styles.lastReadInfo, { color: theme.text }]}>
              {getSurahById(lastRead.surahId)?.name} · Verse {lastRead.ayahId}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#38BDF8" />
        </TouchableOpacity>
      )}

      {bookmarkList.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 52 }}>🔖</Text>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No Bookmarks Yet</Text>
          <Text style={[styles.emptyDesc, { color: theme.textMuted }]}>
            While reading, tap the bookmark icon on any verse to save it here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={bookmarkList}
          keyExtractor={item => `${item.surahId}-${item.ayahId}`}
          renderItem={renderBookmark}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  headerTitle: { fontSize: 22, fontWeight: '700' },
  headerCount: { fontSize: 13 },
  lastReadCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 12, borderRadius: 12, padding: 14, borderWidth: 1 },
  lastReadLabel: { fontSize: 11, marginBottom: 2 },
  lastReadInfo: { fontSize: 15, fontWeight: '600' },
  list: { padding: 16 },
  card: { flexDirection: 'row', borderRadius: 14, padding: 14, borderWidth: 1 },
  cardLeft: { marginRight: 12 },
  iconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1 },
  surahName: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  ayahNum: { fontSize: 12, marginBottom: 6 },
  arabicSnippet: { fontSize: 17, marginBottom: 4 },
  transSnippet: { fontSize: 12, lineHeight: 18, marginBottom: 6 },
  dateText: { fontSize: 11 },
  cardActions: { justifyContent: 'space-between', paddingLeft: 8 },
  actionBtn: { padding: 4 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '700' },
  emptyDesc: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
});
