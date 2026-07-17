import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  Platform,
  ActivityIndicator
} from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { colors, spacing, borderRadius, typography, shadows } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Habit } from '@/types';
import { HabitCard } from '@/components/HabitCard';
import { CreateHabitModal } from '@/components/CreateHabitModal';
import { useAuth } from '@/hooks/useAuth';
import { subscribeToHabits, createHabit, deleteHabit, toggleHabitCompletion } from '@/lib/habitsService';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

const getTodayString = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function HabitsScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? colors.dark : colors.light;
  
  const { user } = useAuth();
  const router = useRouter();
  
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  const todayStr = getTodayString();

  // Listen to Firestore habits collection changes in real-time
  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const unsubscribe = subscribeToHabits(user.uid, (loadedHabits) => {
      setHabits(loadedHabits);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const handleToggleComplete = async (habit: Habit) => {
    if (!user) return;

    const isCompletedToday = habit.completions.includes(todayStr);
    
    try {
      Haptics.impactAsync(isCompletedToday ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {
      console.warn("Failed to trigger haptic feedback:", e);
    }

    try {
      await toggleHabitCompletion(
        user.uid,
        habit.id,
        todayStr,
        !isCompletedToday,
        habit.completions
      );
    } catch (error) {
      console.error("Error toggling habit completion:", error);
    }
  };

  const handleCreateHabit = async (newHabitData: Omit<Habit, 'id' | 'createdAt' | 'streak' | 'completions'>) => {
    if (!user) return;

    try {
      await createHabit(user.uid, newHabitData);
      setModalVisible(false);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {
        console.warn("Failed to trigger haptic feedback:", e);
      }
    } catch (error) {
      console.error("Error creating habit:", error);
    }
  };

  const handleDeleteHabit = async (habitId: string) => {
    if (!user) return;

    try {
      await deleteHabit(user.uid, habitId);
    } catch (error) {
      console.error("Error deleting habit:", error);
    }
  };

  const activeHabitsCount = habits.length;

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingCenter, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={colorScheme === 'dark' ? colors.primary.dark : colors.primary.light} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Habit Summary Card */}
        <View style={[styles.summaryCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <Text style={[styles.summaryTitle, { color: themeColors.textMuted }]}>DAILY ROUTINE</Text>
          <Text style={[styles.summaryCount, { color: themeColors.text }]}>
            {activeHabitsCount} Active Habits
          </Text>
        </View>

        {/* Habits List */}
        {habits.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="clipboard-outline" size={64} color={themeColors.textMuted} style={{ marginBottom: spacing.md }} />
            <Text style={[styles.emptyText, { color: themeColors.text }]}>No habits set yet</Text>
            <Text style={[styles.emptySubtitle, { color: themeColors.textMuted }]}>
              Tap the "+" button below to build your first routine.
            </Text>
          </View>
        ) : (
          habits.map(habit => (
            <HabitCard
              key={habit.id}
              habit={habit}
              isCompletedToday={habit.completions.includes(todayStr)}
              onToggleComplete={() => handleToggleComplete(habit)}
              onDelete={() => handleDeleteHabit(habit.id)}
              onPress={() => router.push(`/habit/${habit.id}` as any)}
            />
          ))
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[
          styles.fab, 
          { 
            backgroundColor: colorScheme === 'dark' ? colors.primary.dark : colors.primary.light,
            ...shadows.lg
          }
        ]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={32} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Create Habit Modal */}
      <CreateHabitModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleCreateHabit}
      />
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
    paddingBottom: 100, // Avoid overlapping with FAB
  },
  summaryCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  summaryTitle: {
    fontSize: typography.sizes.caption,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 4,
  },
  summaryCount: {
    fontSize: typography.sizes.h2,
    fontWeight: 'bold',
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
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 32 : 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
  },
});
