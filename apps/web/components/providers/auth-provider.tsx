'use client';

import * as React from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useAuthStore } from '@/store/auth-store';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

export function AuthProvider({ children }: { children: React.ReactNode }) {
   const { initSession } = useAuthStore();

   React.useEffect(() => {
      initSession();
   }, [initSession]);

   return <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{children}</GoogleOAuthProvider>;
}
