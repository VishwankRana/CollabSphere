import { io } from "socket.io-client";

let interviewSocket = null;

function getSocketUrl() {
  if (import.meta.env.DEV) {
    return window.location.origin;
  }

  return import.meta.env.VITE_API_BASE_URL ?? window.location.origin;
}

function readAuthToken(explicitToken) {
  return explicitToken || localStorage.getItem("collab-auth-token") || "";
}

export function getInterviewSocket(token) {
  const resolvedToken = readAuthToken(token);

  if (!interviewSocket) {
    interviewSocket = io(getSocketUrl(), {
      autoConnect: Boolean(resolvedToken),
      reconnection: true,
      reconnectionAttempts: 10,
      auth: (callback) => {
        callback({ token: readAuthToken(token) });
      },
    });
  } else if (resolvedToken) {
    interviewSocket.auth = { token: resolvedToken };

    if (!interviewSocket.connected) {
      interviewSocket.connect();
    }
  }

  return interviewSocket;
}

export function disconnectInterviewSocket() {
  if (!interviewSocket) {
    return;
  }

  interviewSocket.disconnect();
  interviewSocket = null;
}

export function joinInterviewSocketRoom(roomId, token) {
  const socket = getInterviewSocket(token);

  const joinRoom = () => {
    socket.emit("room:join", { roomId });
  };

  if (socket.connected) {
    joinRoom();
  } else {
    socket.once("connect", joinRoom);
  }

  return () => {
    socket.off("connect", joinRoom);
    socket.emit("room:leave", { roomId });
  };
}
