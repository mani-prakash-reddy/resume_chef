import LandingPage from "./pages/LandingPage";
import AppShell from "./AppShell";
import { ThemeProvider } from "./contexts/ThemeContext";
import ErrorBoundary from "./components/ui/ErrorBoundary";

function isAppHost() {
  const host = window.location.hostname;
  return host === "app.localhost" || host.startsWith("app.");
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        {isAppHost() ? <AppShell /> : <LandingPage />}
      </ThemeProvider>
    </ErrorBoundary>
  );
}
