/**
 * StreakUp Firebase Configuration and Initialization
 * 
 * Initializes the Firebase client SDK (App, Auth, and Firestore).
 * Environment variables must be prefixed with EXPO_PUBLIC_ to be exposed to the client bundle.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Firebase Client Config Parameters
 * 
 * These parameters are retrieved from the Firebase Web App setup in the Firebase Console:
 * 📍 Location: Firebase Console > Project Settings (gear icon) > General > Your Apps > Web App.
 */
const firebaseConfig = {
  /**
   * Identifies your Firebase project on Google servers. Used for API auth and client permissions.
   * 📍 Found under: 'apiKey' key in the Firebase Web configuration block.
   */
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,

  /**
   * The hosting domain for Firebase Authentication redirect flows (e.g. Google/OAuth redirects).
   * 📍 Found under: 'authDomain' key (usually '<project-id>.firebaseapp.com').
   */
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,

  /**
   * The unique globally unique identifier of your Firebase Project.
   * 📍 Found under: 'projectId' key (also displayed as Project ID in General Settings).
   */
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,

  /**
   * Google Cloud Storage bucket path for storage uploads (avatars, files, etc.).
   * 📍 Found under: 'storageBucket' key (usually '<project-id>.appspot.com').
   */
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,

  /**
   * Identifier used by Cloud Messaging to coordinate token routing and push notifications.
   * 📍 Found under: 'messagingSenderId' key.
   */
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,

  /**
   * Unique App ID identifier representing this specific client registration in the Firebase project.
   * 📍 Found under: 'appId' key (formats as '1:<sender-id>:web:<hash>').
   */
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase App (prevent re-initializing during hot-reloads)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Authentication with persistent storage using AsyncStorage.
// This ensures that the user's login state is saved locally on their device.
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Initialize Firestore with local persistent cache enabled.
// This enables offline support: the app can read/write data offline and will automatically
// sync changes when the network connection becomes available.
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

export { app, auth, db };
export default app;
