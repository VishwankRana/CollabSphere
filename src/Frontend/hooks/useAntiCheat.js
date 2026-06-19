import { useEffect, useRef } from "react";

import { getInterviewSocket } from "../lib/interviewSocket";

const INACTIVITY_THRESHOLD_MS = 5 * 60 * 1000;
const INACTIVITY_CHECK_MS = 30 * 1000;
const PASTE_CHAR_THRESHOLD = 20;

export function useAntiCheat({ roomId, enabled = false }) {
  const lastActivityRef = useRef(0);
  const inactivityReportedRef = useRef(false);

  useEffect(() => {
    if (!enabled || !roomId) {
      return undefined;
    }

    lastActivityRef.current = Date.now();
    inactivityReportedRef.current = false;

    const socket = getInterviewSocket();

    const report = (type, metadata = {}) => {
      socket.emit("cheat:event", { roomId, type, metadata });
    };

    const markActivity = () => {
      lastActivityRef.current = Date.now();
      inactivityReportedRef.current = false;
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        report("tab_switch");
      }
    };

    const onBlur = () => {
      report("focus_loss");
    };

    const onPaste = (event) => {
      const pastedText = event.clipboardData?.getData("text") || "";

      if (pastedText.length > PASTE_CHAR_THRESHOLD) {
        report("paste", { charCount: pastedText.length });
      }
    };

    const inactivityTimer = setInterval(() => {
      const inactiveMs = Date.now() - lastActivityRef.current;

      if (inactiveMs > INACTIVITY_THRESHOLD_MS && !inactivityReportedRef.current) {
        report("inactivity", { durationMs: inactiveMs });
        inactivityReportedRef.current = true;
      }
    }, INACTIVITY_CHECK_MS);

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onBlur);
    document.addEventListener("paste", onPaste);
    document.addEventListener("keydown", markActivity);
    document.addEventListener("mousemove", markActivity);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("paste", onPaste);
      document.removeEventListener("keydown", markActivity);
      document.removeEventListener("mousemove", markActivity);
      clearInterval(inactivityTimer);
    };
  }, [roomId, enabled]);
}

export const CHEAT_ALERT_LABELS = {
  tab_switch: "Candidate switched tabs",
  focus_loss: "Candidate left the window",
  paste: "Candidate pasted code",
  inactivity: "Candidate inactive for 5+ minutes",
};
