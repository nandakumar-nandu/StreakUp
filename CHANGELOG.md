# Changelog

All notable changes to the **StreakUp** project will be documented in this file.

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
