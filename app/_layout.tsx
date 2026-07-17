import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useColorScheme, ThemeProvider } from '@/hooks/useColorScheme';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

// Configure how notifications are handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);

  // Monitor onboarding completed state reactively on route transitions
  useEffect(() => {
    AsyncStorage.getItem('streakup_onboarding_completed')
      .then((val) => {
        setOnboardingCompleted(val === 'true');
      })
      .catch(() => setOnboardingCompleted(true)); // fallback to completed if storage fails
  }, [segments]);

  useEffect(() => {
    if (loading || onboardingCompleted === null) return;

    const inAuthGroup = (segments[0] as string) === '(auth)';
    const inOnboardingGroup = (segments[0] as string) === '(onboarding)';

    if (!user && !inAuthGroup) {
      // Redirect to login if user is not signed in and not in auth screens
      router.replace('/login' as any);
    } else if (user) {
      if (!onboardingCompleted && !inOnboardingGroup) {
        // Redirect to onboarding welcome screen if incomplete
        router.replace('/welcome' as any);
      } else if (onboardingCompleted && (inAuthGroup || inOnboardingGroup)) {
        // Redirect to today checklist if already completed
        router.replace('/' as any);
      }
    }
  }, [user, loading, segments, router, onboardingCompleted]);

  if (loading || onboardingCompleted === null) {
    const themeColors = colorScheme === 'dark' ? colors.dark : colors.light;
    return (
      <View style={[styles.loadingContainer, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator 
          size="large" 
          color={colorScheme === 'dark' ? colors.primary.dark : colors.primary.light} 
        />
      </View>
    );
  }

  return <>{children}</>;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  
  return (
    <AuthGuard>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="habit/[id]" options={{ headerShown: false }} />
      </Stack>
    </AuthGuard>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
