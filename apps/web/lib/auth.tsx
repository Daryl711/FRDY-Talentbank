"use client";

import type { Session, User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  /** True when the user is allowed into the portal (signed in, or Supabase off). */
  authed: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  session: null,
  user: null,
  loading: true,
  authed: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // When Supabase isn't wired up, skip auth so the dashboard still runs on mocks.
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const authed = !isSupabaseConfigured || !!session;

  async function signOut() {
    if (isSupabaseConfigured) await supabase.auth.signOut();
    setSession(null);
  }

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, authed, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
