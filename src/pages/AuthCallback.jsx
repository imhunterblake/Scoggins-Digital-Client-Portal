import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function AuthCallback() {
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check for error in the URL hash first
    const hash = window.location.hash;
    if (hash.includes("error=") || hash.includes("error_code=")) {
      const params = new URLSearchParams(hash.replace("#", ""));
      const errorCode = params.get("error_code");

      if (errorCode === "otp_expired") {
        setError("Your login link has expired. Please request a new one.");
      } else {
        setError("Login failed. Please try again.");
      }
      return;
    }

    // No error — wait for session then redirect
    const check = async () => {
      try {
        // Give Supabase time to process the hash
        await new Promise((r) => setTimeout(r, 500));

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          // If this tab was opened from another window (e.g. clicking link in Gmail)
          // close this tab and redirect the original window instead
          if (window.opener && !window.opener.closed) {
            window.opener.location.href = "/";
            window.close();
          } else {
            // Normal flow — just redirect this tab
            window.location.replace("/");
          }
        } else {
          // Keep checking briefly
          setTimeout(async () => {
            const {
              data: { session: s2 },
            } = await supabase.auth.getSession();
            if (s2) {
              if (window.opener && !window.opener.closed) {
                window.opener.location.href = "/";
                window.close();
              } else {
                window.location.replace("/");
              }
            } else {
              setError(
                "Login failed. Your link may have expired. Please request a new one.",
              );
            }
          }, 2000);
        }
      } catch (err) {
        setError("Something went wrong. Please try again.");
      }
    };

    check();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-brand-dark grid-bg flex items-center justify-center p-4">
        <div className="text-center animate-fade-in max-w-sm w-full">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
            <span className="text-2xl">✕</span>
          </div>
          <p className="font-display font-semibold text-white mb-2">
            Login Link Expired
          </p>
          <p className="font-display text-white/40 text-sm mb-6">{error}</p>
          <a
            href="/login"
            className="btn-primary w-full flex items-center justify-center gap-2 py-3"
          >
            ← Back to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-dark grid-bg flex items-center justify-center">
      <div className="text-center animate-fade-in">
        <div className="w-8 h-8 border-2 border-brand-cyan/30 border-t-brand-cyan rounded-full animate-spin mx-auto mb-4" />
        <p className="font-display font-semibold text-white mb-1">
          Signing you in...
        </p>
        <p className="font-mono text-white/30 text-sm">Just a moment</p>
      </div>
    </div>
  );
}
