import clsx from "clsx";

export default function Card({ children, className, padding = true }) {
  return (
    <div
      className={clsx(
        "bg-surface-container-lowest border border-outline-variant rounded-2xl",
        padding && "p-4",
        className,
      )}
    >
      {children}
    </div>
  );
}
