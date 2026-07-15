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
  /** Unique identifier for the habit */
  id: string;
  
  /** User-defined name of the habit (e.g., "Read 10 Pages") */
  name: string;
  
  /** Selected icon emoji representing the habit */
  emoji: string;
  
  /** Hex color value representing the theme/accent of the habit card */
  color: string;
  
  /** Execution schedule frequency: 'daily' | 'weekdays' | 'weekends' | 'custom' */
  frequency: 'daily' | 'weekdays' | 'weekends' | 'custom';
  
  /** Daily reminder time formatted as 'HH:MM AM/PM' (e.g. '08:30 AM') or null if disabled */
  reminderTime: string | null;
  
  /** Timestamp when the habit was created (ISO format) */
  createdAt: string;
  
  /** Current active streak count of consecutive completions */
  streak: number;
  
  /** List of completion dates stored as 'YYYY-MM-DD' strings */
  completions: string[];
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
