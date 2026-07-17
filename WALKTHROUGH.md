# Walkthrough: StreakUp

This document details the user journey and guides you through the planned features of the StreakUp app.

---

## App Overview & Core Features

StreakUp is designed to be highly interactive and rewarding. Here is a summary of the core features included in the release:

1. **🔒 Secure Authentication (Auth)**:
   - Email/password register & sign-in.
   - Profile state persistence across app reloads.
2. **🔥 Habit Management & Checking**:
   - Create, edit, and delete habits with flexible frequencies (daily, specific days).
   - Tap-to-complete circular check boxes on the **Today** tab.
3. **🏋️ Workout Logger**:
   - Record duration, type, calories burned, and custom text notes.
   - Sync logs directly into your profile history.
4. **📊 Analytics & Charts**:
   - Visual graph representations showing completion rates, active streak records, and weekly progression.
5. **🌓 Light / Dark Mode Toggle**:
   - Full compatibility with native settings, and manual options inside Settings.

---

## Planned User Journey

This diagram outlines how a user will experience the application, from initial onboarding to regular streak tracking and review.

```mermaid
journey
    title StreakUp User Lifecycle
    section Onboarding & Install
      Install app: 5: User
      Launch app & view Today placeholder: 4: User
      Configure Firebase credentials in settings: 3: User
    section Routine Building
      Navigate to Habits tab: 5: User
      Create a new Habit (e.g. 5K Run, Meditate): 4: User
      Set frequency and time target: 4: User
    section Daily Action
      Check Today tab checklist: 5: User
      Mark habit complete: 5: User
      Input logged workout details: 4: User
      Visual spark animations / streak updates: 5: System
    section Retention & Analytics
      Navigate to Stats tab: 4: User
      Examine habit completion percentage: 4: User
      Inspect longest active streak record: 5: User
---

## Creating a Habit (Step-by-Step)

Here is a step-by-step walkthrough of creating and tracking a habit in the new UI:

1. **Open the Creation Form**:
   On the **Habits** screen, tap the floating `+` button in the bottom-right corner. This slides up the `CreateHabitModal`.
   
2. **Configure Habit Fields**:
   - **Name**: Type a name (e.g., "Drink 3L Water" or "Go for a Run").
   - **Emoji**: Pick an icon from the 20 preset grid (e.g., 🏃, 🧘, 💧).
   - **Color**: Select one of the 8 preset color rings. This color will be used for the card indicator border and active action buttons.
   - **Frequency**: Choose between `Daily`, `Weekdays`, `Weekends`, or `Custom`.
   - **Reminder**: Toggle the switch. If active, pick a target hour, minute, and AM/PM marker (e.g., `08:30 AM`).

3. **Save and Render**:
   - Tap **Create**. The modal closes, resets all form entries, and inserts the new habit at the top of your list.
   - The habit list displays a `HabitCard` matching your custom accent, emoji, name, and reminder time.

4. **Mark Complete**:
   - Click the checkmark bubble on the right side of the card.
   - The card's right border highlights, the checkmark fills with your habit's accent color, and the fire icon increments by `1` (indicating a streak update). Tapping again reverts the state.

---

## Daily Habit Tracking (Commit 3)

The **Today** dashboard is where you complete your routine tasks and watch your daily progress progress:

1. **Dashboard Overview**:
   - The screen shows the formatted current date at the top.
   - A large, central **Progress Ring** displays the current completion status (e.g., `1/3` completed) and animates the progress arc in real time.

2. **Check-off Interactions**:
   - Tap any habit on the checklist to toggle its completion state.
   - **Bounce Animation**: The checkbox triggers a scale spring bounce (expanding and contracting naturally) and transitions its border and background fill colors.
   - **Arc Morph Animation**: The top progress ring smoothly transitions to the new value (e.g., from `33%` to `66%`) using a 500ms duration timing ease-out transition.

3. **Celebration Explosion**:
   - When the final remaining habit is checked off, the progress ring completes to 100%, and a celebratory trophy banner emerges saying "Streak Maintained!".
   - Simultaneously, a **Confetti Cannon** fires, showering the screen with colored confetti particles to celebrate your daily milestone.

---

## Firebase Auth & Firestore Persistence (Commit 4)

All user accounts and habit tracker operations are fully integrated and synced with Firebase services:

1. **Authentication Screens**:
   - Access is restricted. When the app loads, if no user is signed in, they are redirected to `app/(auth)/login.tsx`.
   - Users can register using email, display name, and password at `app/(auth)/register.tsx`. Successful signup logs them in automatically.
   - User names and emails are dynamically shown under the **Settings** tab. A secure "Log Out" button clears local storage persistence and resets the view back to the Login screen.

2. **Unidirectional Firestore Synchronization**:
   - Mock data lists have been completely migrated to Cloud Firestore.
   - Creating a habit writes a definition document to `users/{uid}/habits/{habitId}`.
   - Checking/unchecking a habit writes/deletes a document in the subcollection `users/{uid}/completions/{date}/habits/{habitId}` and updates the `streak` counter and completion array on the habit definition document itself.
   - Real-time changes are fetched using `onSnapshot` listeners. Offline cache support is enabled, ensuring operations function smoothly when network access is lost.

---

## Streaks and History (Commit 5)

Commit 5 introduces advanced analytics and visual progress tools to review habit history:

1. **Dynamic Streak Calculation**:
   - The utility `lib/streakCalculator.ts` dynamically parses lists of completion date strings.
   - **Current Streak**: Counts backwards day-by-day starting from the most recent completion. If the most recent completion is prior to yesterday, the streak instantly resets to `0`.
   - **Longest Streak**: Compares calendar intervals chronological order. If gaps greater than 1 day occur, it saves the highest streak achieved and restarts tracking.
   - **Completion Rate**: Computes the percentage of completed days relative to a rolling window (e.g. 30 days) to keep you informed of consistency.

2. **Habit Detail Screen**:
   - Tapping any card on the **Habits** screen navigates you to `app/habit/[id].tsx`.
   - The screen renders an analytical dashboard (Current Streak, Longest Streak, 30-Day Completion Rate) and an interactive monthly calendar heatmap.
   - Completed dates are painted on the calendar in green using the habit's custom color accent.
   - A header action bar includes custom back button navigation and habit deletion triggers.

---

## Statistics and Insights (Commit 6)

StreakUp includes a comprehensive analytics dashboard on the **Stats** screen (`app/(tabs)/stats.tsx`):

1. **Reactive Computation via `useStats` Hook**:
   - The hook `hooks/useStats.ts` compiles statistics in real-time by listening to your Firestore habits.
   - When you complete a task on the checklist, metrics instantly recalculate and redraw.

2. **Weekly Completion Bar Chart**:
   - Displays a custom `BarChart` using React Native Chart Kit showing progress over the last 7 days.
   - Each bar represents a weekday (e.g. `Mon`, `Tue`) and its height matches the percentage of active habits completed on that day.

3. **Analytics Metrics & Leaderboard**:
   - **Monthly Total completions**: Tally of completions in the current calendar month.
   - **Best Day of Week**: Shows the day you historically complete the most routines (e.g. `Wednesday`).
   - **Leaderboard**: Lists your habits ranked in descending order by active streak, featuring flame count badges.
   - **Top Performance**: Displays your top 3 habits with overall consistency percentages and custom progress indicators matching each habit's color.

---

## Notifications and Settings (Commit 7)

Commit 7 completes the local alarm reminders and custom user styling preferences:

1. **Permission Explanation Flow**:
   - The settings tab checks notification permissions. If missing, it draws a warnings alert box explaining why alerts are used, with an action trigger to "Grant Permission".

2. **Expo Notification Reminders**:
   - Configures daily local push alarms matching user-defined times on habits (uses calendar-based OS triggers for offline functionality).
   - Dynamically schedules a "Streak at risk!" notification at 8:00 PM today if a habit has `streak > 3` and is not yet completed today. If the checklist transitions to completed, today's risk alarm is instantly cancelled and rescheduled starting tomorrow.

3. **Habit and Theme Preferences**:
   - Master Switch: Disables/enables reminders globally.
   - Individual Toggles: List of all active routines to toggle reminders independently.
   - Persistent Dark Mode: Segments control (System, Light, Dark) saved in `AsyncStorage`. All application interfaces listen to the Theme Provider context and morph color schemes instantly.

4. **Account Details**:
   - Visualizes user profile displayName and email.
   - Features a red logout button that clears session tokens and redirects back to the login screen.

---

## Social & Accountability, Streak Challenges & Leaderboards (Commit 9)

StreakUp version 1.1.0 builds a social accountability structure:

1. **Social & Friends Graph**:
   - Allows users to search the global user base by display name or email, sending/receiving real-time friend requests.
   - Friends lists display names, initial avatars, current active streak records, and action duels options.

2. **Leaderboards**:
   - Renders ranked lists comparing habit progress dynamically.
   - Filterable between "My Friends" and "Global Top 10".
   - Utilizes a tie-breaking algorithm (Streaks desc -> Completion rate desc -> Alphabetical name).
   - Updates denormalized leaderboard entries in real-time as users check off public habits.

    - Automatically synchronizes check-offs from the main Today checklist to progress records.

---

## Onboarding, AI Coach, & Smart Insights (Commit 10) - 🚀 v1.2.0 Complete

StreakUp version 1.2.0 introduces first-launch guidance, AI habit intelligence, and local performance analysis:

1. **Step-by-Step Onboarding Flow**:
   - Welcome Screen: Tagline and onboarding initialization triggers.
   - Goal Configuration: Collects primary user goals (Health, Productivity, Mindfulness, Fitness, Learning).
   - Starter Suggestions: Dynamically presents 6 customized habits suggested by the AI Coach. Checking items writes them directly to the user's Firestore routines database.
   - Target Slots scheduling: Set default daily reminder times based on target periods (Morning, Afternoon, Evening, Flexible).
   - Confetti Celebration: Confetti Cannon drops upon completion, setting the permanent `AsyncStorage` flag preventing re-launch showing. Users can trigger a reset in settings.

2. **AI Habit Coach**:
   - Integrates secure OpenAI completion endpoints to suggest starter routines, analyze weak days, write weekly insights, and generate milestone motivation quotes.
   - Stores user conversation histories locally inside AsyncStorage to prevent database bloat.
   - Enforces a client-side limit of **10 requests per user per day** with cache configurations.
   - Integrates a chat interface sub-tab directly into the Stats screen, including text fields and skeleton loaders.

3. **Smart Insights Local Engine**:
   - Runs calculations locally on-device without cloud costs.
   - Momentum Score: rolling 7-day consistency level (0-100) mapped to color-coded cards (Red/Amber/Green).
   - At Risk Warnings: displays amber warnings above unchecked habits with streaks > 5.
   - Best Time of Day: identifies user productivity hours from completion timestamps.
   - Personal Best: badge highlighting their longest active habit streak.
   - Displays insights on Today checklist header and Stats panels, using Reanimated for collapsible AI insight banners.

4. **Accessibility Overlays**:
   - Added standard screen reader accessibility tags (`accessibilityLabel`, `accessibilityHint`, `accessibilityRole`, and `accessibilityState`) to every interface element and card throughout the application.
   - Documented WCAG AA/AAA contrast ratios for light and dark schemes.

