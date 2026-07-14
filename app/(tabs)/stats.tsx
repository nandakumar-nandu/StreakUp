import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { colors, spacing, borderRadius } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function StatsScreen() {
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
            name="bar-chart" 
            size={40} 
            color={colorScheme === 'dark' ? colors.accent.dark : colors.accent.light} 
          />
          <View style={styles.titleContainer}>
            <Text style={[styles.cardTitle, { color: themeColors.text }]}>Your Statistics</Text>
            <Text style={[styles.cardSubtitle, { color: themeColors.textMuted }]}>Visualize your growth & streaks</Text>
          </View>
        </View>

        <Text style={[styles.bodyText, { color: themeColors.text }]}>
          This is your <Text style={{ fontWeight: 'bold', color: colorScheme === 'dark' ? colors.accent.dark : colors.accent.light }}>Stats</Text> tab. Here, you'll see completion rates, historic streaks, visual progress charts, and fitness summaries like duration and calories.
        </Text>

        <View style={[styles.badge, { backgroundColor: colorScheme === 'dark' ? 'rgba(130,177,255,0.15)' : 'rgba(112,161,255,0.1)' }]}>
          <Text style={[styles.badgeText, { color: colorScheme === 'dark' ? colors.accent.dark : colors.accent.light }]}>
            📊 Charts and analytics coming soon
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
