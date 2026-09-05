'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from './firebase';
import {
  getUserProfile,
  saveUserProfile,
  getUserSettings,
  saveUserSettings,
  seedInitialUserLeadsIfEmpty,
} from './firestoreService';
import { UserAccount, AppSettings } from './types';
import { DEFAULT_SETTINGS, DEFAULT_PROFILE } from './store';

interface AuthContextType {
  user: User | null;
  userProfile: UserAccount | null;
  userSettings: AppSettings | null;
  loading: boolean;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    pass: string,
    displayName: string,
    businessName?: string
  ) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  updateProfileInfo: (data: Partial<UserAccount>) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserAccount | null>(null);
  const [userSettings, setUserSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Synchronize Auth state with Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          // Fetch or initialize profile
          let profile = await getUserProfile(currentUser.uid);
          if (!profile) {
            profile = {
              uid: currentUser.uid,
              email: currentUser.email || '',
              displayName: currentUser.displayName || 'Freelance Agency Owner',
              photoURL: currentUser.photoURL || null,
              businessName: DEFAULT_PROFILE.name || 'Autonomous Web Design Agency',
              phone: DEFAULT_PROFILE.phone || '',
              website: DEFAULT_PROFILE.portfolioUrl || '',
              bio: DEFAULT_PROFILE.title || '',
              createdAt: new Date().toISOString(),
            };
            await saveUserProfile(currentUser.uid, profile);
          }
          setUserProfile(profile);

          // Fetch or initialize settings
          let settings = await getUserSettings(currentUser.uid);
          if (!settings) {
            settings = {
              ...DEFAULT_SETTINGS,
              profile: {
                ...DEFAULT_SETTINGS.profile,
                name: profile.displayName || DEFAULT_SETTINGS.profile.name,
                email: profile.email || DEFAULT_SETTINGS.profile.email,
                phone: profile.phone || DEFAULT_SETTINGS.profile.phone,
                portfolioUrl: profile.website || DEFAULT_SETTINGS.profile.portfolioUrl,
              },
            };
            await saveUserSettings(currentUser.uid, settings);
            // Also seed sample starter leads if fresh account
            await seedInitialUserLeadsIfEmpty(currentUser.uid);
          }
          setUserSettings(settings);
        } catch (err) {
          console.error('Error synchronizing user data with Firestore:', err);
        }
      } else {
        setUserProfile(null);
        setUserSettings(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshUserProfile = async () => {
    if (!user) return;
    try {
      const p = await getUserProfile(user.uid);
      if (p) setUserProfile(p);
      const s = await getUserSettings(user.uid);
      if (s) setUserSettings(s);
    } catch (e) {
      console.error('Failed to refresh user profile:', e);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), pass);
  };

  const signUpWithEmail = async (
    email: string,
    pass: string,
    displayName: string,
    businessName?: string
  ) => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    if (displayName) {
      await updateProfile(cred.user, { displayName });
    }
    const initialProfile: UserAccount = {
      uid: cred.user.uid,
      email: cred.user.email || email.trim(),
      displayName: displayName || 'Agency Developer',
      businessName: businessName || 'Web Design Studio',
      createdAt: new Date().toISOString(),
    };
    await saveUserProfile(cred.user.uid, initialProfile);
    setUserProfile(initialProfile);

    // Initialize default settings for new user
    const initialSettings: AppSettings = {
      ...DEFAULT_SETTINGS,
      profile: {
        ...DEFAULT_SETTINGS.profile,
        name: displayName || DEFAULT_SETTINGS.profile.name,
        email: cred.user.email || email.trim(),
      },
    };
    await saveUserSettings(cred.user.uid, initialSettings);
    await seedInitialUserLeadsIfEmpty(cred.user.uid);
    setUserSettings(initialSettings);
  };

  const signInWithGoogle = async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    const existing = await getUserProfile(cred.user.uid);
    if (!existing) {
      const initialProfile: UserAccount = {
        uid: cred.user.uid,
        email: cred.user.email || '',
        displayName: cred.user.displayName || 'Agency Developer',
        photoURL: cred.user.photoURL,
        businessName: `${cred.user.displayName || 'Freelance'} Studio`,
        createdAt: new Date().toISOString(),
      };
      await saveUserProfile(cred.user.uid, initialProfile);
      setUserProfile(initialProfile);

      const initialSettings: AppSettings = {
        ...DEFAULT_SETTINGS,
        profile: {
          ...DEFAULT_SETTINGS.profile,
          name: cred.user.displayName || DEFAULT_SETTINGS.profile.name,
          email: cred.user.email || DEFAULT_SETTINGS.profile.email,
        },
      };
      await saveUserSettings(cred.user.uid, initialSettings);
      await seedInitialUserLeadsIfEmpty(cred.user.uid);
      setUserSettings(initialSettings);
    }
  };

  const sendPasswordReset = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  const signOutUser = async () => {
    await signOut(auth);
    setUser(null);
    setUserProfile(null);
    setUserSettings(null);
  };

  const updateProfileInfo = async (data: Partial<UserAccount>) => {
    if (!user) return;
    await saveUserProfile(user.uid, data);
    setUserProfile((prev) => (prev ? { ...prev, ...data } : null));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        userSettings,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        sendPasswordReset,
        signOutUser,
        updateProfileInfo,
        refreshUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
