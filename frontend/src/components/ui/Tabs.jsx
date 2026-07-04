import clsx from "clsx";

export default function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 p-1 bg-surface-container rounded-2xl">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={clsx(
            "flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-colors cursor-pointer",
            active === tab.id
              ? "bg-surface-container-lowest text-primary shadow-sm"
              : "text-on-surface-variant hover:text-on-surface",
          )}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
