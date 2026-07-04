import { AuthProvider, useAuth } from "./contexts/AuthContext";
import AppWorkspace from "./pages/AppWorkspace";
import AuthPage from "./pages/AuthPage";
import AuthCallback from "./pages/AuthCallback";
import AuthLoading from "./components/auth/AuthLoading";

function isCallbackRoute() {
  return window.location.pathname === "/auth/callback";
}

function AuthenticatedApp() {
  const { session, loading } = useAuth();

  if (loading) return <AuthLoading />;
  if (!session) return <AuthPage />;
  return <AppWorkspace />;
}

export default function AppShell() {
  // Handle OAuth callback outside AuthProvider so getSession() only runs
  // once here — a second call in AuthProvider was consuming the PKCE verifier.
  if (isCallbackRoute()) {
    return <AuthCallback />;
  }

  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}
