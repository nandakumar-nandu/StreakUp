import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { colors, spacing, borderRadius, typography, shadows } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

/**
 * welcome.tsx - Welcome Screen
 * 
 * DATA COLLECTED: None.
 * STORAGE LOCATION: None.
 * 
 * Renders the introductory screen explaining StreakUp's mission and provides
 * a transition trigger to the next step.
 */
export default function WelcomeScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Ionicons 
            name="flame" 
            size={80} 
            color={colorScheme === 'dark' ? colors.primary.dark : colors.primary.light} 
            accessibilityRole="image"
            accessibilityLabel="StreakUp Flame Logo"
          />
        </View>

        <Text 
          style={[styles.title, { color: themeColors.text }]}
          accessibilityRole="header"
        >
          Welcome to StreakUp
        </Text>
        
        <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>
          Build habits, schedule custom exercises, duel friends, and maintain your streaks with localized smart analytics and AI coaching.
        </Text>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push('/goal' as any)}
          style={[styles.button, { backgroundColor: colors.primary.light }]}
          accessibilityRole="button"
          accessibilityLabel="Get Started with onboarding"
          accessibilityHint="Starts the goal setup configuration"
        >
          <Text style={styles.buttonText}>Get Started</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: spacing.sm }} />
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
  logoContainer: {
    marginBottom: spacing.huge,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
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
