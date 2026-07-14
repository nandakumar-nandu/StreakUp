/**
 * StreakUp TypeScript Interfaces
 * 
 * Defines data structures for Habits, Workouts, Users, and Stats.
 */

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt: string;
  points: number;       // Gamification points earned
  streakDays: number;   // Current consecutive active days
}

export type HabitCategory = 'fitness' | 'mind' | 'nutrition' | 'sleep' | 'work' | 'other';

export interface Habit {
  id: string;
  userId: string;
  name: string;
  description?: string;
  category: HabitCategory;
  frequency: 'daily' | 'weekly' | 'custom';
  frequencyDays?: number[]; // e.g., [1, 3, 5] for Mon, Wed, Fri (0 = Sunday, 1 = Monday...)
  createdAt: string;
  
  // Streak tracking
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate?: string; // YYYY-MM-DD format
  completionHistory: string[]; // List of YYYY-MM-DD dates completed
}

export interface Workout {
  id: string;
  userId: string;
  title: string;
  type: string; // e.g., 'Running', 'Cycling', 'Strength', 'Yoga'
  duration: number; // in minutes
  caloriesBurned?: number;
  distance?: number; // in kilometers/miles (optional)
  date: string; // YYYY-MM-DD
  notes?: string;
  createdAt: string;
}

export interface HabitStats {
  totalHabitsCount: number;
  completedTodayCount: number;
  activeStreakCount: number;
  completionRate: number; // Percentage, e.g. 85.5
}
