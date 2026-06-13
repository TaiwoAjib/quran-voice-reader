import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useApp } from '../context/AppContext';
import SurahSelectionScreen from './SurahSelectionScreen';
import BookmarksScreen from './BookmarksScreen';
import VoiceSettingsScreen from './VoiceSettingsScreen';
import ProfilesScreen from './ProfilesScreen';
import SubscriptionScreen from './SubscriptionScreen';

const Tab = createBottomTabNavigator();

const TabIcon = ({ name, focused, color, label }) => (
  <View style={styles.tabIconWrap}>
    <Ionicons name={name} size={22} color={color} />
    <Text style={[styles.tabLabel, { color }]}>{label}</Text>
    {focused && <View style={[styles.tabDot, { backgroundColor: color }]} />}
  </View>
);

export default function MainTabNavigator() {
  const { theme } = useApp();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.bgCard,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Quran"
        component={SurahSelectionScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'book' : 'book-outline'} focused={focused} color={focused ? '#C9A227' : theme.textMuted} label="Qur'an" />
          ),
        }}
      />
      <Tab.Screen
        name="Bookmarks"
        component={BookmarksScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'bookmark' : 'bookmark-outline'} focused={focused} color={focused ? '#C9A227' : theme.textMuted} label="Saved" />
          ),
        }}
      />
      <Tab.Screen
        name="VoiceSettings"
        component={VoiceSettingsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'mic' : 'mic-outline'} focused={focused} color={focused ? '#C9A227' : theme.textMuted} label="Voice" />
          ),
        }}
      />
      <Tab.Screen
        name="Donate"
        component={SubscriptionScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={focused ? 'heart' : 'heart-outline'}
              focused={focused}
              color={focused ? '#C9A227' : theme.textMuted}
              label="Donate"
            />
          ),
        }}
      />
      <Tab.Screen
        name="Profiles"
        component={ProfilesScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'person' : 'person-outline'} focused={focused} color={focused ? '#C9A227' : theme.textMuted} label="Profile" />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabIconWrap: { alignItems: 'center', justifyContent: 'center', gap: 3, paddingTop: 8 },
  tabLabel: { fontSize: 10, fontWeight: '600' },
  tabDot: { width: 4, height: 4, borderRadius: 2, marginTop: 2 },
});
