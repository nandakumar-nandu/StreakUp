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
import * as Haptics from 'expo-haptics';
import { calculateCurrentStreak } from '@/lib/streakCalculator';
import { useInsights } from '@/hooks/useInsights';
import { analyzeWeakDay } from '@/lib/aiCoach';

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

  // AI & Local Insights Engine Queries
  const { bestTimeOfDay, atRiskHabits, momentumScore, personalBest } = useInsights(habits, completedIds);
  const [coachTip, setCoachTip] = useState<string>("Plan your routines early to keep your streaks burning!");

  useEffect(() => {
    if (!user || habits.length === 0) return;
    
    // Fetch a weak-day analysis motivational tip dynamically on load from the AI Coach
    const allComps = habits.flatMap(h => h.completions || []);
    analyzeWeakDay(allComps).then((tip) => {
      setCoachTip(tip);
    }).catch(err => console.log("Error loading coach tip:", err));
  }, [user, habits]);

  // Color interpolation logic: maps momentum range strictly into red (<40), amber (40-70), and green (>70) tiers
  const getMomentumColor = (score: number) => {
    if (score < 40) return '#FF4757'; // Red
    if (score <= 70) return '#FFA502'; // Amber
    return '#2ED573'; // Green
  };

  const handleToggleComplete = async (habit: Habit) => {
    if (!user) return;

    const isCompleted = completedIds.includes(habit.id);
    
    // Trigger Haptic Feedback
    try {
      if (!isCompleted) {
        // User checking off: check if this is a milestone (new streak count)
        const tempCompletions = [...(habit.completions || []), todayStr];
        const newStreak = calculateCurrentStreak(tempCompletions);
        
        if (newStreak === 7 || newStreak === 30 || newStreak === 100) {
          // Play special success milestone vibration pattern
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          // Normal success check-off vibration
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      } else {
        // Uncheck vibration
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (e) {
      console.warn("Failed to trigger haptic feedback:", e);
    }

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

        {/* Rolling Momentum Score Card */}
        {habits.length > 0 && (
          <View 
            style={[styles.momentumCard, { backgroundColor: themeColors.card, borderColor: themeColors.border, ...shadows.sm }]}
            accessibilityRole="text"
            accessibilityLabel={`Momentum score is ${momentumScore} out of 100`}
            accessibilityHint="Measures rolling 7-day completion consistency"
          >
            <View style={[styles.momentumBadge, { backgroundColor: getMomentumColor(momentumScore) + '1A' }]}>
              <Ionicons name="flame" size={24} color={getMomentumColor(momentumScore)} />
            </View>
            <View style={styles.momentumDetails}>
              <Text style={[styles.momentumTitle, { color: themeColors.text }]}>Momentum Score</Text>
              <Text style={[styles.momentumSubtitle, { color: themeColors.textMuted }]}>
                Rolling 7-day consistency level
              </Text>
            </View>
            <View style={styles.momentumScoreArea}>
              <Text style={[styles.momentumScoreVal, { color: getMomentumColor(momentumScore) }]}>
                {momentumScore}
              </Text>
              <Text style={[styles.momentumScoreMax, { color: themeColors.textMuted }]}>/100</Text>
            </View>
          </View>
        )}

        {/* Coach Tip of the Day Panel */}
        {habits.length > 0 && (
          <View 
            style={[styles.coachCard, { backgroundColor: themeColors.card, borderColor: themeColors.border, ...shadows.sm }]}
            accessibilityRole="summary"
            accessibilityLabel={`Coach Tip: ${coachTip}`}
          >
            <View style={styles.coachHeader}>
              <View style={[styles.coachAvatar, { backgroundColor: colors.primary.light }]}>
                <Ionicons name="sparkles" size={14} color="#FFFFFF" />
              </View>
              <Text style={[styles.coachTitle, { color: themeColors.text }]}>Coach Tip of the Day</Text>
            </View>
            <Text style={[styles.coachBody, { color: themeColors.textMuted }]}>
              "{coachTip}"
            </Text>
          </View>
        )}

        {/* At Risk Warnings Strip */}
        {atRiskHabits.length > 0 && atRiskHabits.map(habit => (
          <View 
            key={habit.id} 
            style={[styles.warningStrip, { backgroundColor: 'rgba(255, 165, 2, 0.12)', borderColor: '#FFA502' }]}
            accessibilityRole="alert"
            accessibilityLabel={`Streak warning: Your ${habit.name} streak is at risk`}
          >
            <Ionicons name="warning" size={18} color="#FFA502" style={{ marginRight: spacing.sm }} />
            <Text style={[styles.warningText, { color: themeColors.text }]}>
              ⚠️ Your <Text style={{ fontWeight: 'bold' }}>{habit.name}</Text> streak is at risk!
            </Text>
          </View>
        ))}

        {/* Habit List Section */}
        <Text style={[styles.listHeader, { color: themeColors.textMuted }]}>TODAY'S CHECKLIST</Text>
        
        {habits.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="sparkles-outline" size={64} color={themeColors.textMuted} style={{ marginBottom: spacing.md }} />
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
  warningStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  warningText: {
    fontSize: 13,
    flex: 1,
  },
  momentumCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.xl,
  },
  momentumBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  momentumDetails: {
    flex: 1,
  },
  momentumTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  momentumSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  momentumScoreArea: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  momentumScoreVal: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  momentumScoreMax: {
    fontSize: 12,
  },
  coachCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.xl,
  },
  coachHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  coachAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  coachTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  coachBody: {
    fontSize: 13,
    lineHeight: 20,
    fontStyle: 'italic',
  },
});
