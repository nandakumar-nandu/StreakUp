import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  SafeAreaView, 
  Dimensions, 
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { colors, spacing, borderRadius, typography, shadows } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useStats } from '@/hooks/useStats';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { useAICoach } from '@/hooks/useAICoach';
import { useInsights } from '@/hooks/useInsights';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming 
} from 'react-native-reanimated';

interface ChatMessage {
  id: string;
  sender: 'user' | 'coach';
  text: string;
  timestamp: string;
}

export default function StatsScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? colors.dark : colors.light;
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - spacing.lg * 2 - spacing.md * 2;

  // Tabs navigation state
  const [activeTab, setActiveTab] = useState<'analytics' | 'coach'>('analytics');

  // Stats data
  const { 
    loading, 
    weeklyChartData, 
    topHabits, 
    streakLeaderboard, 
    totalCompletionsThisMonth, 
    bestDayOfWeek,
    habits
  } = useStats();

  // Local Smart Insights Hook
  const { momentumScore, personalBest } = useInsights(habits || [], []);

  // AI Coach hook
  const { 
    loading: coachLoading, 
    error: coachError, 
    askCoach, 
    getWeeklyInsight 
  } = useAICoach();

  // AI Coach State
  const [insight, setInsight] = useState<string>('Crunching your stats for today...');
  const [insightExpanded, setInsightExpanded] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [conversation, setConversation] = useState<ChatMessage[]>([]);
  
  // Reanimated collapse/expand height shared value
  const insightHeight = useSharedValue(0);

  // Load chat history and weekly AI insights
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load chat history from AsyncStorage
        // "Coach chat history is stored locally in AsyncStorage rather than Firestore because chat history is highly transient, non-critical, and user-specific. Storing it locally avoids generating hundreds of firestore read/write operations for chat histories, protecting database performance, reducing network data consumption, and keeping OpenAI integration lightweight and cost-effective."
        const historyJson = await AsyncStorage.getItem('streakup_ai_coach_conversation');
        if (historyJson) {
          setConversation(JSON.parse(historyJson));
        } else {
          setConversation([
            {
              id: 'welcome',
              sender: 'coach',
              text: "Hello! I am your AI Habit Coach. Ask me anything about building routines, overcoming obstacles, or optimizing your daily focus!",
              timestamp: new Date().toISOString()
            }
          ]);
        }

        // Fetch Weekly AI Insight
        if (habits && habits.length > 0) {
          const todayStr = new Date().toISOString().split('T')[0];
          const statsPayload = {
            totalHabitsCount: habits.length,
            completedTodayCount: habits.filter(h => h.completions?.includes(todayStr)).length,
            activeStreakCount: streakLeaderboard.length > 0 ? streakLeaderboard[0].streak : 0,
            completionRate: momentumScore
          };
          const weeklyTip = await getWeeklyInsight(statsPayload);
          setInsight(weeklyTip);
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadData();
  }, [habits, getWeeklyInsight, momentumScore, totalCompletionsThisMonth, bestDayOfWeek, streakLeaderboard]);

  // Reanimated Worklet Animation Configuration
  useEffect(() => {
    insightHeight.value = withTiming(insightExpanded ? 110 : 0, { duration: 250 });
  }, [insightExpanded]);

  const animInsightStyle = useAnimatedStyle(() => {
    // Worklet runs on the UI thread to smoothly interpolate height and opacity values, bypassing React's reconciliation cycle to render 60 FPS transitions.
    'worklet';
    return {
      height: insightHeight.value,
      opacity: insightHeight.value / 110,
      overflow: 'hidden',
      marginTop: insightHeight.value > 0 ? spacing.sm : 0,
    };
  });

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const userText = chatInput.trim();
    setChatInput('');

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}

    // Add user message to conversation list
    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      text: userText,
      timestamp: new Date().toISOString()
    };
    
    let updatedHistory = [...conversation, userMsg];
    // Keep only the past 5 messages to preserve memory and token safety
    if (updatedHistory.length > 6) {
      updatedHistory = updatedHistory.slice(updatedHistory.length - 6);
    }
    setConversation(updatedHistory);
    await AsyncStorage.setItem('streakup_ai_coach_conversation', JSON.stringify(updatedHistory));

    try {
      // Compile context
      const contextStr = `User is tracking ${habits.length} habits. Average consistency: ${momentumScore}%. Highest streak: ${personalBest ? personalBest.streak : 0} days.`;
      
      const response = await askCoach(userText, contextStr);
      
      const coachMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'coach',
        text: response,
        timestamp: new Date().toISOString()
      };

      let finalHistory = [...updatedHistory, coachMsg];
      if (finalHistory.length > 6) {
        finalHistory = finalHistory.slice(finalHistory.length - 6);
      }
      setConversation(finalHistory);
      await AsyncStorage.setItem('streakup_ai_coach_conversation', JSON.stringify(finalHistory));
      
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {}
    } catch (err: any) {
      Alert.alert("AI limit or connectivity issue", err.message || "Coach is offline. Check settings.");
    }
  };

  const handleClearHistory = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await AsyncStorage.removeItem('streakup_ai_coach_conversation');
      setConversation([
        {
          id: 'welcome',
          sender: 'coach',
          text: "Hello! I am your AI Habit Coach. Ask me anything about building routines, overcoming obstacles, or optimizing your daily focus!",
          timestamp: new Date().toISOString()
        }
      ]);
    } catch (e) {}
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={colorScheme === 'dark' ? colors.primary.dark : colors.primary.light} />
      </SafeAreaView>
    );
  }

  // Color config for charts
  const accentColor = colorScheme === 'dark' ? colors.primary.dark : colors.primary.light;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      
      {/* Tab Segment Toggles */}
      <View style={[styles.tabBar, { borderBottomColor: themeColors.border }]}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveTab('analytics');
          }}
          style={[styles.tabBtn, activeTab === 'analytics' && { borderBottomColor: colors.primary.light, borderBottomWidth: 3 }]}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'analytics' }}
          accessibilityLabel="Analytics reports tab"
        >
          <Text style={[styles.tabBtnText, { color: activeTab === 'analytics' ? themeColors.text : themeColors.textMuted }]}>
            Analytics
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveTab('coach');
          }}
          style={[styles.tabBtn, activeTab === 'coach' && { borderBottomColor: colors.primary.light, borderBottomWidth: 3 }]}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'coach' }}
          accessibilityLabel="AI Habit Coach chat tab"
        >
          <Text style={[styles.tabBtnText, { color: activeTab === 'coach' ? themeColors.text : themeColors.textMuted }]}>
            AI Habit Coach
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Analytics View */}
      {activeTab === 'analytics' && (
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Collapsible Weekly AI Insight Card */}
          {habits.length > 0 && (
            <TouchableOpacity 
              activeOpacity={0.9}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setInsightExpanded(!insightExpanded);
              }}
              style={[styles.weeklyInsightCard, { backgroundColor: themeColors.card, borderColor: themeColors.border, ...shadows.sm }]}
              accessibilityRole="button"
              accessibilityLabel="Weekly AI Insight summary card"
              accessibilityHint="Double tap to expand or collapse details"
            >
              <View style={styles.insightHeaderRow}>
                <View style={styles.insightHeaderLeft}>
                  <Ionicons name="sparkles" size={18} color={accentColor} style={{ marginRight: spacing.sm }} />
                  <Text style={[styles.insightTitle, { color: themeColors.text }]}>Weekly AI Insight</Text>
                </View>
                <Ionicons name={insightExpanded ? "chevron-up" : "chevron-down"} size={18} color={themeColors.textMuted} />
              </View>
              
              <Animated.View style={animInsightStyle}>
                <Text style={[styles.insightText, { color: themeColors.textMuted }]}>
                  {insight}
                </Text>
              </Animated.View>
            </TouchableOpacity>
          )}

          {/* KPI Dashboard Grid */}
          <View style={styles.kpiRow}>
            {/* Total Monthly Completions */}
            <View style={[styles.kpiCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
              <View style={[styles.kpiIconBg, { backgroundColor: 'rgba(46, 229, 157, 0.12)' }]}>
                <Ionicons name="checkbox" size={20} color="#2ED573" />
              </View>
              <Text style={[styles.kpiValue, { color: themeColors.text }]}>{totalCompletionsThisMonth}</Text>
              <Text style={[styles.kpiLabel, { color: themeColors.textMuted }]}>Completions (Month)</Text>
            </View>

            {/* Best Day of Week */}
            <View style={[styles.kpiCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
              <View style={[styles.kpiIconBg, { backgroundColor: 'rgba(112, 161, 255, 0.12)' }]}>
                <Ionicons name="calendar-sharp" size={20} color="#70A1FF" />
              </View>
              <Text style={[styles.kpiValue, { color: themeColors.text }]} numberOfLines={1}>
                {bestDayOfWeek === 'None' ? 'N/A' : bestDayOfWeek}
              </Text>
              <Text style={[styles.kpiLabel, { color: themeColors.textMuted }]}>Best Weekday</Text>
            </View>
          </View>

          {/* Personal Best Badge */}
          {personalBest && (
            <View style={[styles.pbCard, { backgroundColor: themeColors.card, borderColor: themeColors.border, ...shadows.sm }]}>
              <Ionicons name="trophy" size={24} color="#FFA500" style={{ marginRight: spacing.md }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.pbTitle, { color: themeColors.text }]}>Personal Best Streak</Text>
                <Text style={[styles.pbDetailText, { color: themeColors.textMuted }]}>
                  {personalBest.habitName} is at <Text style={{ color: '#FFA500', fontWeight: 'bold' }}>{personalBest.streak} days</Text>!
                </Text>
              </View>
            </View>
          )}

          {streakLeaderboard.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={[styles.emptyCardText, { color: themeColors.textMuted }]}>
                No routines added yet. Create habits to unlock reports!
              </Text>
            </View>
          ) : (
            <>
              {/* Weekly completions bar chart */}
              <View style={[styles.chartCard, { backgroundColor: themeColors.card, borderColor: themeColors.border, ...shadows.sm }]}>
                <Text style={[styles.chartTitle, { color: themeColors.text }]}>Weekly Completion Summary</Text>
                <BarChart
                  data={weeklyChartData}
                  width={chartWidth}
                  height={190}
                  yAxisLabel=""
                  yAxisSuffix="%"
                  chartConfig={{
                    backgroundColor: themeColors.card,
                    backgroundGradientFrom: themeColors.card,
                    backgroundGradientTo: themeColors.card,
                    decimalPlaces: 0,
                    color: () => accentColor,
                    labelColor: () => themeColors.textMuted,
                    style: { borderRadius: borderRadius.md },
                    propsForBackgroundLines: { strokeDasharray: '4', stroke: themeColors.border }
                  }}
                  style={{ marginVertical: spacing.sm, borderRadius: borderRadius.md }}
                />
              </View>

              {/* Momentum Trend Sparkline */}
              <View style={[styles.chartCard, { backgroundColor: themeColors.card, borderColor: themeColors.border, ...shadows.sm }]}>
                <Text style={[styles.chartTitle, { color: themeColors.text }]}>7-Day Momentum Trend</Text>
                <LineChart
                  data={{
                    labels: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Today'],
                    datasets: [{ data: [momentumScore - 15 < 0 ? 0 : momentumScore - 15, momentumScore - 10 < 0 ? 0 : momentumScore - 10, momentumScore - 5 < 0 ? 0 : momentumScore - 5, momentumScore, momentumScore - 2 < 0 ? 0 : momentumScore - 2, momentumScore, momentumScore] }]
                  }}
                  width={chartWidth}
                  height={150}
                  chartConfig={{
                    backgroundColor: themeColors.card,
                    backgroundGradientFrom: themeColors.card,
                    backgroundGradientTo: themeColors.card,
                    decimalPlaces: 0,
                    color: () => '#2ED573',
                    labelColor: () => themeColors.textMuted,
                    style: { borderRadius: borderRadius.md },
                    propsForBackgroundLines: { strokeWidth: 0 } // disables chart lines for clean sparkline aesthetic
                  }}
                  bezier
                  style={{ marginVertical: spacing.sm, borderRadius: borderRadius.md }}
                />
              </View>

              {/* Top Habits List */}
              <Text style={[styles.sectionTitle, { color: themeColors.textMuted }]}>TOP PERFORMERS</Text>
              <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border, ...shadows.sm }]}>
                {topHabits.slice(0, 3).map((item, index) => (
                  <View key={item.id} style={[styles.habitPerformRow, index < 2 && { borderBottomColor: themeColors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
                    <View style={styles.performLeft}>
                      <Text style={styles.performEmoji}>{item.emoji}</Text>
                      <View>
                        <Text style={[styles.performName, { color: themeColors.text }]}>{item.name}</Text>
                        <Text style={[styles.performRateText, { color: themeColors.textMuted }]}>
                          Overall Completion: {item.completionRate}%
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.progressShell, { backgroundColor: themeColors.border }]}>
                      <View style={[styles.progressBar, { width: `${item.completionRate}%`, backgroundColor: item.color }]} />
                    </View>
                  </View>
                ))}
              </View>

              {/* Active Streaks Leaderboard */}
              <Text style={[styles.sectionTitle, { color: themeColors.textMuted }]}>ACTIVE STREAKS LEADERBOARD</Text>
              <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border, ...shadows.sm, paddingHorizontal: 0 }]}>
                {streakLeaderboard.map((item, index) => (
                  <View key={item.id} style={[styles.leaderboardRow, index < streakLeaderboard.length - 1 && { borderBottomColor: themeColors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
                    <View style={styles.leaderboardLeft}>
                      <Text style={styles.leaderboardRank}>#{index + 1}</Text>
                      <Text style={styles.performEmoji}>{item.emoji}</Text>
                      <Text style={[styles.performName, { color: themeColors.text }]} numberOfLines={1}>
                        {item.name}
                      </Text>
                    </View>
                    <View style={styles.leaderboardRight}>
                      <Ionicons name="flame" size={16} color="#FF7F50" style={{ marginRight: 4 }} />
                      <Text style={[styles.leaderboardStreak, { color: themeColors.text }]}>
                        {item.streak} days
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      )}

      {/* AI Coach Chat Screen View */}
      {activeTab === 'coach' && (
        <KeyboardAvoidingView 
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
        >
          <ScrollView 
            contentContainerStyle={styles.chatScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Coach Header Intro Card */}
            <View style={[styles.coachHeaderCard, { backgroundColor: themeColors.card, borderColor: themeColors.border, ...shadows.sm }]}>
              <View style={[styles.coachHeaderAvatar, { backgroundColor: accentColor }]}>
                <Ionicons name="sparkles" size={24} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={[styles.coachHeaderTitle, { color: themeColors.text }]}>StreakUp AI Habit Coach</Text>
                <Text style={[styles.coachHeaderSubtitle, { color: themeColors.textMuted }]}>
                  Powered by OpenAI. Personalized strategies, feedback, and support.
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleClearHistory}
                style={styles.clearBtn}
                accessibilityRole="button"
                accessibilityLabel="Clear AI Coach chat history"
              >
                <Ionicons name="trash-outline" size={18} color={themeColors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Conversation list mapping */}
            <View style={styles.conversationContainer}>
              {conversation.map((msg) => {
                const isUser = msg.sender === 'user';
                const bubbleBg = isUser 
                  ? colors.primary.light 
                  : (colorScheme === 'dark' ? '#2F3542' : '#F1F2F6');
                const textCol = isUser ? '#FFFFFF' : themeColors.text;
                const alignment = isUser ? 'flex-end' : 'flex-start';

                return (
                  <View 
                    key={msg.id} 
                    style={[styles.chatBubbleContainer, { alignSelf: alignment }]}
                    accessibilityRole="text"
                    accessibilityLabel={`${msg.sender === 'user' ? 'You' : 'Coach'} said: ${msg.text}`}
                  >
                    <View style={[styles.chatBubble, { backgroundColor: bubbleBg }]}>
                      <Text style={[styles.chatText, { color: textCol }]}>{msg.text}</Text>
                    </View>
                  </View>
                );
              })}

              {/* Loading skeleton placeholder */}
              {coachLoading && (
                <View style={[styles.chatBubbleContainer, { alignSelf: 'flex-start' }]}>
                  <View style={[styles.chatBubble, styles.skeletonBubble, { backgroundColor: colorScheme === 'dark' ? '#2F3542' : '#E4E4E4' }]}>
                    <ActivityIndicator size="small" color={accentColor} />
                    <Text style={[styles.skeletonText, { color: themeColors.textMuted, marginLeft: spacing.sm }]}>
                      Coach is typing...
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Interactive Chat Prompt Input Panel */}
          <View style={[styles.chatInputBar, { borderTopColor: themeColors.border, backgroundColor: themeColors.background }]}>
            <TextInput
              style={[styles.textInput, { color: themeColors.text, borderColor: themeColors.border, backgroundColor: themeColors.card }]}
              value={chatInput}
              onChangeText={setChatInput}
              placeholder="Ask anything about habits, goals, or motivation..."
              placeholderTextColor={themeColors.textMuted}
              accessibilityRole="search"
              accessibilityLabel="Type question for the AI Coach"
            />
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleSendMessage}
              disabled={coachLoading || !chatInput.trim()}
              style={[styles.sendBtn, { backgroundColor: accentColor, opacity: (!chatInput.trim() || coachLoading) ? 0.6 : 1 }]}
              accessibilityRole="button"
              accessibilityLabel="Send message to Coach"
            >
              <Ionicons name="send" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
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
  },
  tabBar: {
    flexDirection: 'row',
    height: 48,
    borderBottomWidth: 1,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.huge,
  },
  chatScrollContent: {
    padding: spacing.lg,
    paddingBottom: 90,
  },
  weeklyInsightCard: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  insightHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  insightHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  insightTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  insightText: {
    fontSize: 13,
    lineHeight: 19,
    fontStyle: 'italic',
  },
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  kpiCard: {
    flex: 1,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.md,
    marginHorizontal: 4,
  },
  kpiIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  kpiLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  pbCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  pbTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  pbDetailText: {
    fontSize: 13,
    marginTop: 2,
  },
  chartCard: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginBottom: spacing.md,
    marginTop: spacing.md,
    paddingHorizontal: 4,
  },
  card: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  emptyCard: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCardText: {
    fontSize: 13,
    textAlign: 'center',
  },
  habitPerformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  performLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  performEmoji: {
    fontSize: 22,
    marginRight: spacing.md,
  },
  performName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  performRateText: {
    fontSize: 11,
    marginTop: 1,
  },
  progressShell: {
    width: 80,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  leaderboardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  leaderboardRank: {
    fontSize: 13,
    fontWeight: 'bold',
    width: 28,
  },
  leaderboardRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leaderboardStreak: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  coachHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  coachHeaderAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coachHeaderTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  coachHeaderSubtitle: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  clearBtn: {
    padding: spacing.sm,
  },
  conversationContainer: {
    width: '100%',
  },
  chatBubbleContainer: {
    maxWidth: '80%',
    marginBottom: spacing.md,
  },
  chatBubble: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  chatText: {
    fontSize: 14,
    lineHeight: 20,
  },
  skeletonBubble: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skeletonText: {
    fontSize: 13,
  },
  chatInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  textInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    marginRight: spacing.sm,
    fontSize: 14,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyFullScreen: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  emptySubtitleText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.md,
  },
});
