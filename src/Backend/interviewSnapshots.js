import InterviewRoom from "./models/InterviewRoom.js";
import RecordingEvent from "./models/RecordingEvent.js";
import { getYjsRoomName } from "./interviewRooms.js";
import { getDocumentYDoc } from "./yjsServerUtils.js";

const SNAPSHOT_INTERVAL_MS = 30 * 1000;

const snapshotTimers = new Map();

function resolveInterviewYDoc(roomId) {
  return getDocumentYDoc(getYjsRoomName(roomId), { create: false });
}

export function startInterviewSnapshotTimer(roomId) {
  const key = String(roomId);

  if (snapshotTimers.has(key)) {
    return;
  }

  const timer = setInterval(async () => {
    try {
      const room = await InterviewRoom.findById(key);

      if (!room || room.status === "ended") {
        stopInterviewSnapshotTimer(key);
        return;
      }

      if (room.status !== "active") {
        return;
      }

      const activeYdoc = resolveInterviewYDoc(key);

      if (!activeYdoc) {
        return;
      }

      const code = activeYdoc.getText("code").toString();

      if (!code.trim()) {
        return;
      }

      await RecordingEvent.create({
        roomId: key,
        timestamp: new Date(),
        type: "code_snapshot",
        userId: room.interviewerId,
        userRole: "system",
        payload: {
          code,
          language: room.language,
        },
      });
    } catch (error) {
      console.error(`Failed to snapshot interview room ${key}:`, error);
    }
  }, SNAPSHOT_INTERVAL_MS);

  snapshotTimers.set(key, timer);
}

export function stopInterviewSnapshotTimer(roomId) {
  const key = String(roomId);
  const timer = snapshotTimers.get(key);

  if (!timer) {
    return;
  }

  clearInterval(timer);
  snapshotTimers.delete(key);
}
