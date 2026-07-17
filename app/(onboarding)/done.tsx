import React, { useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { colors, spacing, borderRadius, typography, shadows } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ConfettiCannon from 'react-native-confetti-cannon';
import * as Haptics from 'expo-haptics';

/**
 * done.tsx - Onboarding Completion Celebration Screen
 * 
 * DATA COLLECTED: Onboarding completion state (Boolean).
 * STORAGE LOCATION: AsyncStorage under key 'streakup_onboarding_completed' set to 'true'.
 * 
 * Renders a celebratory congratulations screen featuring dropping confetti particles.
 * Tapping the final button completes the flow, redirects to the main app dashboard,
 * and seals the onboarding path from showing again.
 */
export default function OnboardingDoneScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const router = useRouter();
  const confettiRef = useRef<any>(null);

  useEffect(() => {
    // Play celebratory haptics pattern on mount
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => {
      confettiRef.current?.start();
    }, 300);
  }, []);

  const handleFinish = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await AsyncStorage.setItem('streakup_onboarding_completed', 'true');
      router.replace('/' as any);
    } catch (e) {
      console.error(e);
      router.replace('/' as any);
    }
  };

  const windowWidth = Dimensions.get('window').width;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Falling Confetti Layer */}
      <ConfettiCannon
        ref={confettiRef}
        count={80}
        origin={{ x: windowWidth / 2, y: -20 }}
        autoStart={false}
        fadeOut={true}
      />

      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons 
            name="rocket-outline" 
            size={64} 
            color="#FFFFFF" 
            accessibilityRole="image"
            accessibilityLabel="Rocket Icon"
          />
        </View>

        <Text style={[styles.title, { color: themeColors.text }]} accessibilityRole="header">
          You're All Set!
        </Text>
        
        <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>
          Your habit dashboard is preconfigured and notifications are configured. The AI Coach is active inside the Stats tab to guide you!
        </Text>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleFinish}
          style={[styles.button, { backgroundColor: colors.primary.light }]}
          accessibilityRole="button"
          accessibilityLabel="Enter StreakUp application dashboard"
          accessibilityHint="Redirects you to the main Today checklist"
        >
          <Text style={styles.buttonText}>Enter StreakUp</Text>
          <Ionicons name="flash" size={18} color="#FFFFFF" style={{ marginLeft: spacing.sm }} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#2ED573',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    ...shadows.md,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.huge,
    paddingHorizontal: spacing.md,
  },
  button: {
    flexDirection: 'row',
    height: 52,
    width: '100%',
    maxWidth: 280,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
