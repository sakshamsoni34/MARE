'use client';

import { SessionProvider } from "next-auth/react";
import React, { useEffect, useState } from "react";
import { useStore } from "@/store/useStore";

function DatabaseHydration({ children }: { children: React.ReactNode }) {
  const { hydrateState } = useStore();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const fetchState = async () => {
      try {
        const res = await fetch('http://localhost:8555/api/state');
        if (res.ok) {
          const json = await res.json();
          if (json.status === 'success' && json.state) {
             hydrateState(json.state);
          }
        }
      } catch (err) {
        console.error("Failed to hydrate state from DB", err);
      } finally {
        setIsHydrated(true);
      }
    };
    fetchState();
  }, [hydrateState]);

  // Optional: render nothing or a generic loader until hydration finishes.
  // In this case, we render children immediately but state might pop in a split second later.
  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <DatabaseHydration>
        {children}
      </DatabaseHydration>
    </SessionProvider>
  );
}

