import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  SafeAreaView, 
  Dimensions, 
  ActivityIndicator 
} from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { colors, spacing, borderRadius, typography, shadows } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useStats } from '@/hooks/useStats';
import { BarChart } from 'react-native-chart-kit';

export default function StatsScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? colors.dark : colors.light;
  
  const { 
    loading, 
    weeklyChartData, 
    topHabits, 
    streakLeaderboard, 
    totalCompletionsThisMonth, 
    bestDayOfWeek 
  } = useStats();

  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - spacing.lg * 2 - spacing.md * 2; // account for scroll content padding & card padding

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={colorScheme === 'dark' ? colors.primary.dark : colors.primary.light} />
      </SafeAreaView>
    );
  }

  // Color config for chart bars (Coral Primary)
  const barColor = colorScheme === 'dark' ? colors.primary.dark : colors.primary.light;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* KPI Dashboard Grid */}
        <View style={styles.kpiRow}>
          {/* Total Monthly Completions */}
          <View style={[styles.kpiCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <View style={[styles.kpiIconBg, { backgroundColor: 'rgba(46, 229, 157, 0.12)' }]}>
              <Ionicons name="checkbox" size={20} color={colorScheme === 'dark' ? colors.secondary.dark : colors.secondary.light} />
            </View>
            <Text style={[styles.kpiValue, { color: themeColors.text }]}>{totalCompletionsThisMonth}</Text>
            <Text style={[styles.kpiLabel, { color: themeColors.textMuted }]}>Completions (Month)</Text>
          </View>

          {/* Best Day of Week */}
          <View style={[styles.kpiCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <View style={[styles.kpiIconBg, { backgroundColor: 'rgba(112, 161, 255, 0.12)' }]}>
              <Ionicons name="calendar-sharp" size={20} color={colorScheme === 'dark' ? colors.accent.dark : colors.accent.light} />
            </View>
            <Text style={[styles.kpiValue, { color: themeColors.text }]} numberOfLines={1}>
              {bestDayOfWeek === 'None' ? 'N/A' : bestDayOfWeek}
            </Text>
            <Text style={[styles.kpiLabel, { color: themeColors.textMuted }]}>Best Weekday</Text>
          </View>
        </View>

        {/* Weekly Completion Bar Chart */}
        <Text style={[styles.sectionTitle, { color: themeColors.textMuted }]}>WEEKLY COMPLETION RATE</Text>
        <View style={[styles.chartCard, { backgroundColor: themeColors.card, borderColor: themeColors.border, ...shadows.sm }]}>
          {streakLeaderboard.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: themeColors.textMuted }]}>No habit activity recorded yet</Text>
            </View>
          ) : (
            <BarChart
              data={weeklyChartData}
              width={chartWidth}
              height={200}
              yAxisLabel=""
              yAxisSuffix="%"
              yAxisInterval={1}
              chartConfig={{
                backgroundColor: themeColors.card,
                backgroundGradientFrom: themeColors.card,
                backgroundGradientTo: themeColors.card,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(255, 71, 87, ${opacity})`,
                labelColor: () => themeColors.textMuted,
                style: {
                  borderRadius: borderRadius.md,
                },
                fillShadowGradient: barColor,
                fillShadowGradientOpacity: 0.85,
                fillShadowGradientFromOffset: 1,
                barPercentage: 0.55,
                propsForBackgroundLines: {
                  strokeDasharray: '4 4',
                  stroke: themeColors.border,
                }
              }}
              style={styles.chart}
              showValuesOnTopOfBars={true}
              fromZero={true}
            />
          )}
        </View>

        {/* Top 3 Habits by Efficiency */}
        <Text style={[styles.sectionTitle, { color: themeColors.textMuted }]}>TOP PERFORMANCE RATE</Text>
        <View style={[styles.listCard, { backgroundColor: themeColors.card, borderColor: themeColors.border, ...shadows.sm }]}>
          {topHabits.length === 0 ? (
            <View style={styles.emptyListContainer}>
              <Ionicons name="sparkles-outline" size={32} color={themeColors.textMuted} />
              <Text style={[styles.emptyText, { color: themeColors.textMuted, marginTop: spacing.sm }]}>
                Add and complete habits to rank performance
              </Text>
            </View>
          ) : (
            topHabits.map((habit, index) => {
              const accentTint = `${habit.color}15`;
              return (
                <View 
                  key={habit.id} 
                  style={[
                    styles.listItem, 
                    { borderBottomColor: index === topHabits.length - 1 ? 'transparent' : themeColors.border }
                  ]}
                >
                  <View style={[styles.listEmojiBg, { backgroundColor: accentTint }]}>
                    <Text style={styles.listEmoji}>{habit.emoji}</Text>
                  </View>
                  <View style={styles.listDetails}>
                    <Text style={[styles.listName, { color: themeColors.text }]} numberOfLines={1}>
                      {habit.name}
                    </Text>
                    {/* Horizontal Custom Progress Bar representing completion rate */}
                    <View style={[styles.progressBarTrack, { backgroundColor: themeColors.border }]}>
                      <View 
                        style={[
                          styles.progressBarFill, 
                          { backgroundColor: habit.color, width: `${Math.min(100, habit.completionRate)}%` }
                        ]} 
                      />
                    </View>
                  </View>
                  <Text style={[styles.listScore, { color: habit.color }]}>
                    {habit.completionRate}%
                  </Text>
                </View>
              );
            })
          )}
        </View>

        {/* Streak Leaderboard */}
        <Text style={[styles.sectionTitle, { color: themeColors.textMuted }]}>ACTIVE STREAKS LEADERBOARD</Text>
        <View style={[styles.listCard, { backgroundColor: themeColors.card, borderColor: themeColors.border, ...shadows.sm }]}>
          {streakLeaderboard.length === 0 ? (
            <View style={styles.emptyListContainer}>
              <Ionicons name="flame-outline" size={32} color={themeColors.textMuted} />
              <Text style={[styles.emptyText, { color: themeColors.textMuted, marginTop: spacing.sm }]}>
                No habits created yet
              </Text>
            </View>
          ) : (
            streakLeaderboard.map((habit, index) => {
              const accentTint = `${habit.color}15`;
              return (
                <View 
                  key={habit.id} 
                  style={[
                    styles.listItem, 
                    { borderBottomColor: index === streakLeaderboard.length - 1 ? 'transparent' : themeColors.border }
                  ]}
                >
                  <View style={[styles.listEmojiBg, { backgroundColor: accentTint }]}>
                    <Text style={styles.listEmoji}>{habit.emoji}</Text>
                  </View>
                  <View style={styles.listDetails}>
                    <Text style={[styles.listName, { color: themeColors.text }]} numberOfLines={1}>
                      {habit.name}
                    </Text>
                    <Text style={[styles.listSubText, { color: themeColors.textMuted }]}>
                      Rank #{index + 1}
                    </Text>
                  </View>
                  <View style={[styles.streakBadge, { backgroundColor: 'rgba(255, 165, 2, 0.12)' }]}>
                    <Text style={styles.streakBadgeText}>🔥 {habit.streak}</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.huge,
  },
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  kpiCard: {
    flex: 1,
    marginHorizontal: 4,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  kpiIconBg: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  kpiLabel: {
    fontSize: typography.sizes.caption,
    fontWeight: 'semibold',
  },
  sectionTitle: {
    fontSize: typography.sizes.caption,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginBottom: spacing.md,
    marginTop: spacing.md,
  },
  chartCard: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  chart: {
    marginVertical: 4,
    borderRadius: borderRadius.md,
  },
  listCard: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xl,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  listEmojiBg: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  listEmoji: {
    fontSize: 20,
  },
  listDetails: {
    flex: 1,
    marginRight: spacing.md,
  },
  listName: {
    fontSize: typography.sizes.bodyMedium,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  listSubText: {
    fontSize: typography.sizes.bodySmall,
  },
  progressBarTrack: {
    height: 6,
    borderRadius: borderRadius.xs,
    width: '100%',
    overflow: 'hidden',
    marginTop: 4,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: borderRadius.xs,
  },
  listScore: {
    fontSize: typography.sizes.bodyMedium,
    fontWeight: 'bold',
  },
  streakBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  streakBadgeText: {
    fontSize: typography.sizes.bodySmall,
    color: '#FFA502',
    fontWeight: 'bold',
  },
  emptyContainer: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyListContainer: {
    paddingVertical: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.sizes.bodySmall,
    fontWeight: 'semibold',
  },
});
