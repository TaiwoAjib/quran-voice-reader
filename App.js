import React from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AppProvider, useApp } from './src/context/AppContext';
import OnboardingScreen from './src/screens/OnboardingScreen';
import RecitationScreen from './src/screens/RecitationScreen';
import VoiceSettingsScreen from './src/screens/VoiceSettingsScreen';
import ProfilesScreen from './src/screens/ProfilesScreen';
import MainTabNavigator from './src/screens/MainTabNavigator';
import SubscriptionScreen from './src/screens/SubscriptionScreen';

const Stack = createNativeStackNavigator();

function RootNavigator() {
  const { hydrated, isOnboarded, theme } = useApp();

  // Wait for AsyncStorage before choosing the first screen,
  // so returning users go straight to the Qur'an instead of re-onboarding.
  if (!hydrated) {
    return <View style={{ flex: 1, backgroundColor: theme.bg }} />;
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        initialRouteName={isOnboarded ? 'Main' : 'Onboarding'}
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
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <RootNavigator />
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
