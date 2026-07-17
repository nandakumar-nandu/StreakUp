import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  ActivityIndicator, 
  Modal, 
  Alert,
  Dimensions,
  Platform,
  RefreshControl
} from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { colors, spacing, borderRadius, typography, shadows } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { 
  useFriends, 
  useFriendRequests, 
  useLeaderboard, 
  useChallenges 
} from '@/hooks/useSocial';
import { 
  sendFriendRequest, 
  acceptFriendRequest, 
  declineFriendRequest, 
  searchUsers 
} from '@/lib/socialService';
import { 
  createChallenge, 
  acceptChallenge, 
  declineChallenge 
} from '@/lib/challengeService';
import { Friend, FriendRequest, UserProfile, Challenge, LeaderboardEntry } from '@/types';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  cancelAnimation, 
  Easing 
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

type TabType = 'friends' | 'leaderboard' | 'challenges';

export default function SocialScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? colors.dark : colors.light;
  
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('friends');

  // Search User States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [searching, setSearching] = useState(false);

  // Modal States
  const [isChallengeModalVisible, setIsChallengeModalVisible] = useState(false);
  const [selectedFriendForDuel, setSelectedFriendForDuel] = useState<Friend | null>(null);
  const [duelHabitName, setDuelHabitName] = useState('');
  const [duelDuration, setDuelDuration] = useState<7 | 14 | 30>(7);
  const [submittingDuel, setSubmittingDuel] = useState(false);

  // Pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);

  // Real-time hooks data
  const { friends, loading: friendsLoading } = useFriends();
  const { incomingRequests, loading: requestsLoading } = useFriendRequests();
  const { challenges, loading: challengesLoading } = useChallenges();

  // Habit options for leaderboard comparison
  const [leaderboardHabit, setLeaderboardHabit] = useState('exercise');
  const [leaderboardScope, setLeaderboardScope] = useState<'friends' | 'global'>('friends');

  const friendsUids = friends.map(f => f.uid);
  const { entries: leaderboardEntries, loading: leaderboardLoading } = useLeaderboard(
    leaderboardHabit, 
    leaderboardScope, 
    friendsUids
  );

  // Spinner animation for Reanimated Pull-to-refresh indicator
  const spinValue = useSharedValue(0);

  useEffect(() => {
    spinValue.value = withRepeat(
      withTiming(360, { duration: 1200, easing: Easing.linear }),
      -1,
      false
    );
    return () => cancelAnimation(spinValue);
  }, []);

  const animatedSpinnerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${spinValue.value}deg` }],
    };
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const users = await searchUsers(searchQuery);
      // Filter out self from search results
      const filtered = users.filter(u => u.uid !== user?.uid);
      setSearchResults(filtered);
    } catch (e) {
      console.error(e);
      Alert.alert("Search Error", "Could not query users.");
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async (targetUid: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await sendFriendRequest(targetUid);
      Alert.alert("Request Sent", "Friend request sent successfully!");
      setSearchQuery('');
      setSearchResults([]);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to send friend request.");
    }
  };

  const handleAcceptRequest = async (reqId: string) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await acceptFriendRequest(reqId);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to accept request.");
    }
  };

  const handleDeclineRequest = async (reqId: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await declineFriendRequest(reqId);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to decline request.");
    }
  };

  const handleAcceptChallenge = async (challengeId: string) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await acceptChallenge(challengeId);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to accept challenge.");
    }
  };

  const handleDeclineChallenge = async (challengeId: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await declineChallenge(challengeId);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to decline challenge.");
    }
  };

  const handleOpenDuelModal = (friend: Friend) => {
    setSelectedFriendForDuel(friend);
    setDuelHabitName('');
    setDuelDuration(7);
    setIsChallengeModalVisible(true);
  };

  const handleCreateDuel = async () => {
    if (!selectedFriendForDuel || !duelHabitName.trim()) {
      Alert.alert("Required info missing", "Please enter a habit name.");
      return;
    }
    setSubmittingDuel(true);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await createChallenge(
        selectedFriendForDuel.uid,
        selectedFriendForDuel.displayName || 'Friend',
        duelHabitName,
        duelDuration
      );
      setIsChallengeModalVisible(false);
      Alert.alert("Duel Initiated!", `You challenged ${selectedFriendForDuel.displayName} to a ${duelDuration}-day ${duelHabitName} duel!`);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to create challenge.");
    } finally {
      setSubmittingDuel(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    // Simulating pull-to-refresh reloading time
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  };

  // Helper to count remaining days in active challenges
  const getRemainingDays = (startDateStr: string, duration: number) => {
    if (!startDateStr) return duration;
    const start = new Date(startDateStr);
    const end = new Date(start.getTime() + duration * 24 * 60 * 60 * 1000);
    const today = new Date();
    const diff = end.getTime() - today.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days < 0 ? 0 : days;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Top Segmented Sub-Tabs */}
      <View style={[styles.tabBar, { backgroundColor: themeColors.card, borderBottomColor: themeColors.border }]}>
        {(['friends', 'leaderboard', 'challenges'] as TabType[]).map((tab) => {
          const isActive = activeTab === tab;
          const activeBorderColor = colorScheme === 'dark' ? colors.primary.dark : colors.primary.light;
          
          return (
            <TouchableOpacity
              key={tab}
              activeOpacity={0.8}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab(tab);
              }}
              style={[
                styles.tabItem,
                isActive && { borderBottomColor: activeBorderColor, borderBottomWidth: 3 }
              ]}
            >
              <Text style={[
                styles.tabText,
                { color: isActive ? themeColors.text : themeColors.textMuted, fontWeight: isActive ? 'bold' : 'normal' }
              ]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
              {tab === 'friends' && incomingRequests.length > 0 && (
                <View style={styles.badgeCount}>
                  <Text style={styles.badgeText}>{incomingRequests.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="transparent" // Hide default indicator to show Reanimated one
            colors={['transparent']}
          />
        }
      >
        {/* Reanimated Pull-to-refresh spinner view */}
        {refreshing && (
          <View style={styles.refreshSpinnerContainer}>
            <Animated.View style={[styles.refreshSpinner, animatedSpinnerStyle]}>
              <Ionicons name="sync" size={24} color={colorScheme === 'dark' ? colors.primary.dark : colors.primary.light} />
            </Animated.View>
          </View>
        )}

        {/* =====================================================================
            FRIENDS TAB VIEW
            ===================================================================== */}
        {activeTab === 'friends' && (
          <View>
            {/* Search User Input Area */}
            <View style={[styles.searchBox, { backgroundColor: themeColors.card, borderColor: themeColors.border, ...shadows.sm }]}>
              <TextInput
                placeholder="Search user by display name or email..."
                placeholderTextColor={themeColors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                style={[styles.searchInput, { color: themeColors.text }]}
              />
              <TouchableOpacity onPress={handleSearch} style={[styles.searchBtn, { backgroundColor: colors.primary.light }]}>
                {searching ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="search" size={18} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <View style={[styles.sectionCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Search Results</Text>
                {searchResults.map((searchUser) => {
                  const isFriend = friendsUids.includes(searchUser.uid);
                  return (
                    <View key={searchUser.uid} style={[styles.searchResultRow, { borderBottomColor: themeColors.border }]}>
                      <View style={styles.friendMeta}>
                        <View style={[styles.avatarCircle, { backgroundColor: colors.primary.light }]}>
                          <Text style={styles.avatarInitial}>
                            {(searchUser.displayName || searchUser.email || 'S').charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.friendInfo}>
                          <Text style={[styles.friendName, { color: themeColors.text }]}>
                            {searchUser.displayName || 'StreakUp User'}
                          </Text>
                          <Text style={[styles.friendEmail, { color: themeColors.textMuted }]}>
                            {searchUser.email}
                          </Text>
                        </View>
                      </View>
                      {isFriend ? (
                        <View style={styles.addedBadge}>
                          <Ionicons name="checkmark-done" size={16} color="#2ED573" style={{ marginRight: 4 }} />
                          <Text style={styles.addedText}>Friends</Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={[styles.addFriendBtn, { backgroundColor: colors.primary.light }]}
                          onPress={() => handleSendRequest(searchUser.uid)}
                        >
                          <Text style={styles.addFriendText}>Add</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {/* Friend Requests Inbox */}
            {incomingRequests.length > 0 && (
              <View style={[styles.sectionCard, { backgroundColor: themeColors.card, ...shadows.sm, borderColor: '#FFA502' }]}>
                <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Friend Requests Received</Text>
                {incomingRequests.map((req) => (
                  <View key={req.id} style={[styles.requestRow, { borderBottomColor: themeColors.border }]}>
                    <View style={styles.requestInfo}>
                      <Text style={[styles.requestSender, { color: themeColors.text }]}>
                        {req.fromDisplayName}
                      </Text>
                      <Text style={[styles.requestEmail, { color: themeColors.textMuted }]}>
                        {req.fromEmail}
                      </Text>
                    </View>
                    <View style={styles.requestActions}>
                      <TouchableOpacity 
                        style={[styles.requestBtn, styles.acceptBtn]} 
                        onPress={() => handleAcceptRequest(req.id)}
                      >
                        <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.requestBtn, styles.declineBtn]} 
                        onPress={() => handleDeclineRequest(req.id)}
                      >
                        <Ionicons name="close" size={18} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Friends List Dashboard */}
            <Text style={[styles.listHeader, { color: themeColors.textMuted }]}>MY FRIENDS ({friends.length})</Text>
            {friendsLoading ? (
              <ActivityIndicator size="large" color={colors.primary.light} style={{ marginTop: spacing.xl }} />
            ) : friends.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={64} color={themeColors.textMuted} style={{ marginBottom: spacing.md }} />
                <Text style={[styles.emptyText, { color: themeColors.text }]}>No Friends Yet</Text>
                <Text style={[styles.emptySubtitle, { color: themeColors.textMuted }]}>
                  Find and add users above to start dueling and competing on leaderboards!
                </Text>
              </View>
            ) : (
              friends.map((friend) => (
                <View key={friend.uid} style={[styles.friendCard, { backgroundColor: themeColors.card, borderColor: themeColors.border, ...shadows.sm }]}>
                  <View style={styles.friendCardLeft}>
                    <View style={[styles.avatarCircle, { backgroundColor: colors.primary.light }]}>
                      <Text style={styles.avatarInitial}>
                        {(friend.displayName || friend.email || 'F').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.friendInfo}>
                      <Text style={[styles.friendName, { color: themeColors.text }]}>
                        {friend.displayName || 'StreakUp User'}
                      </Text>
                      <Text style={[styles.friendCardSubtext, { color: themeColors.textMuted }]}>
                        🔥 {friend.currentStreak || 0}-day active streak
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.challengeBtn, { backgroundColor: 'rgba(255, 71, 87, 0.1)' }]}
                    onPress={() => handleOpenDuelModal(friend)}
                  >
                    <Ionicons name="flame" size={16} color="#FF4757" style={{ marginRight: 4 }} />
                    <Text style={[styles.challengeBtnText, { color: '#FF4757' }]}>Duel</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        {/* =====================================================================
            LEADERBOARD TAB VIEW
            ===================================================================== */}
        {activeTab === 'leaderboard' && (
          <View>
            {/* Habit selection & Scope selector */}
            <View style={styles.leaderboardControls}>
              <View style={[styles.searchBox, { backgroundColor: themeColors.card, borderColor: themeColors.border, ...shadows.sm, marginBottom: spacing.md }]}>
                <Ionicons name="search" size={16} color={themeColors.textMuted} style={{ marginLeft: spacing.sm, marginRight: spacing.sm }} />
                <TextInput
                  placeholder="Enter habit name (e.g. exercise, reading)..."
                  placeholderTextColor={themeColors.textMuted}
                  value={leaderboardHabit}
                  onChangeText={(text) => setLeaderboardHabit(text.toLowerCase())}
                  style={[styles.searchInput, { color: themeColors.text }]}
                />
              </View>

              <View style={[styles.scopeBar, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                {(['friends', 'global'] as const).map((scope) => {
                  const isActive = leaderboardScope === scope;
                  const btnBg = isActive ? (colorScheme === 'dark' ? colors.primary.dark : colors.primary.light) : 'transparent';
                  const textColor = isActive ? '#FFFFFF' : themeColors.text;

                  return (
                    <TouchableOpacity
                      key={scope}
                      activeOpacity={0.8}
                      onPress={() => setLeaderboardScope(scope)}
                      style={[styles.scopeBtn, { backgroundColor: btnBg }]}
                    >
                      <Text style={[styles.scopeBtnText, { color: textColor }]}>
                        {scope === 'friends' ? 'My Friends' : 'Global Top 10'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Leaderboard Table rows */}
            <Text style={[styles.listHeader, { color: themeColors.textMuted }]}>
              COMPARING: {leaderboardHabit.toUpperCase()}
            </Text>

            {leaderboardLoading ? (
              <ActivityIndicator size="large" color={colors.primary.light} style={{ marginTop: spacing.xl }} />
            ) : leaderboardEntries.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="bar-chart-outline" size={64} color={themeColors.textMuted} style={{ marginBottom: spacing.md }} />
                <Text style={[styles.emptyText, { color: themeColors.text }]}>No Entries Found</Text>
                <Text style={[styles.emptySubtitle, { color: themeColors.textMuted }]}>
                  Ensure users have public habits matching this name to populate the leaderboard.
                </Text>
              </View>
            ) : (
              <View style={[styles.leaderboardCard, { backgroundColor: themeColors.card, borderColor: themeColors.border, ...shadows.sm }]}>
                {leaderboardEntries.map((entry, index) => {
                  const isCurrentUser = entry.uid === user?.uid;
                  const rank = index + 1;
                  
                  // Rank medal icons for top 3
                  const rankDisplay = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}`;

                  return (
                    <View 
                      key={entry.uid} 
                      style={[
                        styles.leaderboardRow, 
                        { borderBottomColor: themeColors.border },
                        isCurrentUser && { backgroundColor: 'rgba(255, 71, 87, 0.08)' }
                      ]}
                    >
                      <View style={styles.leaderboardLeft}>
                        <Text style={styles.rankBadge}>{rankDisplay}</Text>
                        <View style={[styles.avatarCircle, { backgroundColor: isCurrentUser ? colors.primary.light : colors.secondary.light, width: 36, height: 36, marginHorizontal: spacing.sm }]}>
                          <Text style={[styles.avatarInitial, { fontSize: 14 }]}>
                            {(entry.displayName || 'U').charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <Text 
                          style={[
                            styles.leaderboardName, 
                            { color: themeColors.text },
                            isCurrentUser && { fontWeight: 'bold' }
                          ]}
                          numberOfLines={1}
                        >
                          {entry.displayName} {isCurrentUser && '(You)'}
                        </Text>
                      </View>
                      <View style={styles.leaderboardRight}>
                        <Text style={styles.leaderboardStreak}>🔥 {entry.currentStreak}</Text>
                        <Text style={[styles.leaderboardRate, { color: themeColors.textMuted }]}>
                          {entry.completionRate.toFixed(0)}%
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* =====================================================================
            CHALLENGES TAB VIEW
            ===================================================================== */}
        {activeTab === 'challenges' && (
          <View>
            {challengesLoading ? (
              <ActivityIndicator size="large" color={colors.primary.light} style={{ marginTop: spacing.xl }} />
            ) : challenges.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="flame-outline" size={64} color={themeColors.textMuted} style={{ marginBottom: spacing.md }} />
                <Text style={[styles.emptyText, { color: themeColors.text }]}>No Active Duels</Text>
                <Text style={[styles.emptySubtitle, { color: themeColors.textMuted }]}>
                  Go to the Friends section and click "Duel" to invite someone to a head-to-head tracking challenge!
                </Text>
              </View>
            ) : (
              challenges.map((challenge) => {
                const isCreator = challenge.creatorId === user?.uid;
                const isPending = challenge.status === 'invited';
                const isActive = challenge.status === 'active';
                const isCompleted = challenge.status === 'completed';

                const remainingDays = getRemainingDays(challenge.startDate, challenge.durationDays);

                // Calculate completions count & rates
                const myCompletions = isCreator ? challenge.creatorCompletions.length : challenge.opponentCompletions.length;
                const opponentCompletions = isCreator ? challenge.opponentCompletions.length : challenge.creatorCompletions.length;
                
                const opponentName = isCreator ? challenge.opponentName : challenge.creatorName;

                // Duel Progress Bar percentage calculations
                const totalProgress = myCompletions + opponentCompletions;
                const myPercentage = totalProgress === 0 ? 50 : (myCompletions / totalProgress) * 100;
                
                return (
                  <View 
                    key={challenge.id} 
                    style={[
                      styles.challengeCard, 
                      { backgroundColor: themeColors.card, borderColor: themeColors.border, ...shadows.sm },
                      isPending && isCreator && { borderLeftColor: '#FFA502', borderLeftWidth: 4 },
                      isPending && !isCreator && { borderLeftColor: '#FF9F43', borderLeftWidth: 4 },
                      isActive && { borderLeftColor: '#2ED573', borderLeftWidth: 4 },
                      isCompleted && { borderLeftColor: '#747D8C', borderLeftWidth: 4 }
                    ]}
                  >
                    <View style={styles.challengeHeader}>
                      <View>
                        <Text style={[styles.challengeHabit, { color: themeColors.text }]}>
                          ⚔️ {challenge.habitName.toUpperCase()} DUEL
                        </Text>
                        <Text style={[styles.challengeSub, { color: themeColors.textMuted }]}>
                          vs {opponentName} ({challenge.durationDays} days)
                        </Text>
                      </View>
                      
                      {/* Status Badges */}
                      <View style={[
                        styles.statusBadge, 
                        isPending && { backgroundColor: 'rgba(255, 165, 2, 0.1)' },
                        isActive && { backgroundColor: 'rgba(46, 213, 115, 0.1)' },
                        isCompleted && { backgroundColor: 'rgba(116, 125, 140, 0.1)' }
                      ]}>
                        <Text style={[
                          styles.statusBadgeText,
                          isPending && { color: '#FFA502' },
                          isActive && { color: '#2ED573' },
                          isCompleted && { color: '#747D8C' }
                        ]}>
                          {challenge.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    {/* Challenge Progress duel bar */}
                    {isActive && (
                      <View style={styles.progressSection}>
                        <View style={styles.progressInfoRow}>
                          <Text style={[styles.progressLabel, { color: themeColors.text }]}>
                            You: {myCompletions} days
                          </Text>
                          <Text style={[styles.progressLabel, { color: themeColors.text }]}>
                            {opponentName}: {opponentCompletions} days
                          </Text>
                        </View>
                        {/* Visual head-to-head duel ratio bar */}
                        <View style={[styles.duelBarTrack, { backgroundColor: themeColors.border }]}>
                          <View style={[styles.duelBarFillMy, { width: `${myPercentage}%`, backgroundColor: colors.primary.light }]} />
                        </View>
                        <Text style={[styles.challengeTimer, { color: themeColors.textMuted }]}>
                          ⌛ {remainingDays} days remaining
                        </Text>
                      </View>
                    )}

                    {/* Pending Actions */}
                    {isPending && (
                      <View style={styles.pendingActionArea}>
                        {isCreator ? (
                          <Text style={[styles.pendingExplanation, { color: themeColors.textMuted }]}>
                            Waiting for opponent to accept...
                          </Text>
                        ) : (
                          <View style={styles.inviteButtonArea}>
                            <TouchableOpacity 
                              style={[styles.inviteBtn, styles.acceptInviteBtn]}
                              onPress={() => handleAcceptChallenge(challenge.id)}
                            >
                              <Text style={styles.inviteBtnText}>Accept</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                              style={[styles.inviteBtn, styles.declineInviteBtn]}
                              onPress={() => handleDeclineChallenge(challenge.id)}
                            >
                              <Text style={styles.inviteBtnText}>Decline</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    )}

                    {/* Completed Winner Cards */}
                    {isCompleted && (
                      <View style={[styles.winnerSection, { backgroundColor: themeColors.border }]}>
                        {challenge.winnerId === 'tie' ? (
                          <Text style={[styles.winnerTitle, { color: themeColors.text }]}>🤝 It's a Tie! Both completed equally.</Text>
                        ) : challenge.winnerId === user?.uid ? (
                          <Text style={styles.winnerTitleWin}>🏆 You Won! Higher completions rate achieved.</Text>
                        ) : (
                          <Text style={[styles.winnerTitleLoss, { color: themeColors.text }]}>💀 You Lost! {opponentName} won the duel.</Text>
                        )}
                        <Text style={[styles.winnerTextDetails, { color: themeColors.textMuted }]}>
                          Final: You: {myCompletions} vs Opponent: {opponentCompletions}
                        </Text>
                      </View>
                    )}
                  </View>
                )
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* =====================================================================
          NEW CHALLENGE / DUEL POPUP MODAL
          ===================================================================== */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isChallengeModalVisible}
        onRequestClose={() => setIsChallengeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>⚔️ Propose Streak Duel</Text>
            
            {selectedFriendForDuel && (
              <Text style={[styles.modalSub, { color: themeColors.textMuted }]}>
                Challenging: {selectedFriendForDuel.displayName}
              </Text>
            )}

            <Text style={[styles.inputLabel, { color: themeColors.text }]}>HABIT NAME TO DUEL</Text>
            <TextInput
              placeholder="e.g. Exercise, Meditate, Code"
              placeholderTextColor={themeColors.textMuted}
              value={duelHabitName}
              onChangeText={setDuelHabitName}
              style={[styles.modalInput, { color: themeColors.text, borderColor: themeColors.border, backgroundColor: themeColors.background }]}
            />

            <Text style={[styles.inputLabel, { color: themeColors.text }]}>DURATION (DAYS)</Text>
            <View style={styles.durationSelector}>
              {([7, 14, 30] as const).map((days) => {
                const isActive = duelDuration === days;
                const bg = isActive ? colors.primary.light : themeColors.border;
                const txt = isActive ? '#FFFFFF' : themeColors.text;

                return (
                  <TouchableOpacity
                    key={days}
                    style={[styles.durationBtn, { backgroundColor: bg }]}
                    onPress={() => setDuelDuration(days)}
                  >
                    <Text style={{ color: txt, fontWeight: 'bold' }}>{days} Days</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalActionBtn, styles.modalCloseBtn]} 
                onPress={() => setIsChallengeModalVisible(false)}
              >
                <Text style={[styles.modalBtnText, { color: themeColors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalActionBtn, styles.modalSubmitBtn, { backgroundColor: colors.primary.light }]} 
                onPress={handleCreateDuel}
                disabled={submittingDuel}
              >
                {submittingDuel ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalBtnTextWhite}>Send Invite</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    height: 48,
    borderBottomWidth: 1,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    height: '100%',
  },
  tabText: {
    fontSize: 14,
  },
  badgeCount: {
    backgroundColor: '#FF4757',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.huge,
  },
  searchBox: {
    flexDirection: 'row',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    height: 48,
    alignItems: 'center',
    paddingLeft: spacing.md,
    marginBottom: spacing.xl,
    overflow: 'hidden',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  searchBtn: {
    width: 48,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCard: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  searchResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  friendMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  friendEmail: {
    fontSize: 12,
  },
  addFriendBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
  },
  addFriendText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  addedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addedText: {
    color: '#2ED573',
    fontWeight: 'bold',
    fontSize: 13,
  },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  requestInfo: {
    flex: 1,
  },
  requestSender: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  requestEmail: {
    fontSize: 12,
  },
  requestActions: {
    flexDirection: 'row',
  },
  requestBtn: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  acceptBtn: {
    backgroundColor: '#2ED573',
  },
  declineBtn: {
    backgroundColor: '#FF4757',
  },
  listHeader: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginBottom: spacing.md,
    marginTop: spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.huge,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    lineHeight: 18,
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  friendCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  friendCardSubtext: {
    fontSize: 12,
  },
  challengeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
  },
  challengeBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  leaderboardControls: {
    marginBottom: spacing.md,
  },
  scopeBar: {
    flexDirection: 'row',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    height: 36,
    overflow: 'hidden',
  },
  scopeBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scopeBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  leaderboardCard: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  leaderboardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rankBadge: {
    fontSize: 15,
    fontWeight: 'bold',
    width: 24,
    textAlign: 'center',
  },
  leaderboardName: {
    fontSize: 14,
    flex: 1,
  },
  leaderboardRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leaderboardStreak: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF4757',
    marginRight: spacing.md,
  },
  leaderboardRate: {
    fontSize: 12,
    width: 36,
    textAlign: 'right',
  },
  challengeCard: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  challengeHabit: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  challengeSub: {
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  progressSection: {
    marginTop: spacing.sm,
  },
  progressInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  duelBarTrack: {
    height: 10,
    borderRadius: 5,
    width: '100%',
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  duelBarFillMy: {
    height: '100%',
    borderRadius: 5,
  },
  challengeTimer: {
    fontSize: 11,
    marginTop: 2,
  },
  pendingActionArea: {
    marginTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#747D8C',
    paddingTop: spacing.md,
  },
  pendingExplanation: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  inviteButtonArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inviteBtn: {
    flex: 1,
    height: 36,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  acceptInviteBtn: {
    backgroundColor: '#2ED573',
  },
  declineInviteBtn: {
    backgroundColor: '#FF4757',
  },
  inviteBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  winnerSection: {
    marginTop: spacing.md,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    alignItems: 'center',
  },
  winnerTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  winnerTitleWin: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2ED573',
    marginBottom: 4,
  },
  winnerTitleLoss: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FF4757',
    marginBottom: 4,
  },
  winnerTextDetails: {
    fontSize: 11,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    width: '100%',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modalSub: {
    fontSize: 13,
    marginBottom: spacing.xl,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  modalInput: {
    height: 40,
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    fontSize: 14,
    marginBottom: spacing.xl,
  },
  durationSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.huge,
  },
  durationBtn: {
    flex: 1,
    height: 36,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalActionBtn: {
    height: 40,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.md,
  },
  modalCloseBtn: {
    borderWidth: 1,
    borderColor: '#747D8C',
  },
  modalSubmitBtn: {
    minWidth: 100,
  },
  modalBtnText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalBtnTextWhite: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  refreshSpinnerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    width: '100%',
  },
  refreshSpinner: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
