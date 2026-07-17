import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Habit } from '@/types';

/**
 * Parses a habit's reminder time string ("HH:MM AM/PM") into 24-hour hour and minute.
 * 
 * @param timeStr - The time string (e.g. "08:30 AM" or "10:15 PM")
 */
export function parseReminderTime(timeStr: string): { hour: number; minute: number } {
  const [time, modifier] = timeStr.split(' ');
  let [hoursStr, minutesStr] = time.split(':');
  let hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);

  if (modifier === 'PM' && hours < 12) {
    hours += 12;
  }
  if (modifier === 'AM' && hours === 12) {
    hours = 0;
  }

  return { hour: hours, minute: minutes };
}

/**
 * Requests push notification permissions from the OS.
 * 
 * @returns A boolean indicating whether the permission was granted.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF4757',
    });
  }

  const isGranted = finalStatus === 'granted';
  // Keep local permission status cached in AsyncStorage for settings dashboard queries
  await AsyncStorage.setItem('streakup_notification_permission', isGranted ? 'granted' : 'denied');
  return isGranted;
}

/**
 * Query active notification permission status from the OS.
 */
export async function checkNotificationPermissionStatus(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

/**
 * Schedules a daily push notification reminder for a single habit.
 * 
 * EXPO'S TRIGGER SYSTEM DESIGN:
 * Expo utilizes calendar-based triggers for recurring scheduling. By passing an object like:
 * `{ hour: H, minute: M, repeats: true }` to scheduleNotificationAsync, Expo registers a local alarm trigger
 * with the native operating system alarm scheduler:
 * - On iOS, it maps to `UNCalendarNotificationTrigger` matching specific date components (hour and minute).
 * - On Android, it maps to an exact repeating alarm registered via `AlarmManager`.
 * This setup ensures notifications are scheduled locally on the device and will fire reliably even 
 * when the app is completely closed or running offline, consuming zero network bandwidth or background API requests.
 * 
 * @param habitId - The unique ID of the habit.
 * @param habitName - Visual name of the habit.
 * @param emoji - Habit category emoji icon.
 * @param reminderTime - Target time formatted as "HH:MM AM/PM".
 * @returns A promise resolving to the string identifier of the scheduled notification.
 */
export async function scheduleHabitReminder(
  habitId: string,
  habitName: string,
  emoji: string,
  reminderTime: string
): Promise<string> {
  const { hour, minute } = parseReminderTime(reminderTime);

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: `${emoji} Time for ${habitName}!`,
      body: `Don't forget to keep your streak burning today!`,
      data: { habitId, type: 'daily_reminder' },
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour,
      minute,
      repeats: true, // Daily repeating trigger
    },
  });

  return identifier;
}

/**
 * Cancel a scheduled local notification.
 * 
 * @param identifier - The string identifier returned by scheduleNotificationAsync.
 */
export async function cancelNotification(identifier: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch (error) {
    console.error(`Error cancelling notification ${identifier}:`, error);
  }
}

/**
 * Synchronizes local scheduled reminders and "Streak at risk" warnings in real-time.
 * Saves/cancels triggers depending on user settings, active streaks, and daily completion logs.
 * 
 * ALGORITHM FOR "STREAK AT RISK":
 * 1. An alert must fire at 8 PM if a habit with a streak > 3 is not completed today.
 * 2. If completed today, we immediately cancel any scheduled 8 PM warning.
 * 3. We use AsyncStorage to track scheduled notifications locally to prevent scheduling duplicate alarms.
 * 
 * @param uid - Authenticated user's unique ID.
 * @param habits - List of user's habits from Firestore.
 * @param completedIds - List of completed habit IDs for today.
 */
export async function syncNotifications(
  uid: string,
  habits: Habit[],
  completedIds: string[]
): Promise<void> {
  const isGranted = await checkNotificationPermissionStatus();
  if (!isGranted) return; // Silent return if permissions are missing

  // Read the global notifications master switch status (stored locally)
  const masterSwitch = await AsyncStorage.getItem('streakup_notifications_master');
  const isMasterOn = masterSwitch !== 'false'; // Defaults to true

  // Read disabled habit IDs map from AsyncStorage (e.g. { habitId: true })
  const disabledHabitsRaw = await AsyncStorage.getItem('streakup_disabled_habit_notifications');
  const disabledHabitsMap = disabledHabitsRaw ? JSON.parse(disabledHabitsRaw) : {};

  // Read currently active scheduled notification IDs to track what is active
  const scheduledMapRaw = await AsyncStorage.getItem('streakup_scheduled_notifications_map');
  const scheduledMap: { [key: string]: string } = scheduledMapRaw ? JSON.parse(scheduledMapRaw) : {};

  // Helper to store updated scheduled ID mappings
  const saveScheduledMap = async (map: typeof scheduledMap) => {
    await AsyncStorage.setItem('streakup_scheduled_notifications_map', JSON.stringify(map));
  };

  for (const habit of habits) {
    const isHabitNotificationEnabled = isMasterOn && !disabledHabitsMap[habit.id];

    // =========================================================================
    // 1. Sync Daily Habit Reminder
    // =========================================================================
    const reminderKey = `reminder_${habit.id}`;
    
    if (isHabitNotificationEnabled && habit.reminderTime) {
      // If notifications are active but not scheduled yet, schedule now
      if (!scheduledMap[reminderKey]) {
        try {
          const scheduleId = await scheduleHabitReminder(
            habit.id,
            habit.name,
            habit.emoji,
            habit.reminderTime
          );
          scheduledMap[reminderKey] = scheduleId;
          await saveScheduledMap(scheduledMap);
        } catch (e) {
          console.error(`Failed to schedule reminder for habit ${habit.id}:`, e);
        }
      }
    } else {
      // If notifications should be disabled but an active alarm exists, cancel it
      if (scheduledMap[reminderKey]) {
        await cancelNotification(scheduledMap[reminderKey]);
        delete scheduledMap[reminderKey];
        await saveScheduledMap(scheduledMap);
      }
    }

    // =========================================================================
    // 2. Sync "Streak at Risk" Warning (fires daily at 8 PM / 20:00)
    // =========================================================================
    const riskKey = `risk_${habit.id}`;
    const hasRiskStreak = habit.streak > 3;
    const isCompletedToday = completedIds.includes(habit.id);

    // Alert conditions: notifications enabled globally/individually, streak > 3, and NOT completed today
    const shouldWarnToday = isHabitNotificationEnabled && hasRiskStreak && !isCompletedToday;

    if (shouldWarnToday) {
      if (!scheduledMap[riskKey]) {
        try {
          // Schedule daily alarm at 8:00 PM (20:00)
          // Expo calendar trigger mapping:
          const identifier = await Notifications.scheduleNotificationAsync({
            content: {
              title: `🔥 Streak at risk!`,
              body: `Don't break your ${habit.streak}-day streak on "${habit.name}"! Complete it before midnight.`,
              data: { habitId: habit.id, type: 'streak_risk' },
              sound: true,
              priority: Notifications.AndroidNotificationPriority.MAX,
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
              hour: 20,
              minute: 0,
              repeats: true,
            },
          });
          scheduledMap[riskKey] = identifier;
          await saveScheduledMap(scheduledMap);
        } catch (e) {
          console.error(`Failed to schedule risk warning for habit ${habit.id}:`, e);
        }
      }
    } else {
      // If completed today or streak is no longer > 3, cancel active warning
      if (scheduledMap[riskKey]) {
        await cancelNotification(scheduledMap[riskKey]);
        delete scheduledMap[riskKey];
        await saveScheduledMap(scheduledMap);
      }
    }
  }
}
