import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  ActivityIndicator, 
  Alert,
  Platform
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useColorScheme } from '@/hooks/useColorScheme';
import { colors, spacing, borderRadius, typography, shadows } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { subscribeToHabit, deleteHabit } from '@/lib/habitsService';
import { calculateCurrentStreak, calculateLongestStreak, getCompletionRate } from '@/lib/streakCalculator';
import { Calendar } from 'react-native-calendars';
import { Habit } from '@/types';

export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? colors.dark : colors.light;

  const [habit, setHabit] = useState<Habit | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !id) return;

    setLoading(true);
    const unsubscribe = subscribeToHabit(user.uid, id as string, (loadedHabit) => {
      if (loadedHabit) {
        setHabit(loadedHabit);
      } else {
        // Habit was deleted or not found
        setHabit(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [user, id]);

  const handleDeletePress = () => {
    if (!user || !habit) return;

    Alert.alert(
      "Delete Habit",
      `Are you sure you want to permanently delete "${habit.name}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              router.back();
              await deleteHabit(user.uid, habit.id);
            } catch (err) {
              console.error("Error deleting habit:", err);
            }
          } 
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={colorScheme === 'dark' ? colors.primary.dark : colors.primary.light} />
      </SafeAreaView>
    );
  }

  if (!habit) {
    return (
      <SafeAreaView style={[styles.container, styles.center, { backgroundColor: themeColors.background }]}>
        <Text style={[styles.errorTitle, { color: themeColors.text }]}>Habit not found</Text>
        <Text style={[styles.errorSubtitle, { color: themeColors.textMuted }]}>It may have been deleted.</Text>
        <TouchableOpacity 
          style={[styles.backBtn, { backgroundColor: colorScheme === 'dark' ? colors.primary.dark : colors.primary.light }]}
          onPress={() => router.back()}
        >
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Calculate statistics from the completions array
  const completions = habit.completions || [];
  const currentStreak = calculateCurrentStreak(completions);
  const longestStreak = calculateLongestStreak(completions);
  const completionRate = getCompletionRate(completions, 30); // 30-day rate

  // Build calendar marked dates mapping completed days in the habit's theme color
  const markedDates: { [date: string]: any } = {};
  completions.forEach((dateStr) => {
    markedDates[dateStr] = {
      selected: true,
      selectedColor: habit.color,
      selectedTextColor: '#FFFFFF',
    };
  });

  const emojiBgTint = `${habit.color}1C`; // ~11% opacity in Hex

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Premium Header */}
      <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
        <TouchableOpacity 
          style={[styles.iconButton, { borderColor: themeColors.border }]} 
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={22} color={themeColors.text} />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: themeColors.text }]} numberOfLines={1}>
          Details
        </Text>

        <TouchableOpacity 
          style={[styles.iconButton, { borderColor: themeColors.border }]} 
          onPress={handleDeletePress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={22} color="#FF4757" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Habit Profile Row */}
        <View style={styles.profileSection}>
          <View style={[styles.emojiCircle, { backgroundColor: emojiBgTint }]}>
            <Text style={styles.emojiText}>{habit.emoji}</Text>
          </View>
          <View style={styles.profileDetails}>
            <Text style={[styles.habitName, { color: themeColors.text }]}>{habit.name}</Text>
            <View style={styles.metaRow}>
              <View style={[styles.frequencyBadge, { backgroundColor: themeColors.border }]}>
                <Text style={[styles.frequencyText, { color: themeColors.text }]}>
                  {habit.frequency.charAt(0).toUpperCase() + habit.frequency.slice(1)}
                </Text>
              </View>
              {habit.reminderTime && (
                <View style={styles.reminderContainer}>
                  <Ionicons name="notifications-outline" size={14} color={themeColors.textMuted} style={{ marginRight: 4 }} />
                  <Text style={[styles.reminderText, { color: themeColors.textMuted }]}>
                    {habit.reminderTime}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Stats Dashboard Grid */}
        <View style={styles.statsGrid}>
          {/* Current Streak */}
          <View style={[styles.statsCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <View style={[styles.statsIconBg, { backgroundColor: 'rgba(255, 165, 2, 0.12)' }]}>
              <Ionicons name="flame" size={24} color="#FFA502" />
            </View>
            <Text style={[styles.statsValue, { color: themeColors.text }]}>{currentStreak}</Text>
            <Text style={[styles.statsLabel, { color: themeColors.textMuted }]}>Current Streak</Text>
          </View>

          {/* Longest Streak */}
          <View style={[styles.statsCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <View style={[styles.statsIconBg, { backgroundColor: 'rgba(255, 94, 108, 0.12)' }]}>
              <Ionicons name="trophy" size={24} color="#FF5E6C" />
            </View>
            <Text style={[styles.statsValue, { color: themeColors.text }]}>{longestStreak}</Text>
            <Text style={[styles.statsLabel, { color: themeColors.textMuted }]}>Longest Streak</Text>
          </View>

          {/* Completion Rate */}
          <View style={[styles.statsCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <View style={[styles.statsIconBg, { backgroundColor: 'rgba(130, 177, 255, 0.12)' }]}>
              <Ionicons name="analytics" size={24} color="#82B1FF" />
            </View>
            <Text style={[styles.statsValue, { color: themeColors.text }]}>{completionRate}%</Text>
            <Text style={[styles.statsLabel, { color: themeColors.textMuted }]}>30-Day Rate</Text>
          </View>
        </View>

        {/* Calendar Heatmap Section */}
        <Text style={[styles.sectionTitle, { color: themeColors.textMuted }]}>COMPLETION HEATMAP</Text>
        <View style={[styles.calendarCard, { backgroundColor: themeColors.card, borderColor: themeColors.border, ...shadows.sm }]}>
          <Calendar
            markedDates={markedDates}
            theme={{
              backgroundColor: themeColors.card,
              calendarBackground: themeColors.card,
              textSectionTitleColor: themeColors.textMuted,
              selectedDayBackgroundColor: habit.color,
              selectedDayTextColor: '#FFFFFF',
              todayTextColor: habit.color,
              dayTextColor: themeColors.text,
              textDisabledColor: colorScheme === 'dark' ? '#3A3F4D' : '#D1D8E0',
              arrowColor: habit.color,
              monthTextColor: themeColors.text,
              indicatorColor: habit.color,
              textDayFontWeight: '500',
              textMonthFontWeight: 'bold',
              textDayHeaderFontWeight: '500',
              textDayFontSize: 14,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 12,
            }}
            enableSwipeMonths={true}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorTitle: {
    fontSize: typography.sizes.h2,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  errorSubtitle: {
    fontSize: typography.sizes.bodyMedium,
    marginBottom: spacing.xl,
  },
  backBtn: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  header: {
    height: Platform.OS === 'ios' ? 56 : 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: spacing.md,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.huge,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.sm,
  },
  emojiCircle: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  emojiText: {
    fontSize: 32,
  },
  profileDetails: {
    flex: 1,
  },
  habitName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  frequencyBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.xs,
    marginRight: spacing.md,
  },
  frequencyText: {
    fontSize: typography.sizes.caption,
    fontWeight: 'bold',
  },
  reminderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reminderText: {
    fontSize: typography.sizes.bodySmall,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xxl,
  },
  statsCard: {
    flex: 1,
    marginHorizontal: 4,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  statsIconBg: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statsLabel: {
    fontSize: typography.sizes.caption,
    fontWeight: 'semibold',
  },
  sectionTitle: {
    fontSize: typography.sizes.caption,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginBottom: spacing.md,
  },
  calendarCard: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
    padding: spacing.xs,
  },
});
