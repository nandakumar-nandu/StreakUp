import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  generateWeeklyInsight, 
  generateStreakMessage, 
  askCoachQuestion 
} from '@/lib/aiCoach';
import { HabitStats } from '@/types';

const MAX_DAILY_REQUESTS = 10;

const getTodayString = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Custom hook to manage interaction state, caching, and rate limits for the AI Habit Coach.
 */
export function useAICoach() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Enforces and increments the daily AI request rate limit (max 10 calls per day).
   * Persists limits locally in AsyncStorage.
   * 
   * @returns Boolean indicating whether the request is allowed.
   */
  const checkAndIncrementRateLimit = useCallback(async (): Promise<boolean> => {
    try {
      const todayStr = getTodayString();
      const cachedDate = await AsyncStorage.getItem('streakup_ai_requests_date');
      const countStr = await AsyncStorage.getItem('streakup_ai_requests_count');
      
      let count = countStr ? parseInt(countStr, 10) : 0;

      if (cachedDate !== todayStr) {
        // New day: reset limit trackers
        count = 0;
        await AsyncStorage.setItem('streakup_ai_requests_date', todayStr);
      }

      if (count >= MAX_DAILY_REQUESTS) {
        return false; // Limit exceeded
      }

      // Increment and save
      await AsyncStorage.setItem('streakup_ai_requests_count', String(count + 1));
      return true;
    } catch (e) {
      console.warn("Failed to check AI rate limits:", e);
      return true; // Bypass on storage read failure so app doesn't brick
    }
  }, []);

  /**
   * Resets the daily AI request rate limit count for testing/debugging.
   */
  const resetRateLimit = useCallback(async (): Promise<void> => {
    await AsyncStorage.setItem('streakup_ai_requests_count', '0');
  }, []);

  /**
   * Submits a question to the AI Coach chatbot.
   * Increments the user's daily request count.
   * 
   * @param question - User's chat input question.
   * @param statsContext - Text string describing user's active habits context.
   * @returns The AI Coach response text.
   */
  const askCoach = useCallback(async (question: string, statsContext: string): Promise<string> => {
    setLoading(true);
    setError(null);
    try {
      const allowed = await checkAndIncrementRateLimit();
      if (!allowed) {
        throw new Error("Daily AI request limit reached. Try again tomorrow!");
      }

      const response = await askCoachQuestion(question, statsContext);
      return response;
    } catch (err: any) {
      const errMsg = err.message || "Could not reach the Coach. Check your network connection.";
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  }, [checkAndIncrementRateLimit]);

  /**
   * Generates a weekly performance insight, caching the result daily to prevent redundant API calls.
   * 
   * ON-DEVICE CACHING ACTION:
   * 1. Inspects if a cached insight exists under the key `streakup_ai_weekly_insight_{YYYY-MM-DD}`.
   * 2. If present, returns it immediately, bypassing network calls and cost.
   * 3. If missing, requests OpenAI, writes the response to cache, and returns.
   * 
   * @param stats - User's current HabitStats.
   * @returns The AI Insight text.
   */
  const getWeeklyInsight = useCallback(async (stats: HabitStats): Promise<string> => {
    const todayStr = getTodayString();
    const cacheKey = `streakup_ai_weekly_insight_${todayStr}`;

    try {
      // Check cache first
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) return cached;

      const allowed = await checkAndIncrementRateLimit();
      if (!allowed) {
        // Fallback directly without throwing so stats screen still displays something
        return `Your current streak of ${stats.activeStreakCount} is a solid foundation! Focus on completing just one core habit today to keep your momentum climbing.`;
      }

      const freshInsight = await generateWeeklyInsight(stats);
      // Save in cache
      await AsyncStorage.setItem(cacheKey, freshInsight);
      return freshInsight;
    } catch (e) {
      console.warn("Failed to get weekly insight:", e);
      return `Your current streak of ${stats.activeStreakCount} is a solid foundation! Focus on completing just one core habit today to keep your momentum climbing.`;
    }
  }, [checkAndIncrementRateLimit]);

  /**
   * Generates a milestone celebratory quote for a habit.
   * Does not run under daily limit counters since milestone alerts are low-frequency triggers.
   */
  const getStreakMilestoneMessage = useCallback(async (habitName: string, streak: number): Promise<string> => {
    try {
      return await generateStreakMessage(habitName, streak);
    } catch (e) {
      return `Incredible work! Reaching a ${streak}-day streak on "${habitName}" proves your commitment is solid. Keep building that momentum!`;
    }
  }, []);

  return {
    loading,
    error,
    askCoach,
    getWeeklyInsight,
    getStreakMilestoneMessage,
    resetRateLimit
  };
}
