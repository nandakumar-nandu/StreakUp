import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  Platform 
} from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { colors, spacing, borderRadius, typography, shadows } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Habit } from '@/types';
import { HabitCard } from '@/components/HabitCard';
import { CreateHabitModal } from '@/components/CreateHabitModal';

const getTodayString = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Initial mock habits for a complete visual experience
const INITIAL_HABITS: Habit[] = [
  {
    id: '1',
    name: 'Morning Meditation',
    emoji: '🧘',
    color: '#9b59b6', // Amethyst Purple
    frequency: 'daily',
    reminderTime: '07:00 AM',
    createdAt: new Date().toISOString(),
    streak: 5,
    completions: [
      // Mock past completions
      new Date(Date.now() - 86400000 * 4).toISOString().split('T')[0],
      new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
      new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
      new Date(Date.now() - 86400000 * 1).toISOString().split('T')[0],
    ]
  },
  {
    id: '2',
    name: 'Drink 3L Water',
    emoji: '💧',
    color: '#1e90ff', // Electric Blue
    frequency: 'daily',
    reminderTime: '09:00 AM',
    createdAt: new Date().toISOString(),
    streak: 12,
    completions: [
      getTodayString(), // Already completed today in mock state
      new Date(Date.now() - 86400000 * 1).toISOString().split('T')[0],
    ]
  },
  {
    id: '3',
    name: 'Cardio Workout',
    emoji: '🏃',
    color: '#FF4757', // Coral Red
    frequency: 'weekdays',
    reminderTime: '06:00 PM',
    createdAt: new Date().toISOString(),
    streak: 0,
    completions: []
  }
];

export default function HabitsScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? colors.dark : colors.light;
  
  const [habits, setHabits] = useState<Habit[]>(INITIAL_HABITS);
  const [modalVisible, setModalVisible] = useState(false);

  const todayStr = getTodayString();

  const handleToggleComplete = (habitId: string) => {
    setHabits(prevHabits => 
      prevHabits.map(habit => {
        if (habit.id !== habitId) return habit;

        const isCompletedToday = habit.completions.includes(todayStr);
        let updatedCompletions: string[];
        let updatedStreak = habit.streak;

        if (isCompletedToday) {
          // Remove completion for today
          updatedCompletions = habit.completions.filter(c => c !== todayStr);
          updatedStreak = Math.max(0, habit.streak - 1);
        } else {
          // Add completion for today
          updatedCompletions = [...habit.completions, todayStr];
          updatedStreak = habit.streak + 1;
        }

        return {
          ...habit,
          completions: updatedCompletions,
          streak: updatedStreak
        };
      })
    );
  };

  const handleCreateHabit = (newHabitData: Omit<Habit, 'id' | 'createdAt' | 'streak' | 'completions'>) => {
    const newHabit: Habit = {
      ...newHabitData,
      id: Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString(),
      streak: 0,
      completions: []
    };
    
    setHabits(prev => [newHabit, ...prev]);
    setModalVisible(false);
  };

  const activeHabitsCount = habits.length;

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
            <Ionicons name="clipboard-outline" size={64} color={themeColors.textMuted} />
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
              onToggleComplete={() => handleToggleComplete(habit.id)}
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
