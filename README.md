# StreakUp — Habit and Fitness Tracker

StreakUp is a premium, high-aesthetic React Native application designed to help users track their habits, schedule workouts, monitor progress, and build streaks. Built using Expo TypeScript, Firebase (Auth + Firestore), and React Native Reanimated.

---

## App Concept & Features

StreakUp leverages gamification to keep users engaged and motivated:
- **Streak Multipliers**: Build consecutive days of completed habits to multiply your visual status level.
- **Fitness Tracking**: Record workouts (duration, calories, distance) and pair them with active habits.
- **Aesthetic Visualizations**: Dynamic progress charts and rich, custom dark mode styling with glassmorphism touches.
- **Real-time Sync**: Synced securely via Firebase Auth and Firestore with offline-first support.

---

## Navigation Structure

```mermaid
graph TD
    Root[Root layout: app/_layout.tsx] --> TabsLayout[Tabs Layout: app/tabs/_layout.tsx]
    TabsLayout --> TodayTab[Today Tab: app/tabs/index.tsx]
    TabsLayout --> HabitsTab[Habits Tab: app/tabs/habits.tsx]
    TabsLayout --> StatsTab[Stats Tab: app/tabs/stats.tsx]
    TabsLayout --> SocialTab[Social Tab: app/tabs/social.tsx]
    TabsLayout --> SettingsTab[Settings Tab: app/tabs/settings.tsx]
```

---

## Social Feature Data Flow

```mermaid
graph LR
    UserA[User A] -->|sendFriendRequest| Request[Friend Request: pending]
    Request -->|acceptFriendRequest| UserB[User B]
    UserB -->|Establishes| Friends[Friends Subcollection: UserA & UserB]
    Friends -->|Completing Habit| Leaderboard[Leaderboard: friendLeaderboards/entries]
    Friends -->|Duel Challenge| Duel[Streak Challenges: head-to-head]
```

---

## Habits Screen Component Structure

```mermaid
graph TD
    HabitsScreen[Habits Screen: app/tabs/habits.tsx] --> SummaryCard[Summary Card: active habits count]
    HabitsScreen --> HabitList[List ScrollView]
    HabitsScreen --> FAB[Floating Action Button +]
    
    HabitList --> HabitCard[HabitCard Component]
    
    FAB --> |Press| CreateModal[CreateHabitModal Component]
    CreateModal --> NameInput[Habit Name TextInput]
    CreateModal --> EmojiGrid[Emoji Picker: 20 Grid]
    CreateModal --> ColorPicker[Color Picker: 8 Swatches]
    CreateModal --> FreqSelector[Frequency Segment]
    CreateModal --> ReminderToggle[Reminder Switch & Custom Time Picker]
```

---

## Cloud Firestore Data Model Structure

```mermaid
graph TD
    usersCol[users Collection] --> userDoc[User Document: uid]
    userDoc --> habitsSub[habits Subcollection]
    userDoc --> completionsSub[completions Subcollection]
    userDoc --> friendsSub[friends Subcollection]
    userDoc --> requestsSub[friendRequests Subcollection]
    userDoc --> settingsSub[settings/privacy Document]
    
    habitsSub --> habitDoc[Habit Document: habitId]
    habitDoc --> hId[id: string]
    habitDoc --> hName[name: string]
    habitDoc --> hEmoji[emoji: string]
    habitDoc --> hColor[color: string]
    habitDoc --> hFreq[frequency: string]
    habitDoc --> hRemind[reminderTime: string | null]
    habitDoc --> hCreated[createdAt: string]
    habitDoc --> hStreak[streak: number]
    habitDoc --> hCompletions[completions: string[] -- cached dates]
    habitDoc --> hPublic[isPublic: boolean]
    habitDoc --> hVis[visibility: string]
    
    completionsSub --> compDateDoc[Date Document: YYYY-MM-DD]
    compDateDoc --> habitsSub2[habits Subcollection]
    habitsSub2 --> compHabitDoc[Completed Habit Document: habitId]
    compHabitDoc --> completedAt[completedAt: string]

    friendsSub --> friendDoc[Friend Document: friendUid]
    friendDoc --> fUid[uid: string]
    friendDoc --> fName[displayName: string]
    friendDoc --> fEmail[email: string]
    friendDoc --> fStreak[currentStreak: number]
    
    requestsSub --> reqDoc[Request Document: requestId]
    reqDoc --> rFrom[fromUid: string]
    reqDoc --> rTo[toUid: string]
    reqDoc --> rStatus[status: string]

    rootChallenges[challenges Collection] --> challengeDoc[Challenge Document: challengeId]
    challengeDoc --> cCreator[creatorId: string]
    challengeDoc --> cOpponent[opponentId: string]
    challengeDoc --> cStatus[status: string]
    challengeDoc --> cComps[creatorCompletions / opponentCompletions: string[]]
    
    rootLeaderboards[friendLeaderboards Collection] --> lbHabit[Habit Document: habitName]
    lbHabit --> lbEntries[entries Subcollection]
    lbEntries --> lbEntryDoc[Entry Document: uid]
    lbEntryDoc --> lbStreak[currentStreak: number]
    lbEntryDoc --> lbRate[completionRate: number]
```

---

## Streak Calculation Algorithm Flowchart

```mermaid
graph TD
    Start([Start: calculateCurrentStreak]) --> EmptyCheck{Is completions empty?}
    EmptyCheck -- Yes --> ReturnZero[Return 0]
    EmptyCheck -- No --> SortDates[Sort unique dates descending]
    
    SortDates --> GetDates[Get local date strings for Today and Yesterday]
    GetDates --> CheckMostRecent{Is most recent completion Today or Yesterday?}
    
    CheckMostRecent -- No --> ReturnZero2[Return 0 - Streak is broken]
    CheckMostRecent -- Yes --> InitStreak[Set streak = 0]
    
    InitStreak --> InitTracker[Set Tracker Date = most recent completion date]
    InitTracker --> CheckTrackerInCompletions{Is Tracker Date in completions?}
    
    CheckTrackerInCompletions -- Yes --> Increment[Increment streak by 1]
    Increment --> DecrementTracker[Subtract 1 day from Tracker Date]
    DecrementTracker --> CheckTrackerInCompletions
    
    CheckTrackerInCompletions -- No --> ReturnStreak[Return streak]
```

---

## Setup Prerequisites

To run this app locally:
1. **Node.js**: Make sure Node.js (v18+) is installed.
2. **Expo Go**: Install the Expo Go app on your iOS or Android physical device, or set up an emulator.
3. **Firebase Project**:
   - Create a Firebase project in the [Firebase Console](https://console.firebase.google.com/).
   - Enable **Authentication** (Email/Password) and **Cloud Firestore**.
   - Create a Web App configuration to get your Firebase credentials.
4. **Environment Variables**:
   - Copy `.env.example` to `.env` in the root directory.
   - Replace the placeholder credentials with your actual Firebase Web Config values.
5. **React Native Reanimated Setup**:
   - Reanimated is pre-installed. If rebuilding from scratch, ensure `react-native-reanimated/plugin` is configured in your babel plugins array, and clear your bundler cache with `npx expo start --clear` if worklet compilation warnings arise.

### Installation & Launching

```bash
# Install dependencies
npm install

# Start the Expo development server
npm run start
```

---

## Google Play Store Build & Submission

StreakUp is configured for native compilation and deployment using EAS (Expo Application Services). Follow these steps to build and submit your app for the Google Play Store:

### 1. Prerequisites
- Install the EAS CLI globally:
  ```bash
  npm install -g eas-cli
  ```
- Log in to your Expo account:
  ```bash
  eas login
  ```
- Link your local workspace to your EAS project:
  ```bash
  eas project:init
  ```

### 2. Configure Build Profiles (`eas.json`)
The build profiles are configured in [eas.json](file:///d:/projects/StreakUp/eas.json). It defines development, preview (for APK testing), and production (for store submission) build setups.

### 3. Generate Android App Bundle (.aab)
To build a signed production Android App Bundle (`.aab`) for Google Play Store upload, run:
```bash
eas build --platform android --profile production
```
*EAS Build will handle key generation, package signing, and bundle compiling on secure cloud servers, returning a download link to your `.aab` file once complete.*

### 4. Direct Store Submission
If you have a Google Play Developer account and have configured your service account credentials, submit the compiled build directly from the CLI:
```bash
eas submit --platform android
```
Alternatively, download the `.aab` bundle from your Expo dashboard and manually upload it under the **Production** track inside the [Google Play Console](https://play.google.com/console/).
