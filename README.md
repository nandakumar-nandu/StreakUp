
<p align="left">
  <img src="./assets/logo.svg" alt="StreakUp Logo" width="420" />
</p>

StreakUp is a premium, high-aesthetic React Native application designed to help users track their habits, schedule workouts, monitor progress, and build streaks. Built using Expo TypeScript, Firebase (Auth + Firestore), and React Native Reanimated.


### 📱 Direct Android APK Download

Scan this QR code on your Android device to download and install the APK directly:

<p align="center">
  <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://expo.dev/accounts/kpebble/projects/streakup/builds/1e05632e-cc34-45a0-b3fc-33418398e7d6" alt="APK Download QR Code" />
  <br/>
  <a href="https://expo.dev/accounts/kpebble/projects/streakup/builds/1e05632e-cc34-45a0-b3fc-33418398e7d6">Direct Link to Download APK</a>
</p>



<table table-layout="fixed" width="100%">
  <tr>
    <td align="center" width="33%">
      <strong>Login / Auth</strong><br/>
      <img src="./assets/screenshots/Login.jpg" alt="Login & Register" />
    </td>
    <td align="center" width="33%">
      <strong>Habits & Creation</strong><br/>
      <img src="./assets/screenshots/Habit.jpg" alt="Habits Management" />
    </td>
    <td align="center" width="33%">
      <strong>Social & Friends</strong><br/>
      <img src="./assets/screenshots/Social.jpg" alt="Social Feed" />
    </td>
  </tr>
  <tr>
    <td align="center" width="33%">
      <strong>Streakboard</strong><br/>
      <img src="./assets/screenshots/Streakboard.jpg" alt="Streakboard Checklist" />
    </td>
    <td align="center" width="33%">
      <strong>Analytics & Stats</strong><br/>
      <img src="./assets/screenshots/Stats.jpg" alt="Statistics & Charts" />
    </td>
    <td align="center" width="33%">
      <strong>Settings & Profile</strong><br/>
      <img src="./assets/screenshots/Settings.jpg" alt="User Settings" />
    </td>
  </tr>
</table>

<details open>
  <summary>🎥 Video Walkthrough</summary>
  <br/>
  <p align="center">
    <video src="https://github.com/user-attachments/assets/727aa07f-5810-49ba-8362-761419013a4a" controls width="240" muted autoplay loop></video>
  </p>
</details>

## Tech Stack 

<p align="left">
  <img src="https://img.shields.io/badge/Expo-57.0.7-black?style=for-the-badge&logo=expo" alt="Expo" />
  <img src="https://img.shields.io/badge/React_Native-0.86.0-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React Native" />
  <img src="https://img.shields.io/badge/TypeScript-6.0.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Firebase-10.0.0-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase" />
  <img src="https://img.shields.io/badge/Reanimated-4.5.0-FF5E6C?style=for-the-badge&logo=react&logoColor=white" alt="React Native Reanimated" />
  <img src="https://img.shields.io/badge/SVG-15.0.0-FFB000?style=for-the-badge&logo=svg&logoColor=white" alt="React Native SVG" />
</p>

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
    habitDoc --> hRemind[reminderTime: string &#124; null]
    habitDoc --> hCreated[createdAt: string]
    habitDoc --> hStreak[streak: number]
    habitDoc --> hCompletions[completions: string&#91;&#93; -- cached dates]
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
    challengeDoc --> cComps[creatorCompletions / opponentCompletions: string&#91;&#93;]
    
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

## OpenAI API Setup & Cost Estimation

To configure the AI Habit Coach:
1. Obtain an API key from the [OpenAI Platform](https://platform.openai.com/api-keys).
2. Set `EXPO_PUBLIC_OPENAI_API_KEY` in your `.env` file.
3. Model Choices & Costs:
   - **GPT-3.5-turbo (Default)**: Best for speed (1-2s latency) and cost-efficiency. Average cost is ~$0.002 per request. 1,000 active users making 5 requests/day each costs ~$8.00/month.
   - **GPT-4o (Alternative)**: Best for complex behavioral suggestions but carries a higher latency (~3-5s) and higher costs (~$0.06 per request). 1,000 active users making 5 requests/day costs ~$80.00/month.

---

## AI Coach Data Flow Diagram

```mermaid
graph LR
    User[User Screen: askCoach] -->|chatInput + statsContext| useAICoach[useAICoach Hook]
    useAICoach -->|verify limit & caching| aiCoach[aiCoach.ts Service]
    aiCoach -->|POST request| OpenAI[OpenAI API Endpoint]
    OpenAI -->|GPT response| aiCoach
    aiCoach -->|Save chat history| Storage[(AsyncStorage Cache)]
    aiCoach -->|Display Message| ChatUI[Chat Bubble UI]
```

---

## Onboarding Flow Diagram

```mermaid
graph TD
    Welcome[welcome.tsx: Welcome Screen] -->|Get Started| Goal[goal.tsx: Select Goal]
    Goal -->|AI API Call / Offline Fallback| Suggest[suggest.tsx: Select 6 Starter Habits]
    Suggest -->|Save habits to Firestore| Schedule[schedule.tsx: Set target schedule time]
    Schedule -->|Save slot default time| Notifications[notifications.tsx: Grant push alert permission]
    Notifications -->|Done celebration cannon| Confetti[done.tsx: Celebrate Confetti]
    Confetti -->|Save completion flag| Dashboard[Today Checklist Dashboard]
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
