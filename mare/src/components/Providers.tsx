'use client';

import { SessionProvider, useSession } from "next-auth/react";
import React, { useEffect } from "react";
import { setApiAuthToken } from "@/lib/api";
import SignInModal from "@/components/SignInModal";

function AuthTokenSync() {
  const { data: session } = useSession();

  useEffect(() => {
    if (session && (session as any).user?.accessToken) {
      setApiAuthToken((session as any).user.accessToken);
    }
  }, [session]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchInterval={5 * 60}>
      <AuthTokenSync />
      {children}
      <SignInModal />
    </SessionProvider>
  );
}
