import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { colors, spacing, borderRadius, typography, shadows } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateHabitSuggestions } from '@/lib/aiCoach';
import { useAuth } from '@/hooks/useAuth';
import { createHabit } from '@/lib/habitsService';
import * as Haptics from 'expo-haptics';

/**
 * suggest.tsx - AI Suggested Habits Screen
 * 
 * DATA COLLECTED: Array of selected habit objects (name, emoji, color).
 * STORAGE LOCATION: Written directly to the user's Firestore collection `users/{uid}/habits/{habitId}`.
 * 
 * Inspects the user's focus goal from AsyncStorage and queries the AI Coach (or static fallback)
 * to suggest 6 initial habits. The user checkmarks which ones they want to add to their dashboard.
 */
export default function SuggestScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<{ name: string; emoji: string; color: string }[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([0, 1, 2]); // default select first 3
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const goal = await AsyncStorage.getItem('streakup_onboarding_goal') || 'health';
        const rawSuggestions = await generateHabitSuggestions(goal);
        
        // Add a 6th default suggestion to meet the "Show 6 suggestions" requirement
        const staticAdditions = [
          { name: "Reflect on today's progress", emoji: "🧘", color: "#A4B0BE" },
          { name: "Review daily wins", emoji: "🏆", color: "#FFA500" }
        ];
        
        const final6 = [...rawSuggestions];
        while (final6.length < 6) {
          const addition = staticAdditions[final6.length % staticAdditions.length];
          // Avoid duplicate name
          if (!final6.some(h => h.name === addition.name)) {
            final6.push(addition);
          } else {
            final6.push({ name: `${addition.name} routine`, emoji: addition.emoji, color: addition.color });
          }
        }
        setSuggestions(final6.slice(0, 6));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchSuggestions();
  }, []);

  const handleToggleSelect = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectedIndices.includes(index)) {
      setSelectedIndices(selectedIndices.filter(i => i !== index));
    } else {
      setSelectedIndices([...selectedIndices, index]);
    }
  };

  const handleNext = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Save selected starter habits directly to Firestore
      for (const index of selectedIndices) {
        const item = suggestions[index];
        await createHabit(user.uid, {
          name: item.name,
          emoji: item.emoji,
          color: item.color,
          frequency: 'daily',
          reminderTime: '08:00 AM' // Default reminder time setting
        });
      }

      router.push('/schedule' as any);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.header, { color: themeColors.text }]} accessibilityRole="header">
          Adopt Starter Habits
        </Text>
        <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>
          Our AI Coach recommends starting with these daily routines. Check the ones you'd like to adopt.
        </Text>

        {loading ? (
          <View style={styles.loadingArea}>
            <ActivityIndicator size="large" color={colors.primary.light} style={{ marginBottom: spacing.md }} />
            <Text style={{ color: themeColors.textMuted }}>Consulting AI Coach...</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {suggestions.map((item, index) => {
              const isSelected = selectedIndices.includes(index);
              const cardBorder = isSelected ? item.color : themeColors.border;

              return (
                <TouchableOpacity
                  key={index}
                  activeOpacity={0.8}
                  onPress={() => handleToggleSelect(index)}
                  style={[
                    styles.card, 
                    { 
                      backgroundColor: themeColors.card, 
                      borderColor: cardBorder,
                      borderWidth: isSelected ? 2 : 1
                    }
                  ]}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isSelected }}
                  accessibilityLabel={item.name}
                  accessibilityHint="Double tap to toggle adoption"
                >
                  <View style={styles.cardLeft}>
                    <Text style={styles.emoji}>{item.emoji}</Text>
                    <Text style={[styles.cardName, { color: themeColors.text, fontWeight: isSelected ? 'bold' : 'normal' }]}>
                      {item.name}
                    </Text>
                  </View>
                  <View style={[styles.checkCircle, { borderColor: isSelected ? item.color : themeColors.border, backgroundColor: isSelected ? item.color : 'transparent' }]}>
                    {isSelected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleNext}
          disabled={submitting || loading}
          style={[styles.button, { backgroundColor: colors.primary.light, opacity: (loading || submitting) ? 0.6 : 1 }]}
          accessibilityRole="button"
          accessibilityLabel="Continue to schedule configuration"
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.buttonText}>Adopt & Continue</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: spacing.sm }} />
            </>
          )}
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
    paddingHorizontal: spacing.sm,
  },
  loadingArea: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    width: '100%',
    marginBottom: spacing.huge,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.md,
  },
  emoji: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  cardName: {
    fontSize: 14,
    flex: 1,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
