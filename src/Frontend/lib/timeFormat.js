export function formatElapsedClock(ms) {
  if (!ms || ms < 0) {
    return "00:00";
  }

  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function formatDurationMinutes(ms) {
  if (!ms || ms < 0) {
    return "—";
  }

  const minutes = Math.max(1, Math.round(ms / 60000));
  return `${minutes} min`;
}
