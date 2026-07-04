import { Moon, Sun, User } from "lucide-react";
import clsx from "clsx";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import Card from "../components/ui/Card";

export default function SettingsView() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "User";

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-on-surface">Settings</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Manage your account and preferences.
          </p>
        </div>

        <Card className="p-5 space-y-4">
          <h2 className="text-sm font-semibold text-on-surface">Account</h2>
          <div className="flex items-center gap-3">
            {user?.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt=""
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
            )}
            <div className="min-w-0">
              <div className="text-sm font-semibold text-on-surface truncate">
                {displayName}
              </div>
              <div className="text-xs text-on-surface-variant truncate">
                {user?.email}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-5 space-y-4">
          <h2 className="text-sm font-semibold text-on-surface">Appearance</h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: "light", label: "Light", icon: Sun },
              { id: "dark", label: "Dark", icon: Moon },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTheme(id)}
                className={clsx(
                  "flex items-center justify-center gap-2 px-4 py-3 rounded-lg border text-sm font-semibold transition-colors cursor-pointer",
                  theme === id
                    ? "border-primary-bright bg-secondary-container text-primary"
                    : "border-outline-variant text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface",
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
