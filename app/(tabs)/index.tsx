import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { colors, spacing, borderRadius } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function TodayScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? colors.dark : colors.light;

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: themeColors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
        <View style={styles.headerRow}>
          <Ionicons 
            name="flash" 
            size={40} 
            color={colorScheme === 'dark' ? colors.primary.dark : colors.primary.light} 
          />
          <View style={styles.titleContainer}>
            <Text style={[styles.cardTitle, { color: themeColors.text }]}>Welcome to StreakUp!</Text>
            <Text style={[styles.cardSubtitle, { color: themeColors.textMuted }]}>Keep your momentum going</Text>
          </View>
        </View>

        <Text style={[styles.bodyText, { color: themeColors.text }]}>
          This is your <Text style={{ fontWeight: 'bold', color: colorScheme === 'dark' ? colors.primary.dark : colors.primary.light }}>Today</Text> tab. Here, you'll see your daily habits checklists, streak status, and fitness targets for the day.
        </Text>

        <View style={[styles.badge, { backgroundColor: colorScheme === 'dark' ? 'rgba(255,71,87,0.15)' : 'rgba(255,71,87,0.1)' }]}>
          <Text style={[styles.badgeText, { color: colorScheme === 'dark' ? colors.primary.dark : colors.primary.light }]}>
            🔥 Ready to start your streak?
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  card: {
    width: '100%',
    maxWidth: 500,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  titleContainer: {
    marginLeft: spacing.md,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  cardSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  badge: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 14,
    fontWeight: 'semibold',
  },
});
