# Walkthrough: StreakUp

This document details the user journey and guides you through the planned features of the StreakUp app.

---

## App Overview & Planned Features (🚧)

StreakUp is designed to be highly interactive and rewarding. Here is a list of features currently under construction:

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
```
