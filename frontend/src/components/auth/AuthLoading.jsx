import { Loader2 } from "lucide-react";

export default function AuthLoading() {
  return (
    <div className="min-h-full flex flex-col items-center justify-center gap-3 text-on-surface-variant">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-sm">Loading…</p>
    </div>
  );
}
