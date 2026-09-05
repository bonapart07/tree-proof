// Firebase Client Initialization for Authentication, Firestore & Real-Time Sync
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  Auth
} from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  setLogLevel,
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  where,
  serverTimestamp,
  Firestore,
  Unsubscribe
} from 'firebase/firestore';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';

// Real-Time Firebase Project Configuration (treeproof-d4f67)
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBo6H7jSM4PdhjhAzWZADjsD2JK9_-9t-k",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "treeproof-d4f67.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "treeproof-d4f67",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "treeproof-d4f67.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "157521637326",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:157521637326:web:d9cf77818ba45f792d859f",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-MF50SPKJ7B"
};

// Singleton App Initialization
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Suppress non-critical backend connection retry logs in browser
if (typeof window !== 'undefined') {
  try {
    setLogLevel('silent');
  } catch (e) {}
}

export const auth: Auth = getAuth(app);

// Robust Firestore Initialization with Long-Polling fallback
let dbInstance: Firestore;
try {
  dbInstance = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  });
} catch (e) {
  dbInstance = getFirestore(app);
}

export const db: Firestore = dbInstance;
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Safe Analytics Initialization for SSR/Next.js
let analytics: Analytics | null = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { analytics };

export {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  where,
  serverTimestamp
};

export type { FirebaseUser };

/**
 * Real-Time Google Sign In via Firebase Popup
 */
export async function signInWithGoogleReal(): Promise<FirebaseUser> {
  googleProvider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

/**
 * Real-Time: Sync user profile and role to Firestore 'users' collection
 */
export async function syncUserToFirestore(
  user: FirebaseUser,
  role: 'citizen' | 'ngo' | 'sponsor' | 'admin' = 'citizen',
  extraData: Record<string, any> = {}
) {
  try {
    const userRef = doc(db, 'users', user.uid);
    const existing = await getDoc(userRef);
    if (!existing.exists()) {
      const newUserDoc = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || extraData.displayName || 'Green Steward',
        photoURL: user.photoURL || '',
        role: role,
        state: extraData.state || 'Assam',
        district: extraData.district || 'Kamrup Metropolitan (Guwahati)',
        greenPoints: 0,
        createdAt: serverTimestamp(),
        lastActive: serverTimestamp(),
        ...extraData
      };
      await setDoc(userRef, newUserDoc);
      return { isNewUser: true, data: newUserDoc };
    } else {
      await setDoc(userRef, { lastActive: serverTimestamp(), ...extraData }, { merge: true });
      return { isNewUser: false, data: existing.data() };
    }
  } catch (err) {
    console.warn('Firestore user sync warning:', err);
    return { isNewUser: false, data: null };
  }
}

/**
 * Real-Time: Record new planted tree to Firestore 'trees' collection with locked token status
 */
export async function recordTreeToFirestore(treeData: {
  code: string;
  species: string;
  scientificName: string;
  planterUid?: string;
  planterName?: string;
  district?: string;
  state?: string;
  coordinates: number[] | [number, number];
  altitude?: number;
  proofPhotos: { layer1Soil: string; layer2Planting: string; layer3Planted: string };
  geminiAudit?: any;
  deviceId?: string;
  lockedTokens?: number;
  unlockedTokens?: number;
  tokenStatus?: string;
  [key: string]: any;
}) {
  try {
    const treesRef = collection(db, 'trees');
    const docRef = await addDoc(treesRef, {
      ...treeData,
      lockedTokens: treeData.lockedTokens ?? 20,
      unlockedTokens: treeData.unlockedTokens ?? 0,
      tokenStatus: treeData.tokenStatus || 'LOCKED_UNTIL_DAY30_VERIFICATION',
      survivalVerified: false,
      day30VerifiedAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (err) {
    console.warn('Firestore tree record warning:', err);
    return null;
  }
}

/**
 * Real-Time: Delete a planted tree document from Firestore 'trees' collection
 */
export async function deleteTreeFromFirestore(treeId: string): Promise<boolean> {
  try {
    const treeRef = doc(db, 'trees', treeId);
    await deleteDoc(treeRef);
    return true;
  } catch (err) {
    console.warn('Firestore tree delete warning:', err);
    return false;
  }
}

/**
 * Real-Time: Unlock tokens in Firestore when 30-day survival check is approved
 */
export async function unlockTreeTokensInFirestore(
  treeId: string,
  uid?: string,
  unlockedAmount: number = 20,
  survivalDetails: Record<string, any> = {}
) {
  try {
    const treeRef = doc(db, 'trees', treeId);
    await setDoc(
      treeRef,
      {
        tokenStatus: 'UNLOCKED_SURVIVAL_CONFIRMED',
        lockedTokens: 0,
        unlockedTokens: unlockedAmount,
        survivalVerified: true,
        day30VerifiedAt: serverTimestamp(),
        survivalDetails,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );

    if (uid) {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      const currentPoints = userSnap.exists() ? userSnap.data().greenPoints || 0 : 0;
      await setDoc(
        userRef,
        {
          greenPoints: currentPoints + unlockedAmount,
          lastUnlockedAt: serverTimestamp()
        },
        { merge: true }
      );
    }
    return true;
  } catch (err) {
    console.warn('Error unlocking tree tokens in Firestore:', err);
    return false;
  }
}

/**
 * Real-Time Listener: Listen for latest live tree plantations across all stewards
 */
export function subscribeToLiveTrees(callback: (trees: any[]) => void): Unsubscribe {
  try {
    const treesRef = collection(db, 'trees');
    const q = query(treesRef, orderBy('createdAt', 'desc'), limit(50));
    return onSnapshot(q, (snapshot) => {
      const trees = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(trees);
    }, (err) => {
      console.warn('Live trees snapshot error:', err);
    });
  } catch (e) {
    console.warn('Real-time subscription notice:', e);
    return () => {};
  }
}

/**
 * Real-Time Listener: Listen for user's live GreenPoints and profile updates
 */
export function subscribeToUserDocument(uid: string, callback: (userData: any) => void): Unsubscribe {
  try {
    const userRef = doc(db, 'users', uid);
    return onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data());
      }
    }, (err) => {
      console.warn('User document snapshot error:', err);
    });
  } catch (e) {
    console.warn('User subscription notice:', e);
    return () => {};
  }
}

