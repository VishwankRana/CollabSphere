import { verifyToken } from "../auth.js";
import { getRoomRole } from "../interviewRooms.js";
import InterviewRoom from "../models/InterviewRoom.js";
import RecordingEvent from "../models/RecordingEvent.js";
import CheatLog from "../models/CheatLog.js";
import User from "../models/User.js";

const VALID_LANGUAGES = new Set(["javascript", "python", "java", "cpp"]);
const VALID_CHEAT_TYPES = new Set(["tab_switch", "focus_loss", "paste", "inactivity"]);

function getRoomChannel(roomId) {
  return `room:${String(roomId)}`;
}

function getRoleChannel(roomId, role) {
  return `${getRoomChannel(roomId)}:${role}`;
}

async function authorizeRoomSocket(socket, roomId) {
  if (!roomId || !socket.data.user) {
    return null;
  }

  const room = await InterviewRoom.findById(roomId);

  if (!room) {
    return null;
  }

  const role = getRoomRole(room, socket.data.user._id);

  if (!role) {
    return null;
  }

  return { room, role };
}

function attachSocketToRoom(socket, roomId, role) {
  socket.data.interviewRoomId = String(roomId);
  socket.data.interviewRole = role;
  socket.join(getRoomChannel(roomId));
  socket.join(getRoleChannel(roomId, role));
}

function detachSocketFromRoom(socket) {
  const roomId = socket.data.interviewRoomId;

  if (!roomId) {
    return null;
  }

  const role = socket.data.interviewRole;
  socket.leave(getRoomChannel(roomId));

  if (role) {
    socket.leave(getRoleChannel(roomId, role));
  }

  socket.data.interviewRoomId = null;
  socket.data.interviewRole = null;

  return { roomId, role };
}

export function registerRoomHandlers(io) {
  io.use(async (socket, next) => {
    try {
      if (!socket.handshake.auth?.token) {
        next(new Error("Authentication required."));
        return;
      }

      const payload = verifyToken(socket.handshake.auth.token);
      const user = await User.findById(payload.sub);

      if (!user) {
        next(new Error("Authentication required."));
        return;
      }

      socket.data.user = user;
      next();
    } catch {
      next(new Error("Authentication required."));
    }
  });

  io.on("connection", (socket) => {
    socket.on("room:join", async ({ roomId }) => {
      try {
        const auth = await authorizeRoomSocket(socket, roomId);

        if (!auth) {
          return;
        }

        attachSocketToRoom(socket, roomId, auth.role);

        socket.to(getRoomChannel(roomId)).emit("room:user_joined", {
          userId: String(socket.data.user._id),
          name: socket.data.user.name,
          role: auth.role,
        });
      } catch (error) {
        console.error("room:join failed:", error);
      }
    });

    socket.on("room:leave", ({ roomId }) => {
      const activeRoomId = roomId || socket.data.interviewRoomId;
      const detached = detachSocketFromRoom(socket);

      if (!detached && !activeRoomId) {
        return;
      }

      const resolvedRoomId = detached?.roomId || String(activeRoomId);
      const resolvedRole = detached?.role || socket.data.interviewRole;

      socket.to(getRoomChannel(resolvedRoomId)).emit("room:user_left", {
        userId: String(socket.data.user._id),
        name: socket.data.user.name,
        role: resolvedRole,
      });
    });

    socket.on("chat:send", async ({ roomId, text }) => {
      try {
        const messageText = text?.trim();

        if (!messageText) {
          return;
        }

        const auth = await authorizeRoomSocket(socket, roomId);

        if (!auth) {
          return;
        }

        const message = {
          text: messageText,
          senderName: socket.data.user.name,
          role: auth.role,
          timestamp: new Date(),
        };

        io.to(getRoomChannel(roomId)).emit("chat:message", message);

        await RecordingEvent.create({
          roomId,
          timestamp: message.timestamp,
          type: "chat_message",
          userId: socket.data.user._id,
          userRole: auth.role,
          payload: {
            text: message.text,
            senderName: message.senderName,
          },
        });
      } catch (error) {
        console.error("chat:send failed:", error);
      }
    });

    socket.on("language:change", async ({ roomId, language }) => {
      try {
        if (!VALID_LANGUAGES.has(language)) {
          return;
        }

        const auth = await authorizeRoomSocket(socket, roomId);

        if (!auth || auth.role !== "interviewer") {
          return;
        }

        const previousLanguage = auth.room.language;
        auth.room.language = language;
        await auth.room.save();

        io.to(getRoomChannel(roomId)).emit("language:changed", {
          language,
          changedBy: socket.data.user.name,
        });

        await RecordingEvent.create({
          roomId,
          timestamp: new Date(),
          type: "language_change",
          userId: socket.data.user._id,
          userRole: auth.role,
          payload: {
            from: previousLanguage,
            to: language,
          },
        });
      } catch (error) {
        console.error("language:change failed:", error);
      }
    });

    socket.on("code:run", async ({ roomId, code, language, stdin }) => {
      try {
        const auth = await authorizeRoomSocket(socket, roomId);

        if (!auth) {
          return;
        }

        io.to(getRoomChannel(roomId)).emit("code:running", { roomId });

        io.to(getRoomChannel(roomId)).emit("code:result", {
          roomId,
          stdout: "",
          stderr: "Code execution is not configured yet. It will be enabled in the next module.",
          exitCode: 1,
          executionTime: 0,
          language: language || auth.room.language,
          stdin: stdin || "",
          code: code || "",
        });
      } catch (error) {
        console.error("code:run failed:", error);
      }
    });

    socket.on("cheat:event", async ({ roomId, type, metadata }) => {
      try {
        if (!VALID_CHEAT_TYPES.has(type)) {
          return;
        }

        const auth = await authorizeRoomSocket(socket, roomId);

        if (!auth || auth.role !== "candidate") {
          return;
        }

        const timestamp = new Date();

        await CheatLog.create({
          roomId,
          candidateId: socket.data.user._id,
          type,
          metadata: metadata || {},
        });

        io.to(getRoleChannel(roomId, "interviewer")).emit("cheat:flagged", {
          type,
          timestamp,
        });
      } catch (error) {
        console.error("cheat:event failed:", error);
      }
    });

    socket.on("disconnect", () => {
      const detached = detachSocketFromRoom(socket);

      if (!detached?.roomId || !detached.role) {
        return;
      }

      socket.to(getRoomChannel(detached.roomId)).emit("room:user_left", {
        userId: String(socket.data.user._id),
        name: socket.data.user.name,
        role: detached.role,
      });
    });
  });
}
