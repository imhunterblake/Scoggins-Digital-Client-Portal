import { createContext, useContext, useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext({});

// Cache profile in sessionStorage so refreshes are instant
function getCachedProfile() {
  try {
    const cached = sessionStorage.getItem("sd_profile");
    return cached ? JSON.parse(cached) : null;
  } catch { return null; }
}

function setCachedProfile(profile) {
  try {
    if (profile) sessionStorage.setItem("sd_profile", JSON.stringify(profile));
    else sessionStorage.removeItem("sd_profile");
  } catch {}
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  // Pre-populate from cache so the UI renders immediately on refresh
  const [profile, setProfile] = useState(() => getCachedProfile());
  const [loading, setLoading] = useState(true);
  const loadedUserIdRef = useRef(null);

  // If we have a cached profile, mark that user as already loaded
  useEffect(() => {
    const cached = getCachedProfile();
    if (cached?.id) loadedUserIdRef.current = cached.id;
  }, []);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        // getSession reads from localStorage — instant, no network needed
        const { data: { session } } = await supabase.auth.getSession();

        if (!mounted) return;
        setSession(session);

        if (session?.user?.id) {
          // If cached profile matches current user, we're done — no network call
          const cached = getCachedProfile();
          if (cached?.id === session.user.id) {
            loadedUserIdRef.current = session.user.id;
            setLoading(false);
            // Silently refresh in background to catch any profile changes
            loadProfileWithRetry(session.user.id, mounted, true);
            return;
          }
          await loadProfileWithRetry(session.user.id, mounted);
        } else {
          setCachedProfile(null);
          setProfile(null);
          setLoading(false);
        }
      } catch (err) {
        console.error("Auth init error:", err);
        if (mounted) setLoading(false);
      }
    }

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        if (event === "TOKEN_REFRESHED") return;

        if (event === "SIGNED_OUT") {
          setSession(null);
          setProfile(null);
          setCachedProfile(null);
          loadedUserIdRef.current = null;
          setLoading(false);
          return;
        }

        if (event === "SIGNED_IN" || event === "USER_UPDATED") {
          setSession(session);
          if (session?.user?.id) {
            // Skip reload if already loaded for this user (cross-tab broadcast)
            if (event === "SIGNED_IN" && loadedUserIdRef.current === session.user.id) {
              return;
            }
            await loadProfileWithRetry(session.user.id, mounted);
          } else {
            setProfile(null);
            setCachedProfile(null);
            loadedUserIdRef.current = null;
            setLoading(false);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Retry with short delays — 500ms is enough for Supabase cold starts
  async function loadProfileWithRetry(userId, mounted = true, silent = false) {
    const MAX_ATTEMPTS = 3;
    const RETRY_DELAY = 500; // was 2000ms — 500ms is plenty for cold starts

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      if (!mounted) return;

      try {
        const { data, error } = await Promise.race([
          supabase.from("profiles").select("*").eq("id", userId).single(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("timeout")), 8000)
          ),
        ]);

        if (!mounted) return;

        if (error) {
          console.error(`Profile fetch error (attempt ${attempt}/${MAX_ATTEMPTS}):`, error.message);
          if (attempt < MAX_ATTEMPTS) {
            await new Promise(r => setTimeout(r, RETRY_DELAY));
            continue;
          }
          if (!silent) {
            setProfile(null);
            setCachedProfile(null);
            loadedUserIdRef.current = null;
            setLoading(false);
          }
          return;
        }

        // Success — update state and cache
        setProfile(data);
        setCachedProfile(data);
        loadedUserIdRef.current = userId;
        if (!silent) setLoading(false);
        return;

      } catch (err) {
        console.error(`Profile fetch exception (attempt ${attempt}/${MAX_ATTEMPTS}):`, err.message);
        if (attempt < MAX_ATTEMPTS) {
          await new Promise(r => setTimeout(r, RETRY_DELAY));
          continue;
        }
        if (mounted && !silent) {
          setProfile(null);
          setCachedProfile(null);
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