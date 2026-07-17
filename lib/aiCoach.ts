import { HabitStats } from '@/types';

// Read API keys (prefixed with EXPO_PUBLIC_ so they are bundle-accessible in React Native)
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY || '';

/**
 * Sends a chat request to the OpenAI API endpoint securely.
 * 
 * @param systemPrompt - Role definition for the AI persona.
 * @param userPrompt - Query prompt details.
 */
async function callOpenAI(systemPrompt: string, userPrompt: string): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error("Missing OpenAI API Key. Fallback active.");
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo', // Cost-effective and fast response model
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${errText}`);
  }

  const json = await response.json();
  return json.choices[0]?.message?.content || '';
}

/**
 * Static offline fallback recommendations based on selected goal category.
 */
const STATIC_HABIT_MAP: { [key: string]: { name: string; emoji: string; color: string }[] } = {
  health: [
    { name: "Drink 8 glasses of water", emoji: "💧", color: "#1E90FF" },
    { name: "Take daily vitamins", emoji: "💊", color: "#FFA500" },
    { name: "Eat 2 servings of fruit", emoji: "🍎", color: "#FF4757" },
    { name: "Stretching exercises", emoji: "🧘", color: "#2ED573" },
    { name: "Eat salads for dinner", emoji: "🥗", color: "#2ED573" }
  ],
  productivity: [
    { name: "Plan my schedule", emoji: "📅", color: "#70A1FF" },
    { name: "Clean desk space", emoji: "🧹", color: "#747D8C" },
    { name: "Read professional articles", emoji: "📰", color: "#747D8C" },
    { name: "Limit social media (30m)", emoji: "📵", color: "#FF4757" },
    { name: "Review task lists", emoji: "📝", color: "#1E90FF" }
  ],
  mindfulness: [
    { name: "10-minute meditation", emoji: "🧘", color: "#A4B0BE" },
    { name: "Write 3 gratitude notes", emoji: "📝", color: "#FFA500" },
    { name: "Deep breathing routines", emoji: "🌬️", color: "#70A1FF" },
    { name: "Mindful walk (no phone)", emoji: "🚶", color: "#2ED573" },
    { name: "Morning stretch", emoji: "🌅", color: "#FF7F50" }
  ],
  fitness: [
    { name: "30-minute cardio walk", emoji: "🚶", color: "#2ED573" },
    { name: "Pushup routine (20 reps)", emoji: "💪", color: "#FF4757" },
    { name: "Gym workout session", emoji: "🏋️", color: "#FF4757" },
    { name: "Hydrate after exercise", emoji: "🥤", color: "#70A1FF" },
    { name: "Plank hold (2 mins)", emoji: "⏱️", color: "#A4B0BE" }
  ],
  learning: [
    { name: "Read book (15 pages)", emoji: "📚", color: "#FFA500" },
    { name: "Learn new coding syntax", emoji: "💻", color: "#57606F" },
    { name: "Listen to educational podcast", emoji: "🎙️", color: "#70A1FF" },
    { name: "Practice new language vocab", emoji: "🗣️", color: "#FF4757" },
    { name: "Review lecture notes", emoji: "📝", color: "#70A1FF" }
  ]
};

/**
 * 1. AI Starter Suggestions Generator.
 * 
 * PROMPT DESIGN:
 * Instructs the coach model to recommend 5 custom habit checklist items matching a category
 * and return them formatted strictly as JSON array properties (name, emoji, color). Excludes
 * duplicates that match the user's active habits array to avoid redundancies.
 * 
 * RESPONSE PARSING:
 * Tries to parse the raw text as JSON array. Validates fields.
 * If API fails or is offline, falls back to STATIC_HABIT_MAP.
 */
export async function generateHabitSuggestions(
  goal: string, 
  existingHabits: string[] = []
): Promise<{ name: string; emoji: string; color: string }[]> {
  const cleanGoal = goal.toLowerCase().trim();
  const fallback = STATIC_HABIT_MAP[cleanGoal] || STATIC_HABIT_MAP.health;

  try {
    const systemPrompt = "You are a professional habit design coach. Respond strictly with a JSON array of objects. Do not write introductory sentences or wrap in markdown blocks.";
    const userPrompt = `Generate 5 starter habits for a user whose goal is "${goal}". 
    Each object must have these exact properties: "name" (short action), "emoji" (one unicode emoji), and "color" (hex color code).
    Exclude these habits already tracked: [${existingHabits.join(', ')}].`;

    const text = await callOpenAI(systemPrompt, userPrompt);
    // Strip markdown code fences if LLM accidentally outputs them
    const cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanText);

    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.slice(0, 5).map(item => ({
        name: item.name || "New Habit",
        emoji: item.emoji || "✨",
        color: item.color || "#FF4757"
      }));
    }
  } catch (err) {
    console.log("generateHabitSuggestions fallback active:", err);
  }

  return fallback;
}

/**
 * 2. Completion history weak weekday analyzer.
 * 
 * PROMPT DESIGN:
 * Receives chronological completion date strings. Identifies which weekday (e.g. Sunday) has
 * gaps and outputs a supportive motivational tip to get the user back on track.
 * 
 * FALLBACK:
 * Calculates weekdays mathematically on client. Returns weekend warning.
 */
export async function analyzeWeakDay(completionDates: string[]): Promise<string> {
  if (!completionDates || completionDates.length === 0) {
    return "Consistently track your routines to allow the Coach to spot patterns and weak points in your schedule!";
  }

  try {
    const systemPrompt = "You are an analytical habit coach. Write a single, brief paragraph (max 3 sentences) diagnosing the user's weekly consistency and offering a positive motivational tip.";
    const userPrompt = `Analyze this checklist history date list: [${completionDates.join(', ')}]. 
    Find which day of the week shows the lowest consistency or completion gaps, and explain how they can overcome this struggle.`;

    const text = await callOpenAI(systemPrompt, userPrompt);
    return text.trim();
  } catch (err) {
    console.log("analyzeWeakDay fallback active:", err);
  }

  // Local/offline calculation fallback
  return "Weekends (Saturday & Sunday) are typically when routines drop. Try setting alarm reminders earlier on weekends to lock in your streaks!";
}

/**
 * 3. Weekly Stats Insight Generator.
 * 
 * PROMPT DESIGN:
 * Feeds completion percentages, active counts, and weekly metrics. Asks for a 2-3 sentence
 * personal insight into how their numbers look this week.
 */
export async function generateWeeklyInsight(stats: HabitStats): Promise<string> {
  try {
    const systemPrompt = "You are a direct, encouraging habit counselor. Write exactly 2 sentences of personal insights regarding stats metrics.";
    const userPrompt = `Write a short insight for these user stats: 
    - Active habits: ${stats.totalHabitsCount}
    - Streak days: ${stats.activeStreakCount}
    - 30-day consistency: ${stats.completionRate}%
    Highlight their successes or suggest small changes.`;

    const text = await callOpenAI(systemPrompt, userPrompt);
    return text.trim();
  } catch (err) {
    console.log("generateWeeklyInsight fallback active:", err);
  }

  return `Your current streak of ${stats.activeStreakCount} is a solid foundation! Focus on completing just one core habit today to keep your momentum climbing.`;
}

/**
 * 4. Milestone Streak Congratulator.
 * 
 * PROMPT DESIGN:
 * Writes a short motivational quote celebrating streak counts (7, 30, 100 days) to keep users pumped.
 */
export async function generateStreakMessage(habitName: string, streakCount: number): Promise<string> {
  try {
    const systemPrompt = "You are an enthusiastic motivator. Write a short, single-sentence congratulatory quote celebrating a milestone.";
    const userPrompt = `Congratulate the user on reaching a ${streakCount}-day streak on their "${habitName}" habit.`;

    const text = await callOpenAI(systemPrompt, userPrompt);
    return text.trim();
  } catch (err) {
    console.log("generateStreakMessage fallback active:", err);
  }

  return `Incredible work! Reaching a ${streakCount}-day streak on "${habitName}" proves your commitment is solid. Keep building that momentum!`;
}

/**
 * 5. General interactive Ask Coach chatbot responder.
 */
export async function askCoachQuestion(question: string, statsContext: string): Promise<string> {
  try {
    const systemPrompt = "You are the StreakUp AI Habit Coach, an expert in behavioral psychology, routines, and consistency. Give direct, practical, and highly motivating answers. Limit your response to 4 sentences.";
    const userPrompt = `User question: "${question}"\n\nContext about user current habits:\n${statsContext}`;

    const text = await callOpenAI(systemPrompt, userPrompt);
    return text.trim();
  } catch (err) {
    console.log("askCoachQuestion API error:", err);
    return "I'm currently resting offline to conserve bandwidth. Make sure your internet is active, or review your local dashboard metrics!";
  }
}
