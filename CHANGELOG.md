# Changelog

All notable changes to the **StreakUp** project will be documented in this file.

## [0.6.0] - 2026-07-17 13:30 (Asia/Kolkata)

### Added
- Created `/hooks/useStats.ts` custom hook to fetch and compute real-time Firestore habit statistics including weekly completion percentages, top performance rates, current streaks leaderboard, monthly totals, and best day of week metrics.
- Redesigned the Stats tab (`app/(tabs)/stats.tsx`) incorporating a responsive `BarChart` using `react-native-chart-kit` mapped to theme colors, along with top habits progress bars and a scrollable leaderboard.

## [0.5.0] - 2026-07-17 13:25 (Asia/Kolkata)

### Added
- Created `/lib/streakCalculator.ts` utility library implementing algorithms for `calculateCurrentStreak`, `calculateLongestStreak`, and `getCompletionRate` with detailed JSDoc comments.
- Refactored Firestore database operations helper `toggleHabitCompletion` to perform dynamic streak calculations and update the habit's active streak on save.
- Added dynamic single habit subscription helper `subscribeToHabit` to support detail screen updates in real-time.
- Created dynamic habit detail screen `app/habit/[id].tsx` featuring a monthly calendar heatmap using `react-native-calendars` (completed days painted using habit custom color), current/longest streak badges, and a 30-day completion rate counter.
- Integrated `onPress` callback in `HabitCard` to navigate to the dynamic detail route.
- Registered the details dynamic route mapping inside the root layout Stack.

## [0.4.0] - 2026-07-17 11:30 (Asia/Kolkata)

### Added
- Configured detailed comments for all credentials in `lib/firebase.ts` explaining variables and console locations.
- Developed `useAuth` hook and `<AuthProvider>` inside `hooks/useAuth.ts` with JSDoc typing details.
- Implemented `(auth)/login` and `(auth)/register` screens with dark/light mode responsive form validation and loaders.
- Configured an authentication routing guard in `app/_layout.tsx` leveraging `useSegments()` to redirect unauthenticated users.
- Created Firestore CRUD database operations helper library `lib/habitsService.ts` utilizing real-time subscriptions (`subscribeToHabits`, `subscribeToCompletions`).
- Migrated Today dashboard (`app/(tabs)/index.tsx`), Habits dashboard (`app/(tabs)/habits.tsx`), and Settings dashboard (`app/(tabs)/settings.tsx`) to pull and sync data in real-time from Firestore.
- Added habit deletion functionality directly inside cards (`components/HabitCard.tsx`).
- Detailed the subcollection design and cached data model in `README.md`, `WALKTHROUGH.md`, and `CHANGELOG.md`.

## [0.3.0] - 2026-07-15 16:18 (Asia/Kolkata)

### Added
- Installed `react-native-svg` and `react-native-confetti-cannon` to support visual analytics and celebratory feedback.
- Created `ProgressRing` component using circular SVG paths and Reanimated `useSharedValue` and `useAnimatedProps` to smoothly morph the progress arc.
- Created `AnimatedCheckbox` component using Reanimated `withSpring` bounce physics and `interpolateColor` background fills.
- Rebuilt the **Today** screen dashboard with a date header, state-driven checklist, progress ring visualizers, and "All Done!" achievements banners.
- Integrated `ConfettiCannon` which triggers full-screen celebratory particle explosions upon completing all scheduled items.
- Documented worklet mechanisms and Reanimated API usages in plain English code comments.

## [0.2.0] - 2026-07-15 13:17 (Asia/Kolkata)

### Added
- Created `CreateHabitModal` featuring a name input, grid emoji selector (20 options), preset color swatches (8 presets), frequency picker, and optional reminder switch.
- Designed custom pure JavaScript time selection UI inside the modal (Hours, Minutes, AM/PM) to prevent native module build limits.
- Implemented `HabitCard` UI component with progress streaks, category accents, and checking checkbox triggers.
- Updated `Habit` type structure in `types/index.ts` to include emoji, color, and reminderTime properties.
- Configured local state handling in `app/(tabs)/habits.tsx` to add new habit configurations dynamically and mark them complete for today.

## [0.1.0] - 2026-07-14 13:31 (Asia/Kolkata)

### Added
- Initialized Expo TypeScript app scaffold using Expo SDK 57.
- Established clean root directory structure: `/app`, `/components`, `/hooks`, `/lib`, `/types`, and `/constants`.
- Configured bottom tab navigation with four main screens: **Today**, **Habits**, **Stats**, and **Settings** using Expo Router.
- Designed system tokens and theme values (colors, typography, spacing, shadows) in `constants/theme.ts`.
- Set up Firebase Client config helper in `lib/firebase.ts` with offline persistence support.
- Defined TypeScript interface definitions for Users, Habits, and Workouts in `types/index.ts`.
- Added standard configurators: `.gitignore` (ignoring `.env`), `.env.example`, and `.env` template.
- Wrote project onboarding documentation: `README.md`, `WALKTHROUGH.md`, and `SCREENTOUR.md`.
