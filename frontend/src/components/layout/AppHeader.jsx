import { useState } from "react";
import clsx from "clsx";
import { ChefHat, Save, LogOut, User, Layout, FolderOpen, LayoutTemplate, Settings, ChevronDown } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import Button from "../ui/Button";
import ThemeToggle from "./ThemeToggle";

const navItems = [
  { id: "canvas", label: "Canvas", icon: Layout },
  { id: "resumes", label: "My Resumes", icon: FolderOpen },
  { id: "templates", label: "Templates", icon: LayoutTemplate },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function AppHeader({ activeView, onViewChange }) {
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

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
    <header className="relative z-[60] h-14 shrink-0 border-b border-outline-variant bg-surface-container-lowest backdrop-blur-md flex items-center justify-between px-4 gap-4">
      <div className="flex items-center gap-6 min-w-0">
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary-bright flex items-center justify-center">
            <ChefHat className="w-4 h-4 text-on-primary" />
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-bold text-on-surface">Resume Chef</div>
          </div>
        </div>

        <nav className="flex items-center gap-1" aria-label="Workspace">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onViewChange(id)}
              className={clsx(
                "flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors cursor-pointer",
                activeView === id
                  ? "bg-secondary-container text-primary"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low",
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden md:inline">{label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button variant="ghost" size="sm">
          <Save className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Save</span>
        </Button>
        <ThemeToggle />

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            className={clsx(
              "flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors cursor-pointer",
              menuOpen
                ? "bg-surface-container-low"
                : "hover:bg-surface-container-low",
            )}
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
            <ChevronDown
              className={clsx(
                "w-3.5 h-3.5 text-on-surface-variant transition-transform",
                menuOpen && "rotate-180",
              )}
            />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-[70]"
                onClick={() => setMenuOpen(false)}
                aria-hidden
              />
              <div
                role="menu"
                className="absolute right-0 top-full mt-1 z-[80] w-48 py-1 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-lg"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-on-surface hover:bg-surface-container-low cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Log out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
