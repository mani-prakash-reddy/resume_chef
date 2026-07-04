import { useState } from "react";
import { ChefHat, ExternalLink, Save, LogOut, User } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import Button from "../ui/Button";

export default function AppHeader() {
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const landingUrl =
    typeof window !== "undefined"
      ? `${window.location.protocol}//${window.location.hostname.replace(/^app\./, "")}${window.location.port ? `:${window.location.port}` : ""}`
      : "http://localhost:5173";

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "User";

  async function handleSignOut() {
    setMenuOpen(false);
    await signOut();
  }

  return (
    <header className="h-14 shrink-0 border-b border-outline-variant bg-surface-container-lowest/90 backdrop-blur-md flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-primary-bright flex items-center justify-center">
          <ChefHat className="w-4 h-4 text-on-primary" />
        </div>
        <div>
          <div className="text-sm font-bold text-on-surface">Resume Chef</div>
          <div className="text-xs text-on-surface-variant">Workspace</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm">
          <Save className="w-3.5 h-3.5" />
          Save
        </Button>
        <a href={landingUrl}>
          <Button variant="secondary" size="sm">
            <ExternalLink className="w-3.5 h-3.5" />
            Home
          </Button>
        </a>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-surface-container-low transition-colors cursor-pointer"
          >
            {user?.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt=""
                className="w-7 h-7 rounded-full object-cover"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-secondary-container flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-primary" />
              </div>
            )}
            <span className="hidden sm:block text-sm font-medium text-on-surface max-w-[120px] truncate">
              {displayName}
            </span>
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1 z-50 w-56 py-1 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg">
                <div className="px-3 py-2 border-b border-outline-variant">
                  <div className="text-sm font-semibold text-on-surface truncate">
                    {displayName}
                  </div>
                  <div className="text-xs text-on-surface-variant truncate">
                    {user?.email}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-on-surface hover:bg-surface-container-low cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
