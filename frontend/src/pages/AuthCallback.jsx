import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";

// Prevent double PKCE exchange under React StrictMode remounts.
let callbackExchangeStarted = false;

export default function AuthCallback() {
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    let redirected = false;

    function redirectHome() {
      if (redirected || !active) return;
      redirected = true;
      window.location.replace("/");
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")) {
        redirectHome();
      }
    });

    async function finishAuth() {
      if (callbackExchangeStarted) {
        const { data } = await supabase.auth.getSession();
        if (data.session) redirectHome();
        return;
      }
      callbackExchangeStarted = true;

      try {
        // detectSessionInUrl exchanges the PKCE code — do NOT call
        // exchangeCodeForSession manually or the verifier is consumed twice.
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (!active) return;

        if (sessionError) throw sessionError;
        if (data.session) {
          redirectHome();
          return;
        }

        const hasAuthParams =
          new URLSearchParams(window.location.search).has("code") ||
          window.location.hash.includes("access_token");

        if (!hasAuthParams) {
          throw new Error("No authentication data found. Please sign in again.");
        }
      } catch (err) {
        if (active) {
          callbackExchangeStarted = false;
          setError(err.message || "Authentication callback failed");
        }
      }
    }

    finishAuth();

    const timeout = setTimeout(() => {
      if (!redirected && active) {
        setError("Sign in timed out. Please try again.");
        callbackExchangeStarted = false;
      }
    }, 20000);

    return () => {
      active = false;
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  if (error) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-error bg-error-container px-4 py-3 rounded-xl text-sm max-w-md text-center">
          {error}
        </p>
        <a
          href="/"
          className="text-sm font-semibold text-primary hover:underline"
        >
          Return to sign in
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-full flex flex-col items-center justify-center gap-3 text-on-surface-variant">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-sm">Completing sign in…</p>
    </div>
  );
}
