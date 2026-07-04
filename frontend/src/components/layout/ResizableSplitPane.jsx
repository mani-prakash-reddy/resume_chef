import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";

export default function ResizableSplitPane({
  left,
  right,
  defaultRatio = 0.55,
  minLeft = 280,
  minRight = 280,
  storageKey = "resume-chef-canvas-split-ratio",
}) {
  const containerRef = useRef(null);
  const dragging = useRef(false);

  const [ratio, setRatio] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = parseFloat(saved);
      if (!Number.isNaN(parsed) && parsed > 0 && parsed < 1) return parsed;
    }
    return defaultRatio;
  });

  const updateRatio = useCallback(
    (clientX) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const width = rect.width;
      if (width <= 0) return;

      const minLeftRatio = minLeft / width;
      const maxLeftRatio = 1 - minRight / width;
      const next = Math.min(
        maxLeftRatio,
        Math.max(minLeftRatio, (clientX - rect.left) / width),
      );

      setRatio(next);
      localStorage.setItem(storageKey, String(next));
    },
    [minLeft, minRight, storageKey],
  );

  const onDividerPointerDown = useCallback((e) => {
    e.preventDefault();
    dragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  useEffect(() => {
    function onPointerMove(e) {
      if (!dragging.current) return;
      updateRatio(e.clientX);
    }

    function onPointerUp() {
      if (!dragging.current) return;
      dragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [updateRatio]);

  return (
    <div
      ref={containerRef}
      className="flex flex-1 min-w-0 min-h-0"
    >
      <div
        className="min-w-0 min-h-0 flex flex-col shrink-0 bg-surface-container-lowest"
        style={{ width: `${ratio * 100}%` }}
      >
        {left}
      </div>

      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize editor and preview"
        aria-valuenow={Math.round(ratio * 100)}
        onPointerDown={onDividerPointerDown}
        className={clsx(
          "relative w-1 shrink-0 cursor-col-resize bg-outline-variant/50",
          "hover:bg-primary-bright/60 active:bg-primary-bright transition-colors",
        )}
      >
        <div className="absolute inset-y-0 -left-1.5 -right-1.5" />
      </div>

      <div className="flex-1 min-w-0 min-h-0 flex flex-col">
        {right}
      </div>
    </div>
  );
}
