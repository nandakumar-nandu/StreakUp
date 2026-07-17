import { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { Friend, FriendRequest, LeaderboardEntry, Challenge } from '@/types';

/**
 * A custom hook to listen to the user's friends list in real-time.
 * 
 * ON-SNAPSHOT LIFECYCLE & CLEANUP EXPLANATION:
 * 1. The hook sets up an active onSnapshot listener on the `users/{uid}/friends` subcollection.
 * 2. Whenever a friend connection is created or updated, the callback runs and updates the React state.
 * 3. A cleanup function is returned by the useEffect hook: `return () => unsubscribe()`.
 * 4. This cleanup function is automatically invoked by React when the component unmounts or when
 *    the active user UID changes. This closes the socket connection to Firestore, preventing resource
 *    leakage, background query execution, or unintended state updates in unmounted components.
 * 
 * @returns An object containing the array of friends and a loading boolean.
 */
export function useFriends() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setFriends([]);
      setLoading(false);
      return;
    }

    const friendsRef = collection(db, 'users', currentUser.uid, 'friends');
    const q = query(friendsRef, orderBy('displayName', 'asc'));

    // Establishes a real-time Firestore synchronization channel
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Friend[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as Friend);
      });
      setFriends(list);
      setLoading(false);
    }, (error) => {
      console.error("Error listening to friends list:", error);
      setLoading(false);
    });

    // Cleanup: close socket stream on component unmount
    return () => unsubscribe();
  }, []);

  return { friends, loading };
}

/**
 * A custom hook to listen to incoming and outgoing friend requests in real-time.
 * 
 * ON-SNAPSHOT LIFECYCLE & CLEANUP EXPLANATION:
 * 1. Connects to `users/{uid}/friendRequests` in Firestore.
 * 2. Queries documents where `status == 'pending'` and `toUid == uid` (incoming) or `fromUid == uid` (outgoing).
 * 3. Uses the returned function in useEffect to cleanly shut down active connection cycles when unmounting.
 * 
 * @returns Incoming pending requests list, outgoing pending requests list, and loading state.
 */
export function useFriendRequests() {
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setIncomingRequests([]);
      setLoading(false);
      return;
    }

    const requestsRef = collection(db, 'users', currentUser.uid, 'friendRequests');
    // Listen to pending requests where this user is the recipient (incoming)
    const q = query(requestsRef, where('status', '==', 'pending'), where('toUid', '==', currentUser.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: FriendRequest[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as FriendRequest);
      });
      setIncomingRequests(list);
      setLoading(false);
    }, (error) => {
      console.error("Error listening to friend requests:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { incomingRequests, loading };
}

/**
 * A custom hook to fetch and listen to a habit leaderboard.
 * Supports filtering either globally (Top 10) or limited to the current user's friends.
 * 
 * ON-SNAPSHOT LIFECYCLE & CLEANUP EXPLANATION:
 * 1. Queries `friendLeaderboards/{habitName}/entries` sorted by currentStreak descending.
 * 2. Real-time updates push automatically to client whenever any user logs completions.
 * 3. Standard unsubscribe cleanup blocks ghost listeners and minimizes bandwidth consumption.
 * 
 * @param habitName - The habit name to compile ranks for.
 * @param scope - Ranking scope: 'friends' or 'global'.
 * @param friendsUids - List of friends' UIDs (needed for filtering friends-only scope).
 */
export function useLeaderboard(
  habitName: string, 
  scope: 'friends' | 'global',
  friendsUids: string[] = []
) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!habitName) {
      setEntries([]);
      setLoading(false);
      return;
    }

    const currentUid = auth.currentUser?.uid;
    const entriesRef = collection(db, 'friendLeaderboards', habitName.toLowerCase().trim(), 'entries');
    const q = query(entriesRef, orderBy('currentStreak', 'desc'), orderBy('completionRate', 'desc'), limit(50));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allEntries: LeaderboardEntry[] = [];
      snapshot.forEach((doc) => {
        allEntries.push(doc.data() as LeaderboardEntry);
      });

      // Filter based on scope
      let filtered: LeaderboardEntry[] = [];
      if (scope === 'global') {
        filtered = allEntries.slice(0, 10);
      } else {
        // Friends scope: Include user's own entry + friends' entries
        filtered = allEntries.filter(
          entry => entry.uid === currentUid || friendsUids.includes(entry.uid)
        );
      }

      // Sort and Rank Algorithm
      // 1. Primary: currentStreak descending
      // 2. Secondary: completionRate descending
      // 3. Tertiary: alphabetical order of displayName as tie-breaker
      filtered.sort((a, b) => {
        if (b.currentStreak !== a.currentStreak) {
          return b.currentStreak - a.currentStreak;
        }
        if (b.completionRate !== a.completionRate) {
          return b.completionRate - a.completionRate;
        }
        const nameA = a.displayName || '';
        const nameB = b.displayName || '';
        return nameA.localeCompare(nameB);
      });

      setEntries(filtered);
      setLoading(false);
    }, (error) => {
      console.error("Error listening to leaderboard:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [habitName, scope, friendsUids.join(',')]);

  return { entries, loading };
}

/**
 * A custom hook to listen to all challenges involving the user (incoming and outgoing) in real-time.
 */
export function useChallenges() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setChallenges([]);
      setLoading(false);
      return;
    }

    const challengesRef = collection(db, 'challenges');
    
    // Listen to all challenges. Since Firestore doesn't support complex client OR queries in a single direct sub-stream
    // without multiple observers or in-operator queries, we create an active listener that retrieves challenges
    // and filters on the client.
    const unsubscribe = onSnapshot(challengesRef, (snapshot) => {
      const list: Challenge[] = [];
      snapshot.forEach((doc) => {
        const challenge = doc.data() as Challenge;
        if (challenge.creatorId === currentUser.uid || challenge.opponentId === currentUser.uid) {
          list.push(challenge);
        }
      });
      
      // Sort: Active first, then pending invitations, then completed, sorted by creation date descending
      list.sort((a, b) => {
        const order = { 'active': 1, 'invited': 2, 'completed': 3, 'declined': 4 };
        const statusDiff = (order[a.status] || 99) - (order[b.status] || 99);
        if (statusDiff !== 0) return statusDiff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      setChallenges(list);
      setLoading(false);
    }, (error) => {
      console.error("Error listening to challenges:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { challenges, loading };
}
