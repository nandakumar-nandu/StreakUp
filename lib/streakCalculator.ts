/**
 * Habit Streak and Completion Rate Calculator Utilities
 * 
 * Provides utility functions to calculate current streaks, longest streaks, and completion rates
 * based on an array of habit completion dates formatted as 'YYYY-MM-DD'.
 */

/**
 * Calculates the current consecutive completion streak for a habit.
 * 
 * Step-by-Step Algorithm:
 * 1. Filter unique dates (in case duplicates exist) and sort them in descending order (newest date first).
 *    This aligns our search from the most recent completions backward.
 * 2. Calculate local formatted date strings for "today" and "yesterday" relative to local timezone.
 * 3. Inspect the most recent completion (the first element in our sorted array):
 *    - If the most recent completion is neither today nor yesterday, the user did not complete the habit
 *      yesterday or today. Therefore, the active streak is broken and we immediately return 0.
 * 4. Initialize a streak counter to 0.
 * 5. Initialize a tracker date object set to the date of the most recent completion.
 * 6. Start an infinite loop to track backwards day-by-day:
 *    - Generate the YYYY-MM-DD date string for the tracker date.
 *    - Check if this date string is present in our completions set.
 *    - If YES:
 *      - We increment our streak counter by 1.
 *      - We subtract exactly 1 day from our tracker date to look at the previous calendar day.
 *    - If NO:
 *      - The consecutive streak chain is broken! We exit the loop.
 * 7. Return the final streak count.
 * 
 * @param completions - Array of completion date strings in 'YYYY-MM-DD' format.
 * @returns The number of consecutive days in the current active streak.
 */
export function calculateCurrentStreak(completions: string[]): number {
  if (!completions || completions.length === 0) return 0;

  // Step 1: Remove duplicates and sort descending (newest dates first)
  const uniqueDates = Array.from(new Set(completions)).sort((a, b) => b.localeCompare(a));

  // Helper function to format Date object into local YYYY-MM-DD string
  const toLocalISOString = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Step 2: Get today's and yesterday's date strings
  const today = new Date();
  const todayStr = toLocalISOString(today);

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = toLocalISOString(yesterday);

  const mostRecent = uniqueDates[0];

  // Step 3: If the most recent completion is prior to yesterday, streak is dead
  if (mostRecent !== todayStr && mostRecent !== yesterdayStr) {
    return 0;
  }

  // Step 4 & 5: Initialize counter and tracker date
  let streak = 0;
  const currentTracker = new Date(mostRecent);
  const completionSet = new Set(uniqueDates);

  // Step 6: Step backward day-by-day to count consecutive completed days
  while (true) {
    const dateStr = toLocalISOString(currentTracker);
    if (completionSet.has(dateStr)) {
      streak++;
      // Move tracker date back by 1 day
      currentTracker.setDate(currentTracker.getDate() - 1);
    } else {
      break;
    }
  }

  // Step 7: Return calculated streak
  return streak;
}

/**
 * Calculates the longest historic consecutive completion streak.
 * 
 * Step-by-Step Algorithm:
 * 1. Verify if completions is empty. If it is, return 0.
 * 2. Remove duplicates and sort dates in ascending chronological order (oldest date first).
 * 3. Initialize three variables:
 *    - `longestStreak` to store the maximum streak found so far (starts at 0).
 *    - `currentStreak` to keep track of the current active consecutive chain (starts at 0).
 *    - `prevDate` to hold the previous date in the loop (starts as null).
 * 4. Iterate through each date string in the sorted array:
 *    - Parse the date parts (year, month, day) and construct a local Date object.
 *      (We parse manually to prevent timezone offset issues that could occur with new Date("YYYY-MM-DD")).
 *    - If `prevDate` is null, this is the first completion in our history. Set `currentStreak` to 1.
 *    - If `prevDate` is NOT null, calculate the difference in calendar days between `currentDate` and `prevDate`:
 *      - Compare midnight timestamps to find exact day difference.
 *      - If the difference is exactly 1 day:
 *        - The chain is consecutive! Increment `currentStreak` by 1.
 *      - If the difference is greater than 1 day:
 *        - The consecutive streak was broken!
 *        - Record if the finished streak is our longest: `longestStreak = Math.max(longestStreak, currentStreak)`.
 *        - Reset `currentStreak` back to 1 (starting a new streak chain with the current date).
 *      - If the difference is 0 days:
 *        - This means duplicate entries on the same day (should be filtered out already, but we ignore it just in case).
 *    - Set `prevDate` to `currentDate` for comparison in the next iteration.
 * 5. After the loop ends, do one final update to cover the final active chain:
 *    `longestStreak = Math.max(longestStreak, currentStreak)`.
 * 6. Return `longestStreak`.
 * 
 * @param completions - Array of completion date strings in 'YYYY-MM-DD' format.
 * @returns The maximum consecutive days streak recorded.
 */
export function calculateLongestStreak(completions: string[]): number {
  if (!completions || completions.length === 0) return 0;

  // Step 2: Remove duplicates and sort ascending (oldest first)
  const uniqueSorted = Array.from(new Set(completions)).sort((a, b) => a.localeCompare(b));

  // Step 3: Initialize variables
  let longestStreak = 0;
  let currentStreak = 0;
  let prevDate: Date | null = null;

  // Step 4: Loop chronological completions
  for (const dateStr of uniqueSorted) {
    const [year, month, day] = dateStr.split('-').map(Number);
    const currentDate = new Date(year, month - 1, day); // month parameter is 0-indexed

    if (prevDate === null) {
      currentStreak = 1;
    } else {
      // Midnight difference check
      const diffTime = Math.abs(currentDate.getTime() - prevDate.getTime());
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        currentStreak++;
      } else if (diffDays > 1) {
        longestStreak = Math.max(longestStreak, currentStreak);
        currentStreak = 1;
      }
    }
    prevDate = currentDate;
  }

  // Step 5: Final update
  longestStreak = Math.max(longestStreak, currentStreak);

  // Step 6: Return result
  return longestStreak;
}

/**
 * Calculates the completion percentage rate for the last X days.
 * 
 * Step-by-Step Algorithm:
 * 1. Validate arguments. If completions list is empty or days count is invalid, return 0.
 * 2. Calculate the local date threshold string representing the date exactly X days ago.
 * 3. Calculate today's date string.
 * 4. Initialize a count of completions within the range.
 * 5. Loop through the unique list of completion dates:
 *    - If a date is greater than or equal to the threshold string, and less than or equal to today,
 *      increment our count.
 * 6. Calculate the percentage: `rate = (count / days) * 100`.
 * 7. Round the result to 1 decimal place (e.g. 83.3).
 * 8. Return the percentage.
 * 
 * @param completions - Array of completion date strings in 'YYYY-MM-DD' format.
 * @param days - The number of days window to check (e.g., 30 days).
 * @returns The percentage of days completed, rounded to 1 decimal place.
 */
export function getCompletionRate(completions: string[], days: number): number {
  if (!completions || completions.length === 0 || days <= 0) return 0;

  const toLocalISOString = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = toLocalISOString(new Date());

  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - days + 1);
  const thresholdStr = toLocalISOString(thresholdDate);

  const uniqueCompletions = new Set(completions);
  let count = 0;

  for (const dateStr of uniqueCompletions) {
    if (dateStr >= thresholdStr && dateStr <= todayStr) {
      count++;
    }
  }

  const rate = (count / days) * 100;
  return Math.round(rate * 10) / 10;
}
