// components/providers/SupabaseProvider.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import {
  AuthError,
  type SupabaseClient,
  type Session,
} from "@supabase/supabase-js";

// Define the shape of your context
interface SupabaseContextType {
  supabase: SupabaseClient;
  session: Session | null;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(
  undefined,
);

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // Check for the initial session on component mount
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error) {
        const errorMessage =
          error instanceof AuthError ? error.message : String(error);

        if (
          /invalid refresh token|refresh token not found/i.test(errorMessage)
        ) {
          await supabase.auth.signOut({ scope: "local" });
          setSession(null);
          return;
        }
      }

      setSession(session);
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      // Optional: Refresh the page on certain events for Next.js to re-fetch data
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        router.refresh();
      }
    });

    // Clean up the subscription on component unmount
    return () => {
      subscription?.unsubscribe();
    };
  }, [router, supabase]);

  return (
    <SupabaseContext.Provider value={{ supabase, session }}>
      {children}
    </SupabaseContext.Provider>
  );
}

// Custom hook to access the Supabase client and session
export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error("useSupabase must be used within a SupabaseProvider");
  }
  return context;
};
