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

/**
 * Represents a pending, accepted, or declined friend request between two users.
 */
export interface FriendRequest {
  /** Unique request document ID (usually fromUid_toUid) */
  id: string;
  
  /** UID of the user who initiated the request */
  fromUid: string;
  
  /** Email of the sender (cached for easy UI rendering) */
  fromEmail?: string;
  
  /** Display name of the sender (cached for easy UI rendering) */
  fromDisplayName?: string;
  
  /** UID of the targeted recipient */
  toUid: string;
  
  /** Email of the targeted recipient (cached for easy UI rendering) */
  toEmail?: string;
  
  /** Request resolution status */
  status: 'pending' | 'accepted' | 'declined';
  
  /** Timestamp when the request was sent (ISO format) */
  createdAt: string;
}

/**
 * Represents a user's friend connection record.
 */
export interface Friend {
  /** Friend's unique user ID */
  uid: string;
  
  /** Friend's registration email address */
  email: string | null;
  
  /** Friend's display name */
  displayName: string | null;
  
  /** Friend's profile image or avatar url */
  avatarUrl: string | null;
  
  /** Timestamp when the friendship was accepted (ISO format) */
  joinedAt: string;
  
  /** Friend's current active global streak (cached for list rendering) */
  currentStreak?: number;
  
  /** Number of mutual habits both users track */
  mutualHabitsCount?: number;
}

/**
 * Represents a habit shared with other users or marked as public.
 */
export interface SharedHabit {
  /** Unique ID of the underlying habit */
  habitId: string;
  
  /** UID of the habit owner */
  ownerId: string;
  
  /** Owner's display name cached for rendering */
  ownerName: string;
  
  /** Visual name of the habit */
  name: string;
  
  /** Selected icon emoji */
  emoji: string;
  
  /** Accent color hex code */
  color: string;
  
  /** Active consecutive streak count */
  streak: number;
  
  /** List of completion dates ('YYYY-MM-DD') */
  completions: string[];
  
  /** List of friend UIDs this habit is explicitly shared with */
  sharedWith: string[];
  
  /** Visibility tier: true if visible globally, false if private or friends-only */
  isPublic: boolean;
}

/**
 * Represents a ranked row entry in the habit leaderboard.
 */
export interface LeaderboardEntry {
  /** Unique ID of the ranked user */
  uid: string;
  
  /** Display name of the ranked user */
  displayName: string | null;
  
  /** User's avatar URL */
  avatarUrl: string | null;
  
  /** Habit name being compared (e.g. "Meditation") */
  habitName: string;
  
  /** User's current streak on this habit */
  currentStreak: number;
  
  /** User's overall completion percentage consistency */
  completionRate: number;
}

/**
 * Represents a streak challenge duel between two friends.
 */
export interface Challenge {
  /** Unique challenge document ID */
  id: string;
  
  /** UID of the creator who sent the challenge */
  creatorId: string;
  
  /** Creator's display name */
  creatorName: string;
  
  /** UID of the opponent challenged */
  opponentId: string;
  
  /** Opponent's display name */
  opponentName: string;
  
  /** Shared habit name being tracked in the duel */
  habitName: string;
  
  /** Target duration of the duel in days: 7, 14, or 30 days */
  durationDays: 7 | 14 | 30;
  
  /** Timestamp when the challenge active tracking begins (ISO YYYY-MM-DD format) */
  startDate: string;
  
  /** Challenge state */
  status: 'invited' | 'active' | 'completed' | 'declined';
  
  /** Timestamp when the challenge was proposed */
  createdAt: string;
  
  /** Array of completion date strings ('YYYY-MM-DD') recorded by the creator during the duel */
  creatorCompletions: string[];
  
  /** Array of completion date strings ('YYYY-MM-DD') recorded by the opponent during the duel */
  opponentCompletions: string[];
  
  /** Winner's UID, 'tie' if tied, or null if ongoing */
  winnerId: string | null;
}

