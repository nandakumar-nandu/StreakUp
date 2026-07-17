import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  Switch,
  ActivityIndicator,
  Platform
} from 'react-native';
import { useColorScheme, useThemeOverride, ThemeType } from '@/hooks/useColorScheme';
import { colors, spacing, borderRadius, typography, shadows } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { subscribeToHabits, subscribeToCompletions } from '@/lib/habitsService';
import { Habit } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  requestNotificationPermissions, 
  checkNotificationPermissionStatus, 
  syncNotifications 
} from '@/lib/notificationsManager';

const getTodayString = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? colors.dark : colors.light;
  
  const { user, logout } = useAuth();
  const { themePreference, setThemePreference } = useThemeOverride();

  const [habits, setHabits] = useState<Habit[]>([]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Notifications State
  const [hasPermission, setHasPermission] = useState(false);
  const [permissionChecking, setPermissionChecking] = useState(true);
  const [isMasterEnabled, setIsMasterEnabled] = useState(true);
  const [disabledHabitsMap, setDisabledHabitsMap] = useState<{ [habitId: string]: boolean }>({});

  useEffect(() => {
    if (!user) return;

    setLoading(true);

    // Subscribe to habits list
    const unsubscribeHabits = subscribeToHabits(user.uid, (loadedHabits) => {
      setHabits(loadedHabits);
      setLoading(false);
    });

    // Subscribe to today's completions (needed for streak-at-risk scheduling sync)
    const todayStr = getTodayString();
    const unsubscribeCompletions = subscribeToCompletions(user.uid, todayStr, (ids) => {
      setCompletedIds(ids);
    });

    // Load initial notification settings
    const loadNotificationSettings = async () => {
      try {
        // Check OS permissions
        const permission = await checkNotificationPermissionStatus();
        setHasPermission(permission);

        // Load global master switch status
        const master = await AsyncStorage.getItem('streakup_notifications_master');
        setIsMasterEnabled(master !== 'false'); // defaults to true

        // Load disabled habit lists
        const disabled = await AsyncStorage.getItem('streakup_disabled_habit_notifications');
        if (disabled) {
          setDisabledHabitsMap(JSON.parse(disabled));
        }
      } catch (e) {
        console.error("Error loading notification settings:", e);
      } finally {
        setPermissionChecking(false);
      }
    };

    loadNotificationSettings();

    return () => {
      unsubscribeHabits();
      unsubscribeCompletions();
    };
  }, [user]);

  const handleGrantPermission = async () => {
    const granted = await requestNotificationPermissions();
    setHasPermission(granted);
  };

  const handleToggleMaster = async (value: boolean) => {
    setIsMasterEnabled(value);
    try {
      await AsyncStorage.setItem('streakup_notifications_master', value ? 'true' : 'false');
      // Sync notifications immediately in the background
      if (user) {
        // Wait briefly for AsyncStorage write to resolve before sync scans it
        setTimeout(() => {
          syncNotifications(user.uid, habits, completedIds);
        }, 100);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleHabitNotification = async (habitId: string, isMuted: boolean) => {
    const updatedMap = { ...disabledHabitsMap, [habitId]: isMuted };
    setDisabledHabitsMap(updatedMap);
    try {
      await AsyncStorage.setItem('streakup_disabled_habit_notifications', JSON.stringify(updatedMap));
      if (user) {
        setTimeout(() => {
          syncNotifications(user.uid, habits, completedIds);
        }, 100);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const themes: { value: ThemeType; label: string; icon: string }[] = [
    { value: 'system', label: 'System', icon: 'options-outline' },
    { value: 'light', label: 'Light', icon: 'sunny-outline' },
    { value: 'dark', label: 'Dark', icon: 'moon-outline' },
  ];

  if (loading || permissionChecking) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingCenter, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={colorScheme === 'dark' ? colors.primary.dark : colors.primary.light} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card Header */}
        {user && (
          <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border, ...shadows.sm }]}>
            <View style={styles.profileHeader}>
              <View style={[styles.profileAvatar, { backgroundColor: colors.primary.light }]}>
                <Text style={styles.avatarInitial}>
                  {(user.displayName || user.email || 'S').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: themeColors.text }]}>
                  {user.displayName || 'StreakUp User'}
                </Text>
                <Text style={[styles.profileEmail, { color: themeColors.textMuted }]}>
                  {user.email}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Persisted Dark Mode / Theme Selector Section */}
        <Text style={[styles.sectionTitle, { color: themeColors.textMuted }]}>THEME PREFERENCE</Text>
        <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border, ...shadows.sm }]}>
          <View style={styles.themeSelector}>
            {themes.map((themeOption) => {
              const isActive = themePreference === themeOption.value;
              const buttonBg = isActive 
                ? (colorScheme === 'dark' ? colors.primary.dark : colors.primary.light)
                : 'transparent';
              const buttonText = isActive ? '#FFFFFF' : themeColors.text;

              return (
                <TouchableOpacity
                  key={themeOption.value}
                  activeOpacity={0.8}
                  style={[styles.themeBtn, { backgroundColor: buttonBg }]}
                  onPress={() => setThemePreference(themeOption.value)}
                >
                  <Ionicons name={themeOption.icon as any} size={18} color={buttonText} style={{ marginRight: 6 }} />
                  <Text style={[styles.themeBtnText, { color: buttonText }]}>
                    {themeOption.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Notifications Configuration Section */}
        <Text style={[styles.sectionTitle, { color: themeColors.textMuted }]}>PUSH NOTIFICATIONS</Text>
        
        {!hasPermission ? (
          /* Permission Request Explanation Card */
          <View style={[styles.card, styles.permissionCard, { borderColor: '#FFA502' }]}>
            <View style={styles.permissionHeaderRow}>
              <Ionicons name="notifications-circle-outline" size={32} color="#FFA502" />
              <View style={styles.permissionHeaderDetails}>
                <Text style={[styles.permissionTitle, { color: themeColors.text }]}>Enable Reminders</Text>
                <Text style={[styles.permissionText, { color: themeColors.textMuted }]}>
                  StreakUp needs permission to send daily reminders and alerts when your streaks are at risk.
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              style={[styles.permissionBtn, { backgroundColor: '#FFA502' }]}
              onPress={handleGrantPermission}
              activeOpacity={0.8}
            >
              <Text style={styles.permissionBtnText}>Grant Permission</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Notifications Control Dashboard */
          <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border, ...shadows.sm, paddingHorizontal: 0 }]}>
            {/* Global Master Switch */}
            <View style={[styles.switchRow, { borderBottomWidth: 1, borderBottomColor: themeColors.border, paddingHorizontal: spacing.lg }]}>
              <View style={styles.switchLabelArea}>
                <Ionicons name="notifications-outline" size={20} color={themeColors.text} style={{ marginRight: spacing.md }} />
                <Text style={[styles.switchLabel, { color: themeColors.text }]}>Daily Reminders</Text>
              </View>
              <Switch
                value={isMasterEnabled}
                onValueChange={handleToggleMaster}
                trackColor={{ false: themeColors.border, true: colors.primary.light }}
                thumbColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
              />
            </View>

            {/* Individual Habit Reminders List (only active when master notification is on) */}
            {isMasterEnabled && (
              <View style={styles.habitsRemindersSection}>
                <Text style={[styles.subSectionTitle, { color: themeColors.textMuted }]}>
                  HABIT REMINDERS
                </Text>
                {habits.length === 0 ? (
                  <Text style={[styles.noHabitsText, { color: themeColors.textMuted }]}>
                    No habits set. Add habits on the Habits tab to schedule reminders.
                  </Text>
                ) : (
                  habits.map((habit) => {
                    const isMuted = disabledHabitsMap[habit.id] || false;
                    const isEnabled = !isMuted;
                    
                    return (
                      <View 
                        key={habit.id} 
                        style={[styles.habitReminderRow, { borderBottomColor: themeColors.border }]}
                      >
                        <View style={styles.habitMeta}>
                          <Text style={styles.habitEmoji}>{habit.emoji}</Text>
                          <View style={styles.habitDetails}>
                            <Text style={[styles.habitName, { color: themeColors.text }]} numberOfLines={1}>
                              {habit.name}
                            </Text>
                            <Text style={[styles.habitTime, { color: themeColors.textMuted }]}>
                              {habit.reminderTime ? `At ${habit.reminderTime}` : 'No reminder set'}
                            </Text>
                          </View>
                        </View>
                        <Switch
                          value={isEnabled}
                          disabled={!habit.reminderTime}
                          onValueChange={(val) => handleToggleHabitNotification(habit.id, !val)}
                          trackColor={{ false: themeColors.border, true: habit.color }}
                          thumbColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
                        />
                      </View>
                    );
                  })
                )}
              </View>
            )}
          </View>
        )}

        {/* Account Settings Section */}
        <Text style={[styles.sectionTitle, { color: themeColors.textMuted }]}>ACCOUNT</Text>
        <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border, ...shadows.sm, paddingHorizontal: 0 }]}>
          <TouchableOpacity 
            style={styles.logoutButtonRow}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={20} color="#FF4757" style={{ marginRight: spacing.md }} />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>

        {/* Version info footer */}
        <View style={styles.versionFooter}>
          <Text style={[styles.versionText, { color: themeColors.textMuted }]}>
            ⚙️ StreakUp Version 0.7.0 (Notifications Integrated)
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingCenter: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.huge,
  },
  card: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: typography.sizes.caption,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginBottom: spacing.md,
  },
  themeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  themeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: borderRadius.sm,
    marginHorizontal: 4,
  },
  themeBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  permissionCard: {
    backgroundColor: 'rgba(255, 165, 2, 0.05)',
  },
  permissionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  permissionHeaderDetails: {
    flex: 1,
    marginLeft: spacing.md,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  permissionText: {
    fontSize: 13,
    lineHeight: 18,
  },
  permissionBtn: {
    height: 40,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
  },
  switchLabelArea: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  habitsRemindersSection: {
    paddingVertical: spacing.md,
  },
  subSectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  noHabitsText: {
    fontSize: 13,
    lineHeight: 18,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
  },
  habitReminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginHorizontal: spacing.lg,
  },
  habitMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.md,
  },
  habitEmoji: {
    fontSize: 22,
    marginRight: spacing.md,
  },
  habitDetails: {
    flex: 1,
  },
  habitName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  habitTime: {
    fontSize: 12,
  },
  logoutButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: spacing.lg,
  },
  logoutText: {
    color: '#FF4757',
    fontSize: 15,
    fontWeight: 'bold',
  },
  versionFooter: {
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  versionText: {
    fontSize: 12,
  },
});
