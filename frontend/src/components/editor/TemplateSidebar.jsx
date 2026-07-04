import clsx from "clsx";
import { TEMPLATES } from "../../data/defaults";
import { useResume } from "../../hooks/useResume";

export default function TemplateSidebar() {
  const { template, setTemplate } = useResume();

  return (
    <aside className="w-56 shrink-0 border-r border-outline-variant bg-surface-container-lowest flex flex-col">
      <div className="px-4 py-3 border-b border-outline-variant">
        <h2 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
          Templates
        </h2>
      </div>
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTemplate(t.id)}
            className={clsx(
              "w-full text-left px-3 py-2.5 rounded-xl transition-colors cursor-pointer",
              template === t.id
                ? "bg-secondary-container text-primary"
                : "hover:bg-surface-container-low text-on-surface",
            )}
          >
            <div className="text-sm font-semibold">{t.name}</div>
            <div className="text-xs text-on-surface-variant mt-0.5 line-clamp-2">
              {t.description}
            </div>
          </button>
        ))}
      </nav>
    </aside>
  );
}
