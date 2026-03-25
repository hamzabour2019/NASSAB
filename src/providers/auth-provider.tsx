"use client";

import { createClient } from "@/lib/supabase/client";
import type { SupabasePublicConfig } from "@/lib/supabase/env-public";
import type { Session, User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  refresh: () => Promise<void>;
  supabaseMisconfigured: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({
  children,
  supabasePublic,
}: {
  children: ReactNode;
  supabasePublic: SupabasePublicConfig | null;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const supabaseMisconfigured = supabasePublic === null;

  const refresh = useCallback(async () => {
    if (!supabasePublic) {
      setSession(null);
      setUser(null);
      return;
    }
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setUser(data.session?.user ?? null);
    } catch {
      setSession(null);
      setUser(null);
    }
  }, [supabasePublic]);

  useEffect(() => {
    if (!supabasePublic) {
      setLoading(false);
      return;
    }

    let mounted = true;
    const supabase = createClient();

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) {
          console.error("[نسب] getSession:", error.message);
        }
        setSession(data.session);
        setUser(data.session?.user ?? null);
        setLoading(false);
      })
      .catch((e) => {
        console.error("[نسب] getSession failed:", e);
        if (mounted) {
          setSession(null);
          setUser(null);
          setLoading(false);
        }
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setUser(next?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabasePublic]);

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      refresh,
      supabaseMisconfigured,
    }),
    [user, session, loading, refresh, supabaseMisconfigured]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
