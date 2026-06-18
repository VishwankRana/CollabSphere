import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { IndexeddbPersistence } from "y-indexeddb";

export function createProvider(documentId) {
  const websocketUrl =
    import.meta.env.VITE_COLLAB_SERVER_URL ?? "ws://localhost:1234";
  const token = localStorage.getItem("collab-auth-token");

  const ydoc = new Y.Doc();

  const indexeddbProvider = new IndexeddbPersistence(`doc-${documentId}`, ydoc);

  indexeddbProvider.on("synced", () => {
    console.log("Loaded from local storage");
  });

  const provider = new WebsocketProvider(websocketUrl, documentId, ydoc, {
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

  return { provider, ydoc, indexeddbProvider };
}

export function getConnectionStatus(provider) {
  if (!provider.wsconnected && !provider.wsconnecting) {
    return "disconnected";
  }

  if (provider.synced) {
    return "synced";
  }

  if (provider.wsconnecting) {
    return "connecting";
  }

  return "connected";
}
