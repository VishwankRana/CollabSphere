import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { IndexeddbPersistence } from "y-indexeddb";

export { attachYjsConnectionListeners, getConnectionStatus } from "./connectionStatus.js";

export function createInterviewProvider(roomId) {
  const yjsRoomName = `interview-${roomId}`;
  const websocketUrl =
    import.meta.env.VITE_COLLAB_SERVER_URL ?? "ws://localhost:1234";
  const token = localStorage.getItem("collab-auth-token");

  const ydoc = new Y.Doc();
  const indexeddbProvider = new IndexeddbPersistence(
    `interview-doc-${roomId}`,
    ydoc
  );

  const provider = new WebsocketProvider(websocketUrl, yjsRoomName, ydoc, {
    params: token ? { token } : {},
    connect: false,
    resyncInterval: 5000,
  });

  function connectWebsocket() {
    if (!provider.shouldConnect) {
      provider.connect();
    }
  }

  if (indexeddbProvider.synced) {
    connectWebsocket();
  } else {
    indexeddbProvider.once("synced", connectWebsocket);
  }

  return {
    provider,
    ydoc,
    indexeddbProvider,
    yjsRoomName,
  };
}
