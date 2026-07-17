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
  limit, 
  writeBatch
} from 'firebase/firestore';
import { FriendRequest, Friend, UserProfile, LeaderboardEntry } from '@/types';

/**
 * Sends a friend request to another user by recipient UID.
 * 
 * FIRESTORE OPERATION WRITES TO:
 * 1. users/{toUid}/friendRequests/{fromUid_toUid} (Recipient inbox)
 * 2. users/{fromUid}/friendRequests/{fromUid_toUid} (Sender outbox)
 * 
 * We use a dual-write pattern so that both the sender and recipient can read their own
 * friend requests subcollection securely without requiring cross-user collection read permissions,
 * upholding high security and scalability.
 * 
 * @param toUid - Recipients unique user ID.
 */
export async function sendFriendRequest(toUid: string): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("Unauthenticated user attempting to send friend request.");
  
  const fromUid = currentUser.uid;
  if (fromUid === toUid) throw new Error("You cannot send a friend request to yourself.");

  const requestId = `${fromUid}_${toUid}`;

  // Fetch sender profile details to cache inside request
  const senderDoc = await getDoc(doc(db, 'users', fromUid));
  const senderData = senderDoc.data();

  // Fetch recipient profile details to cache inside request
  const recipientDoc = await getDoc(doc(db, 'users', toUid));
  const recipientData = recipientDoc.data();

  const requestData = {
    id: requestId,
    fromUid,
    fromEmail: currentUser.email || '',
    fromDisplayName: senderData?.displayName || currentUser.displayName || 'StreakUp User',
    toUid,
    toEmail: recipientData?.email || '',
    toDisplayName: recipientData?.displayName || 'StreakUp User',
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  const batch = writeBatch(db);

  // Write to recipient request subcollection
  const recipientRequestRef = doc(db, 'users', toUid, 'friendRequests', requestId);
  batch.set(recipientRequestRef, requestData);

  // Write to sender request subcollection
  const senderRequestRef = doc(db, 'users', fromUid, 'friendRequests', requestId);
  batch.set(senderRequestRef, requestData);

  await batch.commit();

  // Visual/Mock Trigger local push notification on receipt
  // (In production, a Firestore Cloud Function would intercept this and invoke Expo Push notifications)
}

/**
 * Accepts a pending friend request and establishes a bidirectional friendship.
 * 
 * FIRESTORE OPERATION WRITES TO:
 * 1. users/{toUid}/friendRequests/{requestId} (Sets status to accepted)
 * 2. users/{fromUid}/friendRequests/{requestId} (Sets status to accepted)
 * 3. users/{toUid}/friends/{fromUid} (Adds sender as recipient's friend)
 * 4. users/{fromUid}/friends/{toUid} (Adds recipient as sender's friend)
 * 
 * @param requestId - Friend request identifier structured as fromUid_toUid.
 */
export async function acceptFriendRequest(requestId: string): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("Unauthenticated user attempting to accept friend request.");

  const [fromUid, toUid] = requestId.split('_');

  const batch = writeBatch(db);

  // Update statuses to accepted in both inbox & outbox
  const reqRecipientRef = doc(db, 'users', toUid, 'friendRequests', requestId);
  const reqSenderRef = doc(db, 'users', fromUid, 'friendRequests', requestId);
  batch.update(reqRecipientRef, { status: 'accepted' });
  batch.update(reqSenderRef, { status: 'accepted' });

  // Load user data to register friendships
  const fromUserDoc = await getDoc(doc(db, 'users', fromUid));
  const fromData = fromUserDoc.data();

  const toUserDoc = await getDoc(doc(db, 'users', toUid));
  const toData = toUserDoc.data();

  const joinedAt = new Date().toISOString();

  // Create friend entry for Recipient pointing to Sender
  const recipientFriendRef = doc(db, 'users', toUid, 'friends', fromUid);
  batch.set(recipientFriendRef, {
    uid: fromUid,
    email: fromData?.email || '',
    displayName: fromData?.displayName || 'StreakUp User',
    avatarUrl: fromData?.photoURL || null,
    currentStreak: fromData?.streakDays || 0,
    joinedAt
  });

  // Create friend entry for Sender pointing to Recipient
  const senderFriendRef = doc(db, 'users', fromUid, 'friends', toUid);
  batch.set(senderFriendRef, {
    uid: toUid,
    email: toData?.email || '',
    displayName: toData?.displayName || 'StreakUp User',
    avatarUrl: toData?.photoURL || null,
    currentStreak: toData?.streakDays || 0,
    joinedAt
  });

  await batch.commit();
}

/**
 * Declines a pending friend request.
 * 
 * FIRESTORE OPERATION WRITES TO:
 * 1. users/{toUid}/friendRequests/{requestId} (Updates status to declined)
 * 2. users/{fromUid}/friendRequests/{requestId} (Updates status to declined)
 * 
 * @param requestId - Friend request identifier structured as fromUid_toUid.
 */
export async function declineFriendRequest(requestId: string): Promise<void> {
  const [fromUid, toUid] = requestId.split('_');

  const batch = writeBatch(db);

  const reqRecipientRef = doc(db, 'users', toUid, 'friendRequests', requestId);
  const reqSenderRef = doc(db, 'users', fromUid, 'friendRequests', requestId);

  batch.update(reqRecipientRef, { status: 'declined' });
  batch.update(reqSenderRef, { status: 'declined' });

  await batch.commit();
}

/**
 * Retrieves the complete list of accepted friends for a specific user.
 * 
 * FIRESTORE OPERATION READS FROM:
 * - users/{uid}/friends (returns all friend connection documents)
 * 
 * @param uid - Unique user ID.
 */
export async function getFriends(uid: string): Promise<Friend[]> {
  const friendsSnap = await getDocs(collection(db, 'users', uid, 'friends'));
  const friendsList: Friend[] = [];
  friendsSnap.forEach((doc) => {
    friendsList.push(doc.data() as Friend);
  });
  return friendsList;
}

/**
 * Searches the global database for users matching a query string (by email or display name prefix).
 * 
 * FIRESTORE OPERATION READS FROM:
 * - users (Queries global profiles)
 * 
 * @param queryText - Search keyword (email or name).
 */
export async function searchUsers(queryText: string): Promise<UserProfile[]> {
  const cleanQuery = queryText.trim();
  if (!cleanQuery) return [];

  // Search by exact email match
  const emailQuery = query(collection(db, 'users'), where('email', '==', cleanQuery));
  const emailSnap = await getDocs(emailQuery);
  const results: UserProfile[] = [];

  emailSnap.forEach((doc) => {
    results.push(doc.data() as UserProfile);
  });

  if (results.length > 0) return results;

  // Search by displayName prefix (case-sensitive fallback)
  const nameQuery = query(
    collection(db, 'users'), 
    where('displayName', '>=', cleanQuery),
    where('displayName', '<=', cleanQuery + '\uf8ff'),
    limit(15)
  );
  
  const nameSnap = await getDocs(nameQuery);
  nameSnap.forEach((doc) => {
    const data = doc.data() as UserProfile;
    // Prevent duplicate entries
    if (!results.some(r => r.uid === data.uid)) {
      results.push(data);
    }
  });

  return results;
}

/**
 * DENORMALIZATION STRATEGY FOR LEADERBOARD PERFORMANCE:
 * Instead of querying all friends, loading each friend's individual habits subcollection,
 * computing streaks in real-time, and sorting them on the client (which scales O(N*H) where N is friends count
 * and H is habits count, generating immense client-side work and roundtrip costs),
 * we write flat leaderboard rows directly to a shared, indexable root path:
 * `friendLeaderboards/{habitName}/entries/{uid}`
 * 
 * When a user completes a habit, the app updates this single entry. 
 * Generating leaderboards is then simplified to a single query on `friendLeaderboards/{habitName}/entries`
 * sorted by currentStreak descending, running at O(1) query complexity for client devices.
 * 
 * @param uid - The habit owner's UID.
 * @param displayName - Owner's displayName.
 * @param photoURL - Owner's avatar image URL.
 * @param habitName - Visual name of the habit.
 * @param streak - Current consecutive completions count.
 * @param completionRate - Monthly completion percentage.
 */
export async function updateLeaderboardEntry(
  uid: string,
  displayName: string | null,
  photoURL: string | null,
  habitName: string,
  streak: number,
  completionRate: number
): Promise<void> {
  const entryId = uid;
  const leaderboardRef = doc(db, 'friendLeaderboards', habitName.toLowerCase().trim(), 'entries', entryId);

  const entry: LeaderboardEntry = {
    uid,
    displayName: displayName || 'StreakUp User',
    avatarUrl: photoURL || null,
    habitName,
    currentStreak: streak,
    completionRate
  };

  await setDoc(leaderboardRef, entry, { merge: true });
}
