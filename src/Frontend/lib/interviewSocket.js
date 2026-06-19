import { io } from "socket.io-client";

let interviewSocket = null;

export function getInterviewSocket() {
  if (!interviewSocket) {
    interviewSocket = io(window.location.origin, {
      auth: {
        token: localStorage.getItem("collab-auth-token"),
      },
      autoConnect: true,
    });
  }

  return interviewSocket;
}

export function joinInterviewSocketRoom(roomId) {
  const socket = getInterviewSocket();
  socket.emit("room:join", { roomId });

  return () => {
    socket.emit("room:leave", { roomId });
  };
}
