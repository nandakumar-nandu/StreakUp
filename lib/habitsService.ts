/**
 * StreakUp Cloud Firestore CRUD Services
 * 
 * Manages all database synchronization for Habits and daily Completion logs.
 * 
 * ============================================================================
 * FIRESTORE DATA STRUCTURE & DESIGN RATIONALE
 * ============================================================================
 * 
 * 📁 Path 1: users/{uid}/habits/{habitId} (Habit Definition Documents)
 *    Contains name, emoji, color accent, frequency, reminder time, active streak count,
 *    and a cached completions array for quick history rendering on the Habits tab.
 * 
 * 📁 Path 2: users/{uid}/completions/{date}/habits/{habitId} (Daily Log Audit Trail)
 *    Stores a document for each habit completed on a specific YYYY-MM-DD date.
 * 
 * 🧠 Why this structure enables efficient streak calculation:
 * 1. TODAY CHECKS: The Today screen only needs to listen to today's date document subcollection 
 *    (users/{uid}/completions/{todayDate}/habits) to identify completed tasks. This consumes 
 *    only 1 read connection per task, rather than loading a massive history array of all habits.
 * 2. NO BLOCKING LIMITS: Storing completions as sub-documents prevents the habit definition 
 *    document from exceeding Firestore's 1MB document size limit, which would happen if we 
 *    stored years of daily completions inside a single array.
 * 3. INSTANT CARD rendering: We denormalize and cache the active 'streak' counter and a recent
 *    list of completions inside the main habit document. This allows cards to display the 
 *    fire emoji (🔥 12) instantly on load without running queries across hundreds of completion logs.
 */

import { 
  db 
} from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  updateDoc, 
  query, 
  orderBy,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { Habit } from '@/types';
import { calculateCurrentStreak } from './streakCalculator';

/**
 * Subscribe to real-time updates for a user's habits list.
 * 
 * @param uid - The authenticated user's unique ID.
 * @param callback - Function triggered when the habits collection changes.
 * @returns An unsubscribe function to clean up the listener.
 */
export function subscribeToHabits(uid: string, callback: (habits: Habit[]) => void): () => void {
  const habitsRef = collection(db, 'users', uid, 'habits');
  const q = query(habitsRef, orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const habits: Habit[] = [];
    snapshot.forEach((docSnap) => {
      habits.push(docSnap.data() as Habit);
    });
    callback(habits);
  }, (error) => {
    console.error("Error subscribing to habits: ", error);
  });
}

/**
 * Subscribe to completions for a specific date (YYYY-MM-DD).
 * 
 * @param uid - The authenticated user's unique ID.
 * @param date - The target date formatted as YYYY-MM-DD.
 * @param callback - Triggered with an array of completed habit IDs for the date.
 * @returns An unsubscribe function to clean up the listener.
 */
export function subscribeToCompletions(
  uid: string, 
  date: string, 
  callback: (completedIds: string[]) => void
): () => void {
  // Path: users/{uid}/completions/{date}/habits
  const completionsRef = collection(db, 'users', uid, 'completions', date, 'habits');
  
  return onSnapshot(completionsRef, (snapshot) => {
    const completedIds: string[] = [];
    snapshot.forEach((docSnap) => {
      completedIds.push(docSnap.id);
    });
    callback(completedIds);
  }, (error) => {
    console.error(`Error subscribing to completions for ${date}: `, error);
  });
}

/**
 * Create a new habit document in Firestore.
 * 
 * @param uid - The authenticated user's unique ID.
 * @param habitData - The habit parameters configured by the user.
 * @returns A promise resolving when the write succeeds.
 */
export async function createHabit(
  uid: string, 
  habitData: Omit<Habit, 'id' | 'createdAt' | 'streak' | 'completions'>
): Promise<void> {
  const habitId = doc(collection(db, 'users', uid, 'habits')).id;
  const habitRef = doc(db, 'users', uid, 'habits', habitId);
  
  const newHabit: Habit = {
    ...habitData,
    id: habitId,
    createdAt: new Date().toISOString(),
    streak: 0,
    completions: []
  };

  return setDoc(habitRef, newHabit);
}

/**
 * Subscribe to real-time updates for a single habit document.
 * 
 * @param uid - The authenticated user's unique ID.
 * @param habitId - The ID of the habit to retrieve.
 * @param callback - Function triggered when the habit document changes.
 * @returns An unsubscribe function to clean up the listener.
 */
export function subscribeToHabit(
  uid: string, 
  habitId: string, 
  callback: (habit: Habit | null) => void
): () => void {
  const habitRef = doc(db, 'users', uid, 'habits', habitId);
  
  return onSnapshot(habitRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data() as Habit);
    } else {
      callback(null);
    }
  }, (error) => {
    console.error(`Error subscribing to habit ${habitId}: `, error);
  });
}

/**
 * Toggle completion of a habit for a given date.
 * Writes a log entry in completions and updates cached streaks/completions on the habit.
 * Calculates the current active streak dynamically based on the updated completions array.
 * 
 * @param uid - The authenticated user's unique ID.
 * @param habitId - The target habit ID.
 * @param date - The target date (YYYY-MM-DD).
 * @param isCompleted - True to complete, false to uncomplete.
 * @param currentCompletions - The array of current completion dates.
 */
export async function toggleHabitCompletion(
  uid: string,
  habitId: string,
  date: string,
  isCompleted: boolean,
  currentCompletions: string[]
): Promise<void> {
  const completionDocRef = doc(db, 'users', uid, 'completions', date, 'habits', habitId);
  const habitDocRef = doc(db, 'users', uid, 'habits', habitId);

  let newCompletions = [...currentCompletions];

  if (isCompleted) {
    // 1. Write the daily audit log document
    await setDoc(completionDocRef, { completedAt: new Date().toISOString() });
    
    // Add date to our temporary array if not already present
    if (!newCompletions.includes(date)) {
      newCompletions.push(date);
    }
  } else {
    // 1. Delete the daily audit log document
    await deleteDoc(completionDocRef);
    
    // Remove date from our temporary array
    newCompletions = newCompletions.filter(d => d !== date);
  }

  // 2. Calculate the updated active streak dynamically
  const updatedStreak = calculateCurrentStreak(newCompletions);

  // 3. Update the habit document with the calculated streak and completions array
  await updateDoc(habitDocRef, {
    streak: updatedStreak,
    completions: newCompletions
  });
}

/**
 * Delete a habit and its configurations.
 * 
 * @param uid - The authenticated user's unique ID.
 * @param habitId - The ID of the habit to delete.
 */
export async function deleteHabit(uid: string, habitId: string): Promise<void> {
  const habitDocRef = doc(db, 'users', uid, 'habits', habitId);
  return deleteDoc(habitDocRef);
}
