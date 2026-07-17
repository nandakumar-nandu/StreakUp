import { db, auth } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  writeBatch
} from 'firebase/firestore';
import { Challenge } from '@/types';

/**
 * Creates and proposes a new streak challenge duel to a friend.
 * 
 * Writes a new challenge document into the global `challenges` collection.
 * 
 * @param opponentId - Friend's user ID.
 * @param opponentName - Friend's display name.
 * @param habitName - Shared habit name to duel on.
 * @param durationDays - Target length (7, 14, or 30 days).
 */
export async function createChallenge(
  opponentId: string,
  opponentName: string,
  habitName: string,
  durationDays: 7 | 14 | 30
): Promise<string> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("Unauthenticated user attempting to create challenge.");

  const creatorId = currentUser.uid;
  const creatorDoc = await getDoc(doc(db, 'users', creatorId));
  const creatorName = creatorDoc.data()?.displayName || currentUser.displayName || 'StreakUp User';

  const challengesRef = collection(db, 'challenges');
  const newChallengeRef = doc(challengesRef); // Auto-generate ID

  const challenge: Challenge = {
    id: newChallengeRef.id,
    creatorId,
    creatorName,
    opponentId,
    opponentName,
    habitName: habitName.trim(),
    durationDays,
    startDate: '', // Starts empty, set when opponent accepts
    status: 'invited',
    createdAt: new Date().toISOString(),
    creatorCompletions: [],
    opponentCompletions: [],
    winnerId: null
  };

  await setDoc(newChallengeRef, challenge);
  return newChallengeRef.id;
}

/**
 * Accepts a challenge invitation, setting the start date to today and updating status to active.
 * 
 * @param challengeId - Challenge document ID.
 */
export async function acceptChallenge(challengeId: string): Promise<void> {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  const challengeRef = doc(db, 'challenges', challengeId);
  await updateDoc(challengeRef, {
    status: 'active',
    startDate: todayStr
  });
}

/**
 * Declines a pending challenge invitation.
 * 
 * @param challengeId - Challenge document ID.
 */
export async function declineChallenge(challengeId: string): Promise<void> {
  const challengeRef = doc(db, 'challenges', challengeId);
  await updateDoc(challengeRef, {
    status: 'declined'
  });
}

/**
 * Updates a participant's completions history within a challenge.
 * Evaluates whether the challenge has completed and calculates the winner.
 * 
 * @param challengeId - Challenge document ID.
 * @param uid - The participant user ID.
 * @param dateStr - Completion date (YYYY-MM-DD).
 * @param isCompleted - True if completed, false if uncompleted.
 */
export async function updateChallengeProgress(
  challengeId: string,
  uid: string,
  dateStr: string,
  isCompleted: boolean
): Promise<void> {
  const challengeRef = doc(db, 'challenges', challengeId);
  const challengeSnap = await getDoc(challengeRef);
  if (!challengeSnap.exists()) return;

  const challenge = challengeSnap.data() as Challenge;
  if (challenge.status !== 'active') return;

  let creatorComps = [...challenge.creatorCompletions];
  let opponentComps = [...challenge.opponentCompletions];

  const isCreator = uid === challenge.creatorId;

  if (isCreator) {
    if (isCompleted) {
      if (!creatorComps.includes(dateStr)) creatorComps.push(dateStr);
    } else {
      creatorComps = creatorComps.filter(d => d !== dateStr);
    }
  } else {
    if (isCompleted) {
      if (!opponentComps.includes(dateStr)) opponentComps.push(dateStr);
    } else {
      opponentComps = opponentComps.filter(d => d !== dateStr);
    }
  }

  // Check if challenge is completed
  // A challenge is completed when the number of days elapsed since startDate is >= durationDays,
  // or if we have passed the duration window.
  const start = new Date(challenge.startDate);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let status: 'invited' | 'active' | 'completed' | 'declined' = challenge.status;
  let winnerId = challenge.winnerId;

  if (diffDays >= challenge.durationDays) {
    status = 'completed';
    const creatorScore = creatorComps.length;
    const opponentScore = opponentComps.length;

    if (creatorScore > opponentScore) {
      winnerId = challenge.creatorId;
    } else if (opponentScore > creatorScore) {
      winnerId = challenge.opponentId;
    } else {
      winnerId = 'tie';
    }
  }

  await updateDoc(challengeRef, {
    creatorCompletions: creatorComps,
    opponentCompletions: opponentComps,
    status,
    winnerId
  });
}

/**
 * Helper to sync checklist toggles on the Today/Habits tab with active duels.
 * 
 * @param uid - Current user's UID.
 * @param habitName - Name of the habit.
 * @param dateStr - Target date string.
 * @param isCompleted - Check state.
 */
export async function syncActiveChallengesWithHabitToggle(
  uid: string,
  habitName: string,
  dateStr: string,
  isCompleted: boolean
): Promise<void> {
  try {
    const q1 = query(
      collection(db, 'challenges'), 
      where('status', '==', 'active'),
      where('creatorId', '==', uid)
    );
    const q2 = query(
      collection(db, 'challenges'), 
      where('status', '==', 'active'),
      where('opponentId', '==', uid)
    );

    const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
    const activeChallenges: Challenge[] = [];

    snap1.forEach(doc => activeChallenges.push(doc.data() as Challenge));
    snap2.forEach(doc => activeChallenges.push(doc.data() as Challenge));

    for (const challenge of activeChallenges) {
      if (challenge.habitName.toLowerCase().trim() === habitName.toLowerCase().trim()) {
        await updateChallengeProgress(challenge.id, uid, dateStr, isCompleted);
      }
    }
  } catch (err) {
    console.error("Error syncing challenge progress on habit toggle:", err);
  }
}
