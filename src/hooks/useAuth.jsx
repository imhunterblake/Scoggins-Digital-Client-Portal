import { createContext, useContext, useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const loadedUserIdRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        // getSession() reads from localStorage — no timeout needed, it's instant
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;
        setSession(session);

        if (session?.user?.id) {
          await loadProfileWithRetry(session.user.id, mounted);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Auth init error:", err);
        if (mounted) setLoading(false);
      }
    }

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      // Ignore token refreshes — these cause spurious re-routes
      if (event === "TOKEN_REFRESHED") return;

      if (event === "SIGNED_OUT") {
        setSession(null);
        setProfile(null);
        loadedUserIdRef.current = null;
        setLoading(false);
        return;
      }

      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        setSession(session);
        if (session?.user?.id) {
          // Skip reload if profile already loaded for this user (cross-tab broadcast)
          if (
            event === "SIGNED_IN" &&
            loadedUserIdRef.current === session.user.id
          ) {
            return;
          }
          await loadProfileWithRetry(session.user.id, mounted);
        } else {
          setProfile(null);
          loadedUserIdRef.current = null;
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Retry up to 3 times — handles Supabase free tier cold starts on new tabs
  async function loadProfileWithRetry(userId, mounted = true) {
    const MAX_ATTEMPTS = 3;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      if (!mounted) return;

      try {
        const { data, error } = await Promise.race([
          supabase.from("profiles").select("*").eq("id", userId).single(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("timeout")), 8000),
          ),
        ]);

        if (!mounted) return;

        if (error) {
          console.error(
            `Profile fetch error (attempt ${attempt}/${MAX_ATTEMPTS}):`,
            error.message,
          );
          if (attempt < MAX_ATTEMPTS) {
            await new Promise((r) => setTimeout(r, 2000));
            continue;
          }
          setProfile(null);
          loadedUserIdRef.current = null;
          setLoading(false);
          return;
        }

        // Success
        setProfile(data);
        loadedUserIdRef.current = userId;
        setLoading(false);
        return;
      } catch (err) {
        console.error(
          `Profile fetch exception (attempt ${attempt}/${MAX_ATTEMPTS}):`,
          err.message,
        );
        if (attempt < MAX_ATTEMPTS) {
          await new Promise((r) => setTimeout(r, 2000));
          continue;
        }
        if (mounted) {
          setProfile(null);
          loadedUserIdRef.current = null;
          setLoading(false);
        }
      }
    }
  }

  const isAdmin = profile?.role === "admin";

  return (
    <AuthContext.Provider value={{ session, profile, loading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
