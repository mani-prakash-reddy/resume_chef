import { useState } from "react";
import { ChefHat, Mail, Lock, Loader2 } from "lucide-react";
import clsx from "clsx";
import { supabase, getAuthRedirectUrl } from "../lib/supabase";
import Button from "../components/ui/Button";
import GoogleIcon from "../components/auth/GoogleIcon";

export default function AuthPage() {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const landingUrl =
    typeof window !== "undefined"
      ? `${window.location.protocol}//${window.location.hostname.replace(/^app\./, "")}${window.location.port ? `:${window.location.port}` : ""}`
      : "http://localhost:5173";

  async function handleEmailSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (mode === "signin") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) throw signInError;
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: getAuthRedirectUrl(),
          },
        });
        if (signUpError) throw signUpError;

        if (!data.session) {
          setMessage(
            "Check your email for a confirmation link, then sign in.",
          );
          setMode("signin");
          return;
        }
      }
    } catch (err) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setError("");
    setGoogleLoading(true);

    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: getAuthRedirectUrl(),
        },
      });
      if (oauthError) throw oauthError;
    } catch (err) {
      setError(err.message || "Google sign-in failed");
      setGoogleLoading(false);
    }
  }

  return (
    <div className="min-h-full flex">
      <div className="hidden lg:flex lg:w-1/2 bg-primary-bright text-on-primary flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <ChefHat className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold">Resume Chef</span>
        </div>
        <div>
          <h1 className="text-3xl font-bold leading-tight">
            Build resumes that get past ATS and into interviews
          </h1>
          <p className="mt-4 text-on-primary-container/90 text-lg leading-relaxed">
            Sign in to access your workspace — code editor, live PDF preview,
            AI assistant, and ATS scoring.
          </p>
        </div>
        <p className="text-sm text-on-primary-container/70">
          © {new Date().getFullYear()} Resume Chef
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-surface">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl bg-primary-bright flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-on-primary" />
            </div>
            <span className="text-lg font-bold">Resume Chef</span>
          </div>

          <h2 className="text-2xl font-semibold text-on-surface">
            {mode === "signin" ? "Sign in" : "Create account"}
          </h2>
          <p className="mt-2 text-sm text-on-surface-variant">
            {mode === "signin"
              ? "Welcome back. Enter your credentials to continue."
              : "Get started with your free resume workspace."}
          </p>

          <div className="mt-6">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
              className={clsx(
                "w-full flex items-center justify-center gap-3 px-4 py-3 rounded-2xl",
                "border border-outline-variant bg-surface-container-lowest",
                "text-sm font-semibold text-on-surface hover:bg-surface-container-low transition-colors",
                "disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
              )}
            >
              {googleLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <GoogleIcon className="w-5 h-5" />
              )}
              Continue with Google
            </button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-outline-variant" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-surface px-3 text-on-surface-variant">
                or continue with email
              </span>
            </div>
          </div>

          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-on-surface-variant tracking-wide">
                Email
              </span>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-3 py-2.5 text-sm bg-surface-container-lowest border border-outline-variant rounded-xl focus:border-primary-bright focus:outline-none"
                />
              </div>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-on-surface-variant tracking-wide">
                Password
              </span>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
                <input
                  type="password"
                  required
                  minLength={6}
                  autoComplete={
                    mode === "signin" ? "current-password" : "new-password"
                  }
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-2.5 text-sm bg-surface-container-lowest border border-outline-variant rounded-xl focus:border-primary-bright focus:outline-none"
                />
              </div>
            </label>

            {error && (
              <p className="text-sm text-error bg-error-container px-3 py-2 rounded-xl">
                {error}
              </p>
            )}
            {message && (
              <p className="text-sm text-primary bg-secondary-container px-3 py-2 rounded-xl">
                {message}
              </p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading || googleLoading}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-on-surface-variant">
            {mode === "signin" ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setError("");
                    setMessage("");
                  }}
                  className="font-semibold text-primary hover:underline cursor-pointer"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setError("");
                    setMessage("");
                  }}
                  className="font-semibold text-primary hover:underline cursor-pointer"
                >
                  Sign in
                </button>
              </>
            )}
          </p>

          <p className="mt-4 text-center">
            <a
              href={landingUrl}
              className="text-sm text-on-surface-variant hover:text-on-surface"
            >
              ← Back to home
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
