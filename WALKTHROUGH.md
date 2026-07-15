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

