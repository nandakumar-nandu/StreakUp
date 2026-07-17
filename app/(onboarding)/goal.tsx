import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { colors, spacing, borderRadius, typography, shadows } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

/**
 * goal.tsx - Goal Selection Screen
 * 
 * DATA COLLECTED: Chosen goal string (e.g., 'Health', 'Productivity', etc.)
 * STORAGE LOCATION: AsyncStorage under key 'streakup_onboarding_goal'.
 * 
 * Allows the user to select their main focus. This choice configures
 * the category used to suggest customized starter habits in the next screen.
 */
export default function GoalScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const router = useRouter();

  const [selectedGoal, setSelectedGoal] = useState<string>('health');

  const goals = [
    { key: 'health', label: 'Health & Wellness', icon: 'heart-outline', desc: 'Hydration, diet, and rest' },
    { key: 'productivity', label: 'Productivity', icon: 'briefcase-outline', desc: 'Focus, scheduling, organization' },
    { key: 'mindfulness', label: 'Mindfulness', icon: 'leaf-outline', desc: 'Meditation, gratitude, stretch' },
    { key: 'fitness', label: 'Fitness & Gym', icon: 'barbell-outline', desc: 'Cardio, strength, exercises' },
    { key: 'learning', label: 'Learning & Skills', icon: 'book-outline', desc: 'Reading, languages, learning' }
  ];

  const handleNext = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await AsyncStorage.setItem('streakup_onboarding_goal', selectedGoal);
      router.push('/suggest' as any);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.header, { color: themeColors.text }]} accessibilityRole="header">
          What is your main goal?
        </Text>
        <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>
          We will suggest personalized habits to get you started based on this choice.
        </Text>

        <View style={styles.grid}>
          {goals.map((g) => {
            const isSelected = selectedGoal === g.key;
            const borderCol = isSelected 
              ? (colorScheme === 'dark' ? colors.primary.dark : colors.primary.light)
              : themeColors.border;

            return (
              <TouchableOpacity
                key={g.key}
                activeOpacity={0.8}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedGoal(g.key);
                }}
                style={[
                  styles.card, 
                  { 
                    backgroundColor: themeColors.card, 
                    borderColor: borderCol,
                    borderWidth: isSelected ? 2 : 1
                  }
                ]}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
                accessibilityLabel={`${g.label} goal`}
                accessibilityHint={g.desc}
              >
                <View style={styles.cardHeader}>
                  <Ionicons 
                    name={g.icon as any} 
                    size={22} 
                    color={isSelected ? (colorScheme === 'dark' ? colors.primary.dark : colors.primary.light) : themeColors.text} 
                  />
                  <Text style={[styles.cardTitle, { color: themeColors.text, fontWeight: isSelected ? 'bold' : 'normal' }]}>
                    {g.label}
                  </Text>
                </View>
                <Text style={[styles.cardDesc, { color: themeColors.textMuted }]}>{g.desc}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleNext}
          style={[styles.button, { backgroundColor: colors.primary.light }]}
          accessibilityRole="button"
          accessibilityLabel="Continue to next screen"
        >
          <Text style={styles.buttonText}>Continue</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: spacing.sm }} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.xl,
    paddingBottom: spacing.huge,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.huge,
  },
  grid: {
    width: '100%',
    marginBottom: spacing.huge,
  },
  card: {
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 16,
    marginLeft: spacing.md,
  },
  cardDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginLeft: 32,
  },
  button: {
    flexDirection: 'row',
    height: 52,
    width: '100%',
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
    ...shadows.sm,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
