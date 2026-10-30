import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  auth,
  db,
  googleProvider,
  isFirebaseConfigured,
} from '../services/firebase.js';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setCurrentUser(null);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          let userRole = 'citizen';
          let userDetails = {};

          if (db) {
            const userSnap = await getDoc(doc(db, 'users', firebaseUser.uid));
            if (userSnap.exists()) {
              userDetails = userSnap.data();
              userRole = userDetails.role || 'citizen';
            } else {
              // If user exists in Auth but not in Firestore yet (e.g. first Google Sign-In)
              userDetails = {
                uid: firebaseUser.uid,
                name: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
                email: firebaseUser.email,
                role: 'citizen',
                createdAt: serverTimestamp(),
              };
              await setDoc(doc(db, 'users', firebaseUser.uid), userDetails);
            }
          }

          const userObj = {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || userDetails.name || firebaseUser.email?.split('@')[0],
            email: firebaseUser.email,
            role: userRole,
            department: userDetails.department || null,
            phone: userDetails.phone || null,
          };
          setCurrentUser(userObj);
        } catch (err) {
          console.error('[Auth] Error fetching user role from Firestore:', err);
          setCurrentUser({
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email,
            email: firebaseUser.email,
            role: 'citizen',
          });
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /**
   * Citizen Sign Up via Firebase Auth
   */
  const signupCitizen = async (email, password, name, phone = '') => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase is not configured. Please add Firebase keys to .env');
    }

    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });

    if (db) {
      await setDoc(
        doc(db, 'users', cred.user.uid),
        {
          uid: cred.user.uid,
          name,
          email,
          phone,
          role: 'citizen',
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );
    }

    const userObj = {
      uid: cred.user.uid,
      name,
      email,
      phone,
      role: 'citizen',
    };
    setCurrentUser(userObj);
    return userObj;
  };

  /** Authority accounts must never act as citizens: sign them out and tell them where to log in. */
  const rejectAdminInCitizenPortal = async () => {
    await signOut(auth);
    setCurrentUser(null);
    throw new Error('This is an authority account. Please use the Authority login, or sign in with a citizen account here.');
  };

  /**
   * Citizen Sign In via Firebase Auth
   */
  const loginCitizen = async (email, password) => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase is not configured. Please add Firebase keys to .env');
    }

    const cred = await signInWithEmailAndPassword(auth, email, password);
    let role = 'citizen';
    let userDetails = {};

    if (db) {
      const snap = await getDoc(doc(db, 'users', cred.user.uid));
      if (snap.exists()) {
        userDetails = snap.data();
        role = userDetails.role || 'citizen';
      }
    }

    if (role === 'admin') await rejectAdminInCitizenPortal();

    const userObj = {
      uid: cred.user.uid,
      name: cred.user.displayName || userDetails.name || cred.user.email?.split('@')[0],
      email: cred.user.email,
      role,
      phone: userDetails.phone || null,
    };
    setCurrentUser(userObj);
    return userObj;
  };

  /**
   * Citizen Google Sign In
   */
  const loginWithGoogle = async () => {
    if (!isFirebaseConfigured || !auth || !googleProvider) {
      throw new Error('Firebase is not configured. Please add Firebase keys to .env');
    }

    const cred = await signInWithPopup(auth, googleProvider);
    let role = 'citizen';
    let userDetails = {};

    if (db) {
      const userRef = doc(db, 'users', cred.user.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        userDetails = snap.data();
        role = userDetails.role || 'citizen';
      } else {
        userDetails = {
          uid: cred.user.uid,
          name: cred.user.displayName,
          email: cred.user.email,
          role: 'citizen',
          createdAt: serverTimestamp(),
        };
        await setDoc(userRef, userDetails);
      }
    }

    if (role === 'admin') await rejectAdminInCitizenPortal();

    const userObj = {
      uid: cred.user.uid,
      name: cred.user.displayName || cred.user.email?.split('@')[0],
      email: cred.user.email,
      role,
    };
    setCurrentUser(userObj);
    return userObj;
  };

  /**
   * Authority / Admin Sign In (Strictly checks Firestore for role === 'admin').
   * Admin accounts are provisioned manually in the Firebase console (Auth user + users/{uid} with role: 'admin');
   * there is intentionally no self-service admin registration.
   */
  const loginAdmin = async (email, password) => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase is not configured. Please add Firebase keys to .env');
    }

    const cred = await signInWithEmailAndPassword(auth, email, password);

    // Verify role in Firestore
    if (db) {
      const snap = await getDoc(doc(db, 'users', cred.user.uid));
      if (!snap.exists() || snap.data().role !== 'admin') {
        // Sign out if not an admin
        await signOut(auth);
        setCurrentUser(null);
        throw new Error('Access Denied: This account is not registered as an Authority / Administrator.');
      }

      const userDetails = snap.data();
      const userObj = {
        uid: cred.user.uid,
        name: cred.user.displayName || userDetails.name,
        email: cred.user.email,
        department: userDetails.department,
        role: 'admin',
      };
      setCurrentUser(userObj);
      return userObj;
    }

    throw new Error('Database connection unavailable to verify authority credentials.');
  };

  /**
   * Sign Out
   */
  const logout = async () => {
    if (isFirebaseConfigured && auth) {
      try {
        await signOut(auth);
      } catch (e) {
        console.error('Sign out error:', e);
      }
    }
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    loading,
    isFirebaseConfigured,
    signupCitizen,
    loginCitizen,
    loginWithGoogle,
    loginAdmin,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
