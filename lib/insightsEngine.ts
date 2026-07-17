import { Habit } from '@/types';

/**
 * Smart Insights Engine
 * 
 * Computes localized analytical metrics from user habits and completions history.
 * Runs completely locally on-device without any cloud processing costs.
 */

/**
 * Determines the user's most productive time of day based on completion timestamps.
 * 
 * Algorithm:
 * 1. Filter timestamps, converting ISO strings into local date hour digits (0-23).
 * 2. Bucket hours into intervals:
 *    - Morning: 5:00 AM - 11:59 AM
 *    - Afternoon: 12:00 PM - 4:59 PM
 *    - Evening: 5:00 PM - 8:59 PM
 *    - Night: 9:00 PM - 4:59 AM
 * 3. Count frequencies per bucket and identify the max bucket.
 * 4. Return description string.
 * 
 * @param completedAtTimestamps - ISO timestamps list when completions were registered.
 */
export function getBestTimeOfDay(completedAtTimestamps: string[]): string {
  if (!completedAtTimestamps || completedAtTimestamps.length === 0) {
    return "No completions recorded yet to analyze timing.";
  }

  const buckets = {
    Morning: 0,
    Afternoon: 0,
    Evening: 0,
    Night: 0
  };

  completedAtTimestamps.forEach(ts => {
    try {
      const hour = new Date(ts).getHours();
      if (hour >= 5 && hour < 12) buckets.Morning++;
      else if (hour >= 12 && hour < 17) buckets.Afternoon++;
      else if (hour >= 17 && hour < 21) buckets.Evening++;
      else buckets.Night++;
    } catch (e) {
      console.warn("Failed to parse completion timestamp:", e);
    }
  });

  const maxVal = Math.max(buckets.Morning, buckets.Afternoon, buckets.Evening, buckets.Night);
  if (maxVal === 0) return "Completions recorded, but timestamps are missing.";

  if (buckets.Morning === maxVal) return "Morning (before 12pm)";
  if (buckets.Afternoon === maxVal) return "Afternoon (12pm - 5pm)";
  if (buckets.Evening === maxVal) return "Evening (5pm - 9pm)";
  return "Night (after 9pm)";
}

/**
 * Identifies active habits that are in jeopardy of breaking their streaks.
 * 
 * Algorithm:
 * 1. Read all active habits.
 * 2. Filter out habits where:
 *    - Active streak is greater than 5.
 *    - Today's date is NOT present in the completions checklist.
 * 3. Return filtered list.
 * 
 * @param habits - List of user's active habits.
 * @param completedTodayIds - List of habit IDs checked off today.
 */
export function getAtRiskHabits(habits: Habit[], completedTodayIds: string[]): Habit[] {
  return habits.filter(habit => {
    const hasStreak = habit.streak > 5;
    const completed = completedTodayIds.includes(habit.id);
    return hasStreak && !completed;
  });
}

/**
 * Calculates a rolling 7-day consistency momentum score (0-100).
 * 
 * Algorithm:
 * 1. Generate YYYY-MM-DD strings for the last 7 calendar days.
 * 2. Count the user's total completions that fall in these 7 dates across all habits.
 * 3. Calculate max potential completions: `habits.length * 7`.
 * 4. Momentum Score = `(Actual Completions / Max Potential) * 100`.
 * 
 * @param habits - User's active habits.
 */
export function getMomentumScore(habits: Habit[]): number {
  if (!habits || habits.length === 0) return 0;

  // Generate date strings for last 7 days
  const targetDates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    targetDates.push(`${year}-${month}-${day}`);
  }

  let totalCompletionsInWindow = 0;
  habits.forEach(habit => {
    const comps = habit.completions || [];
    comps.forEach(dateStr => {
      if (targetDates.includes(dateStr)) {
        totalCompletionsInWindow++;
      }
    });
  });

  const maxPossible = habits.length * 7;
  if (maxPossible === 0) return 0;

  return Math.round((totalCompletionsInWindow / maxPossible) * 100);
}

/**
 * Resolves the user's personal best (longest ever active streak).
 * 
 * @param habits - User's habits list.
 */
export function getPersonalBest(habits: Habit[]): { habitName: string; streak: number } | null {
  if (!habits || habits.length === 0) return null;

  let bestHabit: Habit | null = null;
  let maxStreak = -1;

  habits.forEach(habit => {
    if (habit.streak > maxStreak) {
      maxStreak = habit.streak;
      bestHabit = habit;
    }
  });

  if (!bestHabit) return null;

  return {
    habitName: (bestHabit as Habit).name,
    streak: maxStreak
  };
}
