import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, TextInput, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';

const AVATARS = ['🕌', '📖', '☪️', '🌙', '⭐', '🌿', '🤲', '🕋', '🌺', '🦅'];

export default function ProfilesScreen({ navigation }) {
  const { theme, profiles, currentProfile, saveProfile, deleteProfile, switchProfile } = useApp();
  const [showNewModal, setShowNewModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAvatar, setNewAvatar] = useState('📖');

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const profile = {
      id: `profile_${Date.now()}`,
      name: newName.trim(),
      avatar: newAvatar,
      recordings: [],
      createdAt: Date.now(),
    };
    await saveProfile(profile);
    setShowNewModal(false);
    setNewName('');
    setNewAvatar('📖');
  };

  const handleDelete = (profile) => {
    if (profiles.length <= 1) {
      Alert.alert('Cannot Delete', 'You must have at least one profile.');
      return;
    }
    Alert.alert('Delete Profile', `Delete "${profile.name}"? This will also remove their voice recordings.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteProfile(profile.id) },
    ]);
  };

  const handleSwitch = async (profile) => {
    await switchProfile(profile.id);
    Alert.alert('Profile Switched', `Now reading as ${profile.name}`);
  };

  const renderProfile = ({ item }) => {
    const isActive = item.id === currentProfile?.id;
    return (
      <View style={[styles.profileCard, { backgroundColor: theme.bgCard, borderColor: isActive ? '#C9A227' : theme.border },
        isActive && { borderWidth: 1.5 }]}>
        <View style={styles.profileLeft}>
          <Text style={styles.profileAvatar}>{item.avatar || '👤'}</Text>
          {isActive && (
            <View style={styles.activeDot} />
          )}
        </View>
        <View style={styles.profileInfo}>
          <View style={styles.profileNameRow}>
            <Text style={[styles.profileName, { color: theme.text }]}>{item.name}</Text>
            {isActive && (
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>Active</Text>
              </View>
            )}
          </View>
          <Text style={[styles.profileMeta, { color: theme.textMuted }]}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
          {item.recordings?.length > 0 && (
            <View style={styles.profileStatus}>
              <Ionicons name="mic" size={13} color="#C9A227" />
              <Text style={[styles.profileStatusText, { color: '#C9A227' }]}>
                {item.recordings.length} voice sample{item.recordings.length > 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.profileActions}>
          {!isActive && (
            <TouchableOpacity onPress={() => handleSwitch(item)} style={styles.switchBtn}>
              <Text style={styles.switchBtnText}>Switch</Text>
            </TouchableOpacity>
          )}
          {isActive && (
            <TouchableOpacity onPress={() => navigation.navigate('VoiceSettings')} style={styles.editBtn}>
              <Ionicons name="pencil-outline" size={16} color="#C9A227" />
            </TouchableOpacity>
          )}
          {!isActive && (
            <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={16} color={theme.textLight} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <SafeAreaView edges={['top']}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Profiles</Text>
          <TouchableOpacity
            onPress={() => setShowNewModal(true)}
            style={[styles.addBtn, { backgroundColor: '#0E7C5A22' }]}
          >
            <Ionicons name="add" size={18} color="#C9A227" />
            <Text style={styles.addBtnText}>New</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <FlatList
        data={profiles}
        keyExtractor={item => item.id}
        renderItem={renderProfile}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={(
          <View style={[styles.infoCard, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
            <Ionicons name="people-outline" size={20} color="#C9A227" />
            <Text style={[styles.infoText, { color: theme.textMuted }]}>
              Multiple profiles allow different family members to have their own voice and reading history on this device.
            </Text>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListFooterComponent={<View style={{ height: 80 }} />}
      />

      {/* Create Profile Modal */}
      <Modal visible={showNewModal} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowNewModal(false)}>
          <View style={[styles.modalCard, { backgroundColor: theme.bgCard }]} onStartShouldSetResponder={() => true}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>New Profile</Text>

            <View style={styles.avatarPicker}>
              {AVATARS.map(a => (
                <TouchableOpacity key={a} onPress={() => setNewAvatar(a)}
                  style={[styles.avatarOption, newAvatar === a && styles.avatarOptionActive]}>
                  <Text style={{ fontSize: 24 }}>{a}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="Profile name..."
              placeholderTextColor={theme.textMuted}
              style={[styles.nameInput, { backgroundColor: theme.bgMuted, color: theme.text, borderColor: theme.border }]}
              autoFocus
              maxLength={30}
            />

            <TouchableOpacity onPress={handleCreate} disabled={!newName.trim()}>
              <LinearGradient
                colors={newName.trim() ? ['#0E7C5A', '#0A5C43'] : ['#2A4034', '#222']}
                style={styles.createBtn}
              >
                <Text style={styles.createBtnText}>Create Profile</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  headerTitle: { fontSize: 22, fontWeight: '700' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  addBtnText: { color: '#C9A227', fontWeight: '600', fontSize: 14 },
  list: { padding: 16 },
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderRadius: 12, padding: 14, borderWidth: 1, marginBottom: 16 },
  infoText: { flex: 1, fontSize: 13, lineHeight: 20 },
  profileCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 14, borderWidth: 1, gap: 12 },
  profileLeft: { position: 'relative' },
  profileAvatar: { fontSize: 36 },
  activeDot: { position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: '#4CAF8E', borderWidth: 2, borderColor: '#0D0D0D' },
  profileInfo: { flex: 1 },
  profileNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  profileName: { fontSize: 17, fontWeight: '700' },
  activeBadge: { backgroundColor: '#0E7C5A22', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  activeBadgeText: { color: '#C9A227', fontSize: 10, fontWeight: '700' },
  profileMeta: { fontSize: 12, marginBottom: 4 },
  profileStatus: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  profileStatusText: { fontSize: 12 },
  profileActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  switchBtn: { backgroundColor: '#0E7C5A22', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  switchBtnText: { color: '#C9A227', fontSize: 12, fontWeight: '600' },
  editBtn: { padding: 6 },
  deleteBtn: { padding: 6 },
  modalOverlay: { flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' },
  modalCard: { margin: 16, borderRadius: 24, padding: 24, marginBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 20 },
  avatarPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  avatarOption: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 24, backgroundColor: '#14241D', borderWidth: 2, borderColor: '#2A4034' },
  avatarOptionActive: { borderColor: '#C9A227', backgroundColor: '#0E7C5A22' },
  nameInput: { borderRadius: 12, padding: 14, fontSize: 16, borderWidth: 1, marginBottom: 16 },
  createBtn: { borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  createBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
});
