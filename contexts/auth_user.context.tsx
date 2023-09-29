/* eslint-disable @typescript-eslint/no-empty-function */
import React, { createContext, useContext } from 'react';
import { InAuthUser } from '@/models/in_auth_user';
import useFirebaseAuth from '@/hooks/use_firebase_auth';

interface InAuthUserContext {
  authUser: InAuthUser | null;
  /** 로그인 진행중인지 체크  */
  loading: boolean;
  signInWithGoogle: () => void;
  signOut: () => void;
}

const AuthUserContext = createContext<InAuthUserContext>({
  authUser: null,
  loading: true,
  signInWithGoogle: async () => ({ user: null, credential: null }),
  signOut: () => {},
});

export const AuthUserProvider = function ({ children }: { children: React.ReactNode }) {
  const auth = useFirebaseAuth();
  return <AuthUserContext.Provider value={auth}>{children}</AuthUserContext.Provider>;
};

export const useAuth = () => useContext(AuthUserContext);
