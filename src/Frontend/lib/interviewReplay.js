export function formatReplayOffset(ms) {
  if (!ms || ms < 0) {
    return "0:00";
  }

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function getReplayBounds(events) {
  if (!events?.length) {
    return { startMs: 0, durationMs: 0 };
  }

  const startMs = new Date(events[0].timestamp).getTime();
  const endMs = new Date(events.at(-1).timestamp).getTime();

  return {
    startMs,
    durationMs: Math.max(endMs - startMs, 0),
  };
}

function isEventAtOrBefore(event, cutoffMs) {
  return new Date(event.timestamp).getTime() <= cutoffMs;
}

export function getSnapshotAtTime(events, startMs, currentTimeMs) {
  const cutoffMs = startMs + currentTimeMs;
  let latest = null;

  for (const event of events) {
    if (event.type !== "code_snapshot") {
      continue;
    }

    if (isEventAtOrBefore(event, cutoffMs)) {
      latest = event;
      continue;
    }

    break;
  }

  return latest;
}

export function getRunResultAtTime(events, startMs, currentTimeMs) {
  const cutoffMs = startMs + currentTimeMs;
  let latest = null;

  for (const event of events) {
    if (event.type !== "code_run") {
      continue;
    }

    if (isEventAtOrBefore(event, cutoffMs)) {
      latest = event;
      continue;
    }

    break;
  }

  if (!latest?.payload) {
    return null;
  }

  return {
    stdout: latest.payload.stdout || "",
    stderr: latest.payload.stderr || "",
    exitCode: latest.payload.exitCode ?? 0,
    executionTime: latest.payload.executionTime ?? 0,
  };
}

export function getChatMessagesAtTime(events, startMs, currentTimeMs) {
  const cutoffMs = startMs + currentTimeMs;

  return events.filter(
    (event) => event.type === "chat_message" && isEventAtOrBefore(event, cutoffMs)
  );
}

export function getLanguageAtTime(events, startMs, currentTimeMs, fallbackLanguage) {
  const cutoffMs = startMs + currentTimeMs;
  let language = fallbackLanguage;

  for (const event of events) {
    if (!isEventAtOrBefore(event, cutoffMs)) {
      break;
    }

    if (event.type === "language_change" && event.payload?.to) {
      language = event.payload.to;
    }

    if (event.type === "code_snapshot" && event.payload?.language) {
      language = event.payload.language;
    }

    if (event.type === "code_run" && event.payload?.language) {
      language = event.payload.language;
    }
  }

  return language;
}

export function getCodeAtTime(events, startMs, currentTimeMs) {
  return getSnapshotAtTime(events, startMs, currentTimeMs)?.payload?.code || "";
}
