# Changelog

All notable changes to the **StreakUp** project will be documented in this file.

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
