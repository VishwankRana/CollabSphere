import { useCallback, useEffect, useRef, useState } from "react";

export function useResizePanel({
  axis = "horizontal",
  initial = 280,
  min = 160,
  max = 720,
  storageKey,
}) {
  const [size, setSize] = useState(() => {
    if (storageKey) {
      const stored = Number(localStorage.getItem(storageKey));

      if (!Number.isNaN(stored) && stored >= min && stored <= max) {
        return stored;
      }
    }

    return initial;
  });

  const draggingRef = useRef(false);
  const startRef = useRef({ pointer: 0, size: initial });

  const persist = useCallback(
    (nextSize) => {
      if (storageKey) {
        localStorage.setItem(storageKey, String(Math.round(nextSize)));
      }
    },
    [storageKey]
  );

  const onPointerDown = useCallback(
    (event) => {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      draggingRef.current = true;
      startRef.current = {
        pointer: axis === "horizontal" ? event.clientX : event.clientY,
        size,
      };
      document.body.classList.add("cs-resize-active", `cs-resize-active--${axis}`);
    },
    [axis, size]
  );

  useEffect(() => {
    function handlePointerMove(event) {
      if (!draggingRef.current) {
        return;
      }

      const delta =
        axis === "horizontal"
          ? event.clientX - startRef.current.pointer
          : startRef.current.pointer - event.clientY;

      const nextSize = Math.min(max, Math.max(min, startRef.current.size + delta));
      setSize(nextSize);
    }

    function handlePointerUp() {
      if (!draggingRef.current) {
        return;
      }

      draggingRef.current = false;
      document.body.classList.remove("cs-resize-active", "cs-resize-active--horizontal", "cs-resize-active--vertical");
      setSize((current) => {
        persist(current);
        return current;
      });
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      document.body.classList.remove("cs-resize-active", "cs-resize-active--horizontal", "cs-resize-active--vertical");
    };
  }, [axis, max, min, persist]);

  return { size, onPointerDown };
}

export default function ResizeHandle({ axis = "horizontal", onPointerDown }) {
  return (
    <div
      className={`cs-resize-handle cs-resize-handle--${axis}`}
      role="separator"
      aria-orientation={axis === "horizontal" ? "vertical" : "horizontal"}
      aria-label={axis === "horizontal" ? "Resize side panel" : "Resize output panel"}
      onPointerDown={onPointerDown}
    />
  );
}
