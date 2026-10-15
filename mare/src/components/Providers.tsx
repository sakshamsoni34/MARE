'use client';

import { SessionProvider } from "next-auth/react";
import React from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchInterval={5 * 60}>
      {children}
    </SessionProvider>
  );
}
