import clsx from "clsx";

export default function Input({ label, className, ...props }) {
  return (
    <label className="flex flex-col gap-1.5">
      {label && (
        <span className="text-xs font-semibold text-on-surface-variant tracking-wide">
          {label}
        </span>
      )}
      <input
        className={clsx(
          "w-full px-3 py-2 text-sm bg-surface-container-lowest border border-outline-variant rounded-xl",
          "focus:border-primary-bright focus:outline-none transition-colors",
          className,
        )}
        {...props}
      />
    </label>
  );
}

export function Textarea({ label, className, ...props }) {
  return (
    <label className="flex flex-col gap-1.5">
      {label && (
        <span className="text-xs font-semibold text-on-surface-variant tracking-wide">
          {label}
        </span>
      )}
      <textarea
        className={clsx(
          "w-full px-3 py-2 text-sm bg-surface-container-lowest border border-outline-variant rounded-xl resize-y min-h-[80px]",
          "focus:border-primary-bright focus:outline-none transition-colors",
          className,
        )}
        {...props}
      />
    </label>
  );
}
