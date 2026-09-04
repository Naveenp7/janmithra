import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { DEFAULT_LSG_WORKERS } from './seedData.js';

// Firebase configuration from environment
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Check whether real credentials have been provided
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey.length > 10 &&
  !firebaseConfig.apiKey.includes('your_firebase_api_key')
);

let app = null;
let auth = null;
let db = null;
let googleProvider = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: 'select_account' });
    console.log('[Firebase] Connected to Firebase Project:', firebaseConfig.projectId);
  } catch (err) {
    console.warn('[Firebase] Initialization error:', err);
  }
} else {
  console.warn('[Firebase] Keys not configured or default. Please add Firebase keys to .env');
}

export { auth, db, googleProvider };

// =========================================================================
// REAL-TIME FIRESTORE COMPLAINTS SUBSCRIPTIONS
// =========================================================================

/**
 * Subscribe to complaints.
 * If citizenId is provided, filters for that citizen; otherwise delivers all complaints (for Authority/Admin).
 * Real-time callback triggers automatically on any Firestore change.
 */
export function subscribeComplaints(citizenId, callback) {
  if (!isFirebaseConfigured || !db) {
    // If Firebase is not configured, deliver empty list
    callback([]);
    return () => {};
  }

  try {
    const complaintsCol = collection(db, 'complaints');
    let q = citizenId
      ? query(complaintsCol, where('citizenId', '==', citizenId))
      : query(complaintsCol, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            complaintId: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt || new Date().toISOString(),
          });
        });
        // Sort newest first if ordered query was skipped
        list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        callback(list);
      },
      (error) => {
        console.error('[Firestore] Realtime subscription error:', error);
        callback([]);
      }
    );
    return unsubscribe;
  } catch (error) {
    console.error('[Firestore] Error building query:', error);
    callback([]);
    return () => {};
  }
}

/**
 * Submit a new real civic complaint to Firestore
 */
export async function addComplaintToFirestore(complaintData) {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase is not configured. Please set your Firebase credentials in .env');
  }

  const newComplaint = {
    ...complaintData,
    status: 'submitted',
    assignedWorker: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, 'complaints'), newComplaint);
  return { complaintId: docRef.id, ...newComplaint };
}

/**
 * Update complaint status (submitted | assigned | in_progress | resolved)
 */
export async function updateComplaintStatusInFirestore(complaintId, newStatus) {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase is not configured.');
  }

  const docRef = doc(db, 'complaints', complaintId);
  await updateDoc(docRef, {
    status: newStatus,
    updatedAt: serverTimestamp(),
  });
  return true;
}

/**
 * Assign a field worker to a complaint
 */
export async function assignWorkerInFirestore(complaintId, workerName) {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase is not configured.');
  }

  const docRef = doc(db, 'complaints', complaintId);
  await updateDoc(docRef, {
    assignedWorker: workerName,
    status: 'assigned',
    updatedAt: serverTimestamp(),
  });
  return true;
}

// =========================================================================
// FIELD WORKERS (FIRESTORE)
// =========================================================================

/**
 * Subscribe to real LSG field workers from Firestore
 */
export function subscribeWorkers(callback) {
  if (!isFirebaseConfigured || !db) {
    callback(DEFAULT_LSG_WORKERS);
    return () => {};
  }

  try {
    const workersCol = collection(db, 'workers');
    const unsubscribe = onSnapshot(
      workersCol,
      async (snapshot) => {
        if (snapshot.empty) {
          // Initialize default workers if collection is brand new
          await initializeDefaultWorkersIfEmpty();
          callback(DEFAULT_LSG_WORKERS);
        } else {
          const list = [];
          snapshot.forEach((docSnap) => {
            list.push({ workerId: docSnap.id, ...docSnap.data() });
          });
          callback(list);
        }
      },
      (err) => {
        console.warn('[Firestore] Error subscribing to workers:', err);
        callback(DEFAULT_LSG_WORKERS);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn('[Firestore] Workers error:', err);
    callback(DEFAULT_LSG_WORKERS);
    return () => {};
  }
}

/**
 * Add a new real field worker
 */
export async function addWorkerToFirestore(workerData) {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase is not configured.');
  }

  const docRef = await addDoc(collection(db, 'workers'), {
    ...workerData,
    createdAt: serverTimestamp(),
  });
  return { workerId: docRef.id, ...workerData };
}

/**
 * Delete a field worker
 */
export async function deleteWorkerFromFirestore(workerId) {
  if (!isFirebaseConfigured || !db) return;
  await deleteDoc(doc(db, 'workers', workerId));
}

/**
 * Helper to initialize standard departmental staff if collection is empty
 */
export async function initializeDefaultWorkersIfEmpty() {
  if (!isFirebaseConfigured || !db) return;
  try {
    const snap = await getDocs(collection(db, 'workers'));
    if (snap.empty) {
      for (const w of DEFAULT_LSG_WORKERS) {
        await setDoc(doc(db, 'workers', w.workerId), {
          name: w.name,
          department: w.department,
          phone: w.phone,
          createdAt: serverTimestamp(),
        });
      }
      console.log('[Firestore] Initialized standard departmental staff in workers collection.');
    }
  } catch (e) {
    console.warn('[Firestore] Worker initialization skipped:', e);
  }
}
