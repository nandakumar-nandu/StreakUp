import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { colors, spacing, borderRadius, typography, shadows } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

/**
 * schedule.tsx - Schedule Window Selection Screen
 * 
 * DATA COLLECTED: Preferred daily scheduling window (Morning, Afternoon, Evening, Flexible).
 * STORAGE LOCATION: AsyncStorage under key 'streakup_onboarding_schedule'.
 * 
 * Allows the user to configure a preferred tracking slot. This maps their target focus time
 * to establish default habit reminder options in their profile.
 */
export default function ScheduleScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const router = useRouter();

  const [selectedSlot, setSelectedSlot] = useState<string>('morning');

  const slots = [
    { key: 'morning', label: 'Morning focus', icon: 'sunny-outline', time: '08:00 AM', desc: 'Build positive momentum early in the day' },
    { key: 'afternoon', label: 'Afternoon slots', icon: 'partly-sunny-outline', time: '01:00 PM', desc: 'Keep track during active working hours' },
    { key: 'evening', label: 'Evening routines', icon: 'moon-outline', time: '07:00 PM', desc: 'Wind down and reflect on daily routines' },
    { key: 'flexible', label: 'Flexible windows', icon: 'calendar-outline', time: 'None', desc: 'Track anytime without strict reminder times' }
  ];

  const handleNext = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await AsyncStorage.setItem('streakup_onboarding_schedule', selectedSlot);
      router.push('/notifications' as any);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.header, { color: themeColors.text }]} accessibilityRole="header">
          When do you want to build habits?
        </Text>
        <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>
          Establish a daily routine target slot. We will preconfigure reminder settings to match.
        </Text>

        <View style={styles.list}>
          {slots.map((s) => {
            const isSelected = selectedSlot === s.key;
            const borderCol = isSelected 
              ? (colorScheme === 'dark' ? colors.primary.dark : colors.primary.light)
              : themeColors.border;

            return (
              <TouchableOpacity
                key={s.key}
                activeOpacity={0.8}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedSlot(s.key);
                }}
                style={[
                  styles.card, 
                  { 
                    backgroundColor: themeColors.card, 
                    borderColor: borderCol,
                    borderWidth: isSelected ? 2 : 1
                  }
                ]}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
                accessibilityLabel={s.label}
                accessibilityHint={`${s.desc}. Default target time: ${s.time}`}
              >
                <View style={styles.cardHeader}>
                  <Ionicons 
                    name={s.icon as any} 
                    size={22} 
                    color={isSelected ? (colorScheme === 'dark' ? colors.primary.dark : colors.primary.light) : themeColors.text} 
                  />
                  <View style={styles.headerTitles}>
                    <Text style={[styles.cardTitle, { color: themeColors.text, fontWeight: isSelected ? 'bold' : 'normal' }]}>
                      {s.label}
                    </Text>
                    <Text style={[styles.cardTime, { color: themeColors.textMuted }]}>
                      Default: {s.time}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.cardDesc, { color: themeColors.textMuted }]}>{s.desc}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleNext}
          style={[styles.button, { backgroundColor: colors.primary.light }]}
          accessibilityRole="button"
          accessibilityLabel="Continue to notification permissions screen"
        >
          <Text style={styles.buttonText}>Continue</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: spacing.sm }} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.xl,
    paddingBottom: spacing.huge,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.huge,
    paddingHorizontal: spacing.sm,
  },
  list: {
    width: '100%',
    marginBottom: spacing.huge,
  },
  card: {
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  headerTitles: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
    marginLeft: spacing.md,
  },
  cardTitle: {
    fontSize: 16,
  },
  cardTime: {
    fontSize: 12,
  },
  cardDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginLeft: 32,
  },
  button: {
    flexDirection: 'row',
    height: 52,
    width: '100%',
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
    ...shadows.sm,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
