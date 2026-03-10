import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fire-and-forget: fetch profile in background, never blocks auth gate
  function fetchProfile(userId: string) {
    supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single()
      .then(({ data }) => setProfile(data as Profile | null));
  }

  async function refreshProfile() {
    if (user) fetchProfile(user.id);
  }

  useEffect(() => {
    let settled = false;

    // Resolve auth state FAST from getSession (local cache, instant)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!settled) {
        settled = true;
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) fetchProfile(session.user.id);
        setIsLoading(false); // ← unblock the UI immediately
      }
    });

    // Safety timeout — if getSession somehow stalls, unblock after 3s
    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        setIsLoading(false);
      }
    }, 3000);

    // Listen for future auth changes (sign-in / sign-out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        settled = true;
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
        setIsLoading(false);
      }
    );

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ user, session, profile, isLoading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
