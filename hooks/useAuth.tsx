import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

/**
 * Interface representing the exposed authentication state and operations.
 */
export interface AuthContextType {
  /** The currently authenticated Firebase user, or null if logged out */
  user: User | null;
  /** Indicates whether the initial auth state check is in progress */
  loading: boolean;
  /**
   * Log in a user using email and password.
   * @param email - The user's registration email address.
   * @param password - The user's account password.
   * @returns A promise resolving to the logged-in Firebase UserCredential.
   */
  login: (email: string, password: string) => Promise<any>;
  /**
   * Register a new user and set their display name.
   * @param email - The registration email address.
   * @param password - The account password.
   * @param displayName - The user's visual profile name.
   * @returns A promise resolving to the created Firebase UserCredential.
   */
  register: (email: string, password: string, displayName: string) => Promise<any>;
  /**
   * Log out the current user session.
   * @returns A promise resolving when sign-out is complete.
   */
  logout: () => Promise<void>;
}

// Create the Context with a default undefined value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Context Provider component that wraps your app and provides the authentication state.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // onAuthStateChanged registers an observer to listen for authentication status changes.
    // When the app initializes or the user signs in/out, the listener fires.
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Backfill user profile document in Firestore if not already present
        const userRef = doc(db, 'users', currentUser.uid);
        getDoc(userRef).then((snap) => {
          if (!snap.exists()) {
            setDoc(userRef, {
              uid: currentUser.uid,
              email: currentUser.email || '',
              displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'StreakUp User',
              photoURL: currentUser.photoURL || null,
              createdAt: new Date().toISOString(),
              points: 0,
              streakDays: 0
            }, { merge: true });
          }
        }).catch(err => console.error("Error backfilling user doc:", err));
      }
      setLoading(false);
    });

    // Unsubscribe from auth listener when component unmounts to prevent memory leaks
    return unsubscribe;
  }, []);

  /**
   * Sign in an existing user using email and password.
   * 
   * @param email - The user's registration email address.
   * @param password - The user's account password.
   * @returns A promise resolving to the logged-in Firebase UserCredential.
   */
  const login = async (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  /**
   * Register a new user and set their display name.
   * 
   * @param email - The registration email address.
   * @param password - The account password.
   * @param displayName - The user's visual profile name.
   * @returns A promise resolving to the created Firebase UserCredential.
   */
  const register = async (email: string, password: string, displayName: string) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    if (credential.user) {
      await updateProfile(credential.user, { displayName });
      // Create user profile doc in Firestore immediately
      await setDoc(doc(db, 'users', credential.user.uid), {
        uid: credential.user.uid,
        email: email,
        displayName: displayName,
        photoURL: null,
        createdAt: new Date().toISOString(),
        points: 0,
        streakDays: 0
      });
    }
    return credential;
  };

  /**
   * Terminate user session.
   * 
   * @returns A promise resolving when sign-out is complete.
   */
  const logout = async () => {
    return signOut(auth);
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook to access authentication context.
 * Must be used within an AuthProvider.
 * @returns The authentication context object.
 * @throws An error if hook is accessed outside an AuthProvider wrapper.
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
