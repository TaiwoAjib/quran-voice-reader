import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AppProvider } from './src/context/AppContext';
import OnboardingScreen from './src/screens/OnboardingScreen';
import SurahSelectionScreen from './src/screens/SurahSelectionScreen';
import RecitationScreen from './src/screens/RecitationScreen';
import VoiceSettingsScreen from './src/screens/VoiceSettingsScreen';
import BookmarksScreen from './src/screens/BookmarksScreen';
import ProfilesScreen from './src/screens/ProfilesScreen';
import MainTabNavigator from './src/screens/MainTabNavigator';
import SubscriptionScreen from './src/screens/SubscriptionScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <NavigationContainer>
            <StatusBar style="light" />
            <Stack.Navigator
              initialRouteName="Onboarding"
              screenOptions={{ headerShown: false }}
            >
              <Stack.Screen name="Onboarding" component={OnboardingScreen} />
              <Stack.Screen
                name="Subscription"
                component={SubscriptionScreen}
                options={{ presentation: 'modal' }}
              />
              <Stack.Screen name="Main" component={MainTabNavigator} />
              <Stack.Screen
                name="Recitation"
                component={RecitationScreen}
                options={{ presentation: 'modal' }}
              />
              <Stack.Screen name="VoiceSettings" component={VoiceSettingsScreen} />
              <Stack.Screen name="Profiles" component={ProfilesScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
