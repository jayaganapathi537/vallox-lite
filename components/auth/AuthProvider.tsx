'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import { subscribeToAuthChanges } from '@/services/vallox/authService';
import { getOrCreateUserFromFirebaseIdentity, getUserById } from '@/services/vallox/userService';
import type { BaseUser } from '@/models/vallox';
import { clearPreferredRole, getPreferredRole } from '@/lib/authStorage';

interface AuthContextValue {
  firebaseUser: User | null;
  appUser: BaseUser | null;
  loading: boolean;
  refreshAppUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function resolveAppUser(firebaseUser: User | null) {
  if (!firebaseUser) {
    return null;
  }

  const existing = await getUserById(firebaseUser.uid);
  if (existing) {
    clearPreferredRole();
    return existing;
  }

  const recovered = await getOrCreateUserFromFirebaseIdentity(
    {
      uid: firebaseUser.uid,
      displayName: firebaseUser.displayName,
      email: firebaseUser.email
    },
    getPreferredRole()
  );

  clearPreferredRole();
  return recovered;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<BaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshAppUser = useCallback(async () => {
    if (!firebaseUser) {
      setAppUser(null);
      return;
    }

    try {
      const userDoc = await resolveAppUser(firebaseUser);
      setAppUser(userDoc);
    } catch {
      setAppUser(null);
    }
  }, [firebaseUser]);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (nextUser) => {
      setFirebaseUser(nextUser);

      if (!nextUser) {
        setAppUser(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const userDoc = await resolveAppUser(nextUser);
        setAppUser(userDoc);
      } catch {
        setAppUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = useMemo(
    () => ({
      firebaseUser,
      appUser,
      loading,
      refreshAppUser
    }),
    [appUser, firebaseUser, loading, refreshAppUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAppAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAppAuth must be used within AuthProvider');
  }
  return context;
}
