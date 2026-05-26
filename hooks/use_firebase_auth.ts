import { GoogleAuthProvider, signInWithPopup, User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import FirebaseClient from '@/models/firebase_client';

import { InAuthUser } from '../models/in_auth_user';

export default function useFirebaseAuth() {
  const router = useRouter();
  const [authUser, setAuthUser] = useState<InAuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function signInWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    const signInResult = await signInWithPopup(FirebaseClient.getInstance().Auth, provider);
    if (!signInResult.user) return;

    await fetch('/api/members.add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid: signInResult.user.uid,
        email: signInResult.user.email,
        displayName: signInResult.user.displayName,
        photoURL: signInResult.user.photoURL,
      }),
    });

    const screenName = (signInResult.user.email ?? '').replace('@gmail.com', '');
    if (screenName) {
      await router.push(`/${screenName}`);
    }
  }

  const signOut = async () => {
    await FirebaseClient.getInstance().Auth.signOut();
    setAuthUser(null);
    setLoading(false);
    router.push('/');
  };

  const authStateChanged = async (authState: User | null) => {
    if (authState === null) {
      setAuthUser(null);
      setLoading(false);
      return;
    }

    setLoading(true); //로딩중
    setAuthUser({
      uid: authState.uid,
      email: authState.email,
      photoURL: authState.photoURL,
      displayName: authState.displayName,
    });
    setLoading(false);
  };

  useEffect(() => {
    const unsubscribe = FirebaseClient.getInstance().Auth.onAuthStateChanged(authStateChanged);
    return () => unsubscribe();
  }, []);

  return {
    authUser,
    loading,
    signInWithGoogle,
    signOut,
  };
}
