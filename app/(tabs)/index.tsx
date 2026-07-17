import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  SafeAreaView, 
  TouchableOpacity,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { colors, spacing, borderRadius, typography, shadows } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Habit } from '@/types';
import { ProgressRing } from '@/components/ProgressRing';
import { AnimatedCheckbox } from '@/components/AnimatedCheckbox';
import { useAuth } from '@/hooks/useAuth';
import { subscribeToHabits, subscribeToCompletions, toggleHabitCompletion } from '@/lib/habitsService';
import ConfettiCannon from 'react-native-confetti-cannon';
import { syncNotifications } from '@/lib/notificationsManager';

const getTodayString = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getFormattedDate = () => {
  const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
  return new Date().toLocaleDateString('en-US', options);
};

export default function TodayScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? colors.dark : colors.light;
  
  const { user } = useAuth();
  
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  const confettiRef = useRef<ConfettiCannon | null>(null);
  
  const todayStr = getTodayString();
  const totalCount = habits.length;
  const completedCount = habits.filter(h => completedIds.includes(h.id)).length;
  const progressRatio = totalCount > 0 ? completedCount / totalCount : 0;
  const allCompleted = totalCount > 0 && completedCount === totalCount;
  
  // Track previous completion state to trigger confetti only on transition to 100%
  const prevAllCompleted = useRef(allCompleted);

  // Synchronize habits and completions from Firestore
  useEffect(() => {
    if (!user) return;

    setLoading(true);

    // Subscribe to all habits definitions
    const unsubscribeHabits = subscribeToHabits(user.uid, (loadedHabits) => {
      setHabits(loadedHabits);
      setLoading(false);
    });

    // Subscribe to today's completion logs
    const unsubscribeCompletions = subscribeToCompletions(user.uid, todayStr, (ids) => {
      setCompletedIds(ids);
    });

    return () => {
      unsubscribeHabits();
      unsubscribeCompletions();
    };
  }, [user, todayStr]);

  // Sync scheduled push notifications (reminders & risk alerts) reactively
  useEffect(() => {
    if (user && habits.length > 0) {
      syncNotifications(user.uid, habits, completedIds);
    }
  }, [user, habits, completedIds]);

  // Confetti explosion effect on perfect completion days
  useEffect(() => {
    if (allCompleted && !prevAllCompleted.current) {
      confettiRef.current?.start();
    }
    prevAllCompleted.current = allCompleted;
  }, [allCompleted]);

  const handleToggleComplete = async (habit: Habit) => {
    if (!user) return;

    const isCompleted = completedIds.includes(habit.id);
    
    try {
      // Toggle in Firestore database (this updates the completions collection and habit streak)
      await toggleHabitCompletion(
        user.uid,
        habit.id,
        todayStr,
        !isCompleted,
        habit.completions
      );
    } catch (error) {
      console.error("Error toggling completion:", error);
    }
  };

  const ringLabel = `${completedCount}/${totalCount}`;
  const windowWidth = Dimensions.get('window').width;

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingCenter, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={colorScheme === 'dark' ? colors.primary.dark : colors.primary.light} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      
      {/* Confetti Cannon overlay */}
      <ConfettiCannon
        ref={confettiRef}
        count={150}
        origin={{ x: windowWidth / 2, y: -20 }}
        autoStart={false}
        fadeOut={true}
        fallSpeed={3000}
      />

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Date Header */}
        <View style={styles.header}>
          <Text style={[styles.dateText, { color: themeColors.textMuted }]}>
            {getFormattedDate()}
          </Text>
          <Text style={[styles.greetingText, { color: themeColors.text }]}>
            Today's Progress
          </Text>
        </View>

        {/* Circular Progress Section */}
        <View style={[styles.progressCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <ProgressRing 
            progress={progressRatio} 
            size={140}
            strokeWidth={14}
            label={ringLabel}
          />
          <View style={styles.progressDetail}>
            {allCompleted ? (
              <View style={styles.celebrateBadge}>
                <Text style={styles.celebrateTitle}>🔥 Perfect Day!</Text>
                <Text style={[styles.celebrateSubtitle, { color: themeColors.textMuted }]}>
                  All goals complete. Keep it up!
                </Text>
              </View>
            ) : (
              <View>
                <Text style={[styles.statusTitle, { color: themeColors.text }]}>
                  {totalCount - completedCount} habits remaining
                </Text>
                <Text style={[styles.statusSubtitle, { color: themeColors.textMuted }]}>
                  {Math.round(progressRatio * 100)}% of your habits done
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* "All Done!" Banner Card */}
        {allCompleted && (
          <View style={[
            styles.celebrationCard, 
            { 
              backgroundColor: colorScheme === 'dark' ? 'rgba(46,229,157,0.12)' : 'rgba(46,213,115,0.08)', 
              borderColor: colorScheme === 'dark' ? colors.secondary.dark : colors.secondary.light 
            }
          ]}>
            <Ionicons name="trophy" size={32} color={colorScheme === 'dark' ? colors.secondary.dark : colors.secondary.light} />
            <View style={styles.celebrationTextContainer}>
              <Text style={[styles.celebrationTitleText, { color: themeColors.text }]}>Streak Maintained!</Text>
              <Text style={[styles.celebrationSubText, { color: themeColors.textMuted }]}>You've locked in your habit streaks for today.</Text>
            </View>
          </View>
        )}

        {/* Habit List Section */}
        <Text style={[styles.listHeader, { color: themeColors.textMuted }]}>TODAY'S CHECKLIST</Text>
        
        {habits.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="sparkles-outline" size={48} color={themeColors.textMuted} />
            <Text style={[styles.emptyText, { color: themeColors.text }]}>All clear for today</Text>
            <Text style={[styles.emptySubtitle, { color: themeColors.textMuted }]}>
              There are no habits scheduled for today. Add routines in the Habits tab!
            </Text>
          </View>
        ) : (
          habits.map(habit => {
            const isCompleted = completedIds.includes(habit.id);
            const tint = `${habit.color}15`;

            return (
              <TouchableOpacity
                key={habit.id}
                activeOpacity={0.9}
                style={[
                  styles.habitItem,
                  { 
                    backgroundColor: themeColors.card,
                    borderColor: isCompleted ? habit.color : themeColors.border
                  }
                ]}
                onPress={() => handleToggleComplete(habit)}
              >
                <View style={styles.itemRow}>
                  {/* Category Emoji Box */}
                  <View style={[styles.emojiBox, { backgroundColor: tint }]}>
                    <Text style={styles.emojiText}>{habit.emoji}</Text>
                  </View>
                  
                  {/* Name and Streak */}
                  <View style={styles.itemDetails}>
                    <Text style={[
                      styles.itemName, 
                      { 
                        color: themeColors.text,
                        textDecorationLine: isCompleted ? 'line-through' : 'none',
                        opacity: isCompleted ? 0.6 : 1
                      }
                    ]} numberOfLines={1}>
                      {habit.name}
                    </Text>
                    <Text style={[styles.itemStreak, { color: colors.warning.light }]}>
                      🔥 {habit.streak} day streak
                    </Text>
                  </View>

                  {/* Custom Animated Checkbox */}
                  <AnimatedCheckbox
                    checked={isCompleted}
                    onPress={() => handleToggleComplete(habit)}
                    activeColor={habit.color}
                    size={28}
                  />
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingCenter: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.huge,
  },
  header: {
    marginBottom: spacing.lg,
  },
  dateText: {
    fontSize: typography.sizes.bodyMedium,
    fontWeight: 'semibold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  greetingText: {
    fontSize: typography.sizes.h1,
    fontWeight: 'bold',
    marginTop: 4,
  },
  progressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  progressDetail: {
    flex: 1,
    marginLeft: spacing.xl,
  },
  statusTitle: {
    fontSize: typography.sizes.bodyLarge,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: typography.sizes.bodySmall,
  },
  celebrateBadge: {
    justifyContent: 'center',
  },
  celebrateTitle: {
    fontSize: typography.sizes.h3,
    fontWeight: 'bold',
    color: '#2ED573',
    marginBottom: 2,
  },
  celebrateSubtitle: {
    fontSize: typography.sizes.bodySmall,
  },
  celebrationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  celebrationTextContainer: {
    marginLeft: spacing.md,
    flex: 1,
  },
  celebrationTitleText: {
    fontSize: typography.sizes.bodyLarge,
    fontWeight: 'bold',
  },
  celebrationSubText: {
    fontSize: typography.sizes.bodySmall,
    marginTop: 2,
  },
  listHeader: {
    fontSize: typography.sizes.caption,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  habitItem: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.md,
    ...shadows.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emojiBox: {
    width: 42,
    height: 42,
    borderRadius: borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  emojiText: {
    fontSize: 20,
  },
  itemDetails: {
    flex: 1,
    marginRight: spacing.sm,
  },
  itemName: {
    fontSize: typography.sizes.bodyLarge,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  itemStreak: {
    fontSize: typography.sizes.bodySmall,
    fontWeight: 'semibold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.huge,
    marginTop: spacing.xl,
  },
  emptyText: {
    fontSize: typography.sizes.bodyLarge,
    fontWeight: 'bold',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: typography.sizes.bodyMedium,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
});
