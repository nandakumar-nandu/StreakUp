import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { colors, spacing, borderRadius, typography, shadows } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { requestNotificationPermissions } from '@/lib/notificationsManager';
import * as Haptics from 'expo-haptics';

/**
 * notifications.tsx - Push Notifications Permission Onboarding
 * 
 * DATA COLLECTED: Push notification permission status (Granted or Denied).
 * STORAGE LOCATION: AsyncStorage under key 'streakup_notification_permission' and system preferences.
 * 
 * Explains to the user why daily notification alerts are used (reminders, streak alerts),
 * and triggers the native OS notification request popups.
 */
export default function NotificationsOnboardingScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const handleAllow = async () => {
    setLoading(true);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await requestNotificationPermissions();
      router.push('/done' as any);
    } catch (e) {
      console.error(e);
      router.push('/done' as any);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/done' as any);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={styles.content}>
        <View style={styles.illustrationContainer}>
          <Ionicons 
            name="notifications-circle-outline" 
            size={120} 
            color={colorScheme === 'dark' ? colors.primary.dark : colors.primary.light} 
            accessibilityRole="image"
            accessibilityLabel="Notification Alarm Icon"
          />
        </View>

        <Text style={[styles.title, { color: themeColors.text }]} accessibilityRole="header">
          Never Break Your Streaks
        </Text>
        
        <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>
          Enable daily reminders and dynamic streak-at-risk warning notifications. Users who receive alerts are 85% more consistent in maintaining their tracking routines.
        </Text>

        <View style={styles.card}>
          <View style={styles.bulletRow}>
            <Ionicons name="checkmark-circle-outline" size={18} color="#2ED573" />
            <Text style={[styles.bulletText, { color: themeColors.text }]}>Daily reminders matching your target schedule slot.</Text>
          </View>
          <View style={styles.bulletRow}>
            <Ionicons name="checkmark-circle-outline" size={18} color="#2ED573" />
            <Text style={[styles.bulletText, { color: themeColors.text }]}>8:00 PM alerts if streak-saving habits remain unchecked.</Text>
          </View>
          <View style={styles.bulletRow}>
            <Ionicons name="checkmark-circle-outline" size={18} color="#2ED573" />
            <Text style={[styles.bulletText, { color: themeColors.text }]}>Friend duels invitations and streak nudge updates.</Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleAllow}
          disabled={loading}
          style={[styles.button, { backgroundColor: colors.primary.light }]}
          accessibilityRole="button"
          accessibilityLabel="Enable notifications and continue"
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.buttonText}>Enable Notifications</Text>
              <Ionicons name="notifications" size={18} color="#FFFFFF" style={{ marginLeft: spacing.sm }} />
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleSkip}
          style={styles.skipBtn}
          accessibilityRole="button"
          accessibilityLabel="Skip notification permissions setup"
        >
          <Text style={[styles.skipText, { color: themeColors.textMuted }]}>Maybe Later</Text>
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
  illustrationContainer: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  card: {
    width: '100%',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.huge,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  bulletText: {
    fontSize: 13,
    marginLeft: spacing.md,
    flex: 1,
  },
  button: {
    flexDirection: 'row',
    height: 52,
    width: '100%',
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
  skipBtn: {
    marginTop: spacing.lg,
    padding: spacing.sm,
  },
  skipText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});
