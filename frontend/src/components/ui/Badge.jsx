import clsx from "clsx";

export default function Badge({ children, variant = "default", className }) {
  const variants = {
    default: "bg-surface-container-low text-on-surface-variant",
    primary: "bg-secondary-container text-primary",
    success: "bg-green-100 text-green-800",
    warning: "bg-amber-100 text-amber-800",
    error: "bg-error-container text-on-error-container",
  };

  return (
    <span
      className={clsx(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
