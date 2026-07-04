import LandingPage from "./pages/LandingPage";
import AppShell from "./AppShell";

function isAppHost() {
  const host = window.location.hostname;
  return host === "app.localhost" || host.startsWith("app.");
}

export default function App() {
  if (!isAppHost()) return <LandingPage />;
  return <AppShell />;
}
