import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { subscribeToHabits } from '@/lib/habitsService';
import { Habit } from '@/types';

export interface UseStatsResult {
  loading: boolean;
  weeklyChartData: {
    labels: string[];
    datasets: { data: number[] }[];
  };
  topHabits: {
    id: string;
    name: string;
    emoji: string;
    color: string;
    completionRate: number;
  }[];
  streakLeaderboard: {
    id: string;
    name: string;
    emoji: string;
    color: string;
    streak: number;
  }[];
  totalCompletionsThisMonth: number;
  bestDayOfWeek: string;
  habits: Habit[];
}

/**
 * Custom React Hook to compute user habit statistics and insights in real-time from Firestore.
 * 
 * Logic Highlights:
 * 1. Subscribes to habits list in real-time. Whenever completions or habits change, re-computes all stats.
 * 2. Weekly summary chart: Computes percentage completion for each of the last 7 days.
 *    Only considers active habits on each target date (createdAt <= targetDate) to compute correct percentages.
 * 3. Top 3 Habits: Computes overall completion rate for each habit since its creation date.
 * 4. Leaderboard: Renders own habits ranked by current active streak count.
 * 5. Monthly total: Sums completions matching the current calendar YYYY-MM month string.
 * 6. Best Day: Identifies the weekday name where the historical completion logs count is highest.
 */
export function useStats(): UseStatsResult {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const unsubscribe = subscribeToHabits(user.uid, (loadedHabits) => {
      setHabits(loadedHabits);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  // Helper to format Date objects into local YYYY-MM-DD string
  const toLocalISOString = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Default return values if no data or user
  const emptyChartData = {
    labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    datasets: [{ data: [0, 0, 0, 0, 0, 0, 0] }]
  };

  if (!user || habits.length === 0) {
    return {
      loading,
      weeklyChartData: emptyChartData,
      topHabits: [],
      streakLeaderboard: [],
      totalCompletionsThisMonth: 0,
      bestDayOfWeek: 'None',
      habits: []
    };
  }

  // =========================================================================
  // 1. Calculate Last 7 Days Completion Data
  // =========================================================================
  const last7Days: Date[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    last7Days.push(d);
  }

  const weeklyLabels = last7Days.map(date => {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  });

  const weeklyData = last7Days.map(date => {
    const dateStr = toLocalISOString(date);
    
    // Denominator: count habits that were created on or before this day
    const activeHabits = habits.filter(habit => {
      // Direct string comparison works since ISO dates match lexicographically
      const createdStr = habit.createdAt.split('T')[0];
      return createdStr <= dateStr;
    });

    if (activeHabits.length === 0) return 0;

    // Numerator: count habits completed on this day
    const completedCount = activeHabits.filter(habit => {
      const completionsList = habit.completions || [];
      return completionsList.includes(dateStr);
    }).length;

    // Calculate percentage and round to nearest whole number
    return Math.round((completedCount / activeHabits.length) * 100);
  });

  const weeklyChartData = {
    labels: weeklyLabels,
    datasets: [{ data: weeklyData }]
  };

  // =========================================================================
  // 2. Calculate Top 3 Habits by Completion Rate
  // =========================================================================
  const today = new Date();
  const habitCompletionsList = habits.map(habit => {
    const completionsCount = habit.completions ? habit.completions.length : 0;
    
    // Calculate days since creation
    const createdDate = new Date(habit.createdAt);
    const diffTime = Math.abs(today.getTime() - createdDate.getTime());
    // Ensure active days is at least 1 to avoid division by zero
    const activeDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    
    const overallRate = (completionsCount / activeDays) * 100;
    const roundedRate = Math.round(overallRate * 10) / 10; // Round to 1 decimal place

    return {
      id: habit.id,
      name: habit.name,
      emoji: habit.emoji,
      color: habit.color,
      completionRate: roundedRate
    };
  });

  // Sort by rate descending and take top 3
  const topHabits = [...habitCompletionsList]
    .sort((a, b) => b.completionRate - a.completionRate)
    .slice(0, 3);

  // =========================================================================
  // 3. Calculate Active Streaks Leaderboard
  // =========================================================================
  const streakLeaderboard = habits
    .map(habit => ({
      id: habit.id,
      name: habit.name,
      emoji: habit.emoji,
      color: habit.color,
      streak: habit.streak || 0
    }))
    .sort((a, b) => b.streak - a.streak);

  // =========================================================================
  // 4. Calculate Total Completions This Month
  // =========================================================================
  const currentMonthPrefix = toLocalISOString(today).substring(0, 7); // e.g. "2026-07"
  let totalCompletionsThisMonth = 0;

  habits.forEach(habit => {
    const completionsList = habit.completions || [];
    const monthlyCompletions = completionsList.filter(dateStr => 
      dateStr.startsWith(currentMonthPrefix)
    );
    totalCompletionsThisMonth += monthlyCompletions.length;
  });

  // =========================================================================
  // 5. Calculate Best Day of Week
  // =========================================================================
  // Tally arrays: index 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const weekdayTally = Array(7).fill(0);
  let totalLogs = 0;

  habits.forEach(habit => {
    const completionsList = habit.completions || [];
    completionsList.forEach(dateStr => {
      const [year, month, day] = dateStr.split('-').map(Number);
      const d = new Date(year, month - 1, day);
      if (!isNaN(d.getTime())) {
        const dayOfWeek = d.getDay();
        weekdayTally[dayOfWeek]++;
        totalLogs++;
      }
    });
  });

  let bestDayOfWeek = 'None';
  if (totalLogs > 0) {
    let maxCount = -1;
    let bestDayIndex = -1;
    
    // Find the day of week with the maximum completions count
    for (let i = 0; i < 7; i++) {
      if (weekdayTally[i] > maxCount) {
        maxCount = weekdayTally[i];
        bestDayIndex = i;
      }
    }

    const weekdays = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday'
    ];
    bestDayOfWeek = weekdays[bestDayIndex];
  }

  return {
    loading,
    weeklyChartData,
    topHabits,
    streakLeaderboard,
    totalCompletionsThisMonth,
    bestDayOfWeek,
    habits
  };
}
