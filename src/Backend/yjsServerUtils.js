import * as Y from "yjs";
import * as syncProtocol from "y-protocols/sync";
import * as awarenessProtocol from "y-protocols/awareness";
import * as encoding from "lib0/encoding";
import * as decoding from "lib0/decoding";
import * as map from "lib0/map";

const wsReadyStateConnecting = 0;
const wsReadyStateOpen = 1;
const pingTimeout = 30000;
const docs = new Map();

let persistence = null;

const messageSync = 0;
const messageAwareness = 1;

export function setPersistence(nextPersistence) {
  persistence = nextPersistence;
}

class WSSharedDoc extends Y.Doc {
  constructor(name, gc) {
    super({ gc });
    this.name = name;
    this.conns = new Map();
    this.awareness = new awarenessProtocol.Awareness(this);
    this.awareness.setLocalState(null);

    this.awareness.on("update", ({ added, updated, removed }, conn) => {
      const changedClients = added.concat(updated, removed);

      if (conn !== null) {
        const controlledIds = this.conns.get(conn);

        if (controlledIds) {
          added.forEach((clientId) => controlledIds.add(clientId));
          removed.forEach((clientId) => controlledIds.delete(clientId));
        }
      }

      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, messageAwareness);
      encoding.writeVarUint8Array(
        encoder,
        awarenessProtocol.encodeAwarenessUpdate(this.awareness, changedClients)
      );

      const message = encoding.toUint8Array(encoder);
      this.conns.forEach((_value, connection) => send(this, connection, message));
    });

    this.on("update", (update) => {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, messageSync);
      syncProtocol.writeUpdate(encoder, update);

      const message = encoding.toUint8Array(encoder);
      this.conns.forEach((_value, connection) => send(this, connection, message));
    });
  }
}

function getYDoc(docName, gc = true) {
  return map.setIfUndefined(docs, docName, () => {
    const doc = new WSSharedDoc(docName, gc);

    if (persistence) {
      persistence.bindState(docName, doc);
    }

    return doc;
  });
}

export function getDocumentYDoc(docName, { gc = true, create = true } = {}) {
  if (!create && !docs.has(docName)) {
    return null;
  }

  return getYDoc(docName, gc);
}

function closeConnection(doc, conn) {
  if (doc.conns.has(conn)) {
    const controlledIds = doc.conns.get(conn);

    doc.conns.delete(conn);
    awarenessProtocol.removeAwarenessStates(
      doc.awareness,
      Array.from(controlledIds || []),
      null
    );

    if (doc.conns.size === 0 && persistence) {
      persistence.writeState(doc.name, doc).then(() => {
        doc.destroy();
      });
      docs.delete(doc.name);
    }
  }

  conn.close();
}

function send(doc, conn, message) {
  if (
    conn.readyState !== wsReadyStateConnecting &&
    conn.readyState !== wsReadyStateOpen
  ) {
    closeConnection(doc, conn);
    return;
  }

  try {
    conn.send(message, {}, (error) => {
      if (error) {
        closeConnection(doc, conn);
      }
    });
  } catch {
    closeConnection(doc, conn);
  }
}

function handleMessage(conn, doc, message) {
  try {
    const encoder = encoding.createEncoder();
    const decoder = decoding.createDecoder(message);
    const messageType = decoding.readVarUint(decoder);

    switch (messageType) {
      case messageSync:
        encoding.writeVarUint(encoder, messageSync);
        syncProtocol.readSyncMessage(decoder, encoder, doc, conn);

        if (encoding.length(encoder) > 1) {
          send(doc, conn, encoding.toUint8Array(encoder));
        }
        break;
      case messageAwareness:
        awarenessProtocol.applyAwarenessUpdate(
          doc.awareness,
          decoding.readVarUint8Array(decoder),
          conn
        );
        break;
      default:
        break;
    }
  } catch (error) {
    console.error(error);
    doc.emit("error", [error]);
  }
}

export function setupWSConnection(
  conn,
  req,
  { docName = (req.url || "").slice(1).split("?")[0], gc = true } = {}
) {
  conn.binaryType = "arraybuffer";

  const doc = getYDoc(docName, gc);
  doc.conns.set(conn, new Set());

  conn.on("message", (message) =>
    handleMessage(conn, doc, new Uint8Array(message))
  );

  let pongReceived = true;
  const pingInterval = setInterval(() => {
    if (!pongReceived) {
      if (doc.conns.has(conn)) {
        closeConnection(doc, conn);
      }
      clearInterval(pingInterval);
      return;
    }

    if (doc.conns.has(conn)) {
      pongReceived = false;

      try {
        conn.ping();
      } catch {
        closeConnection(doc, conn);
        clearInterval(pingInterval);
      }
    }
  }, pingTimeout);

  conn.on("close", () => {
    closeConnection(doc, conn);
    clearInterval(pingInterval);
  });

  conn.on("pong", () => {
    pongReceived = true;
  });

  const syncEncoder = encoding.createEncoder();
  encoding.writeVarUint(syncEncoder, messageSync);
  syncProtocol.writeSyncStep1(syncEncoder, doc);
  send(doc, conn, encoding.toUint8Array(syncEncoder));

  const awarenessStates = doc.awareness.getStates();
  if (awarenessStates.size > 0) {
    const awarenessEncoder = encoding.createEncoder();
    encoding.writeVarUint(awarenessEncoder, messageAwareness);
    encoding.writeVarUint8Array(
      awarenessEncoder,
      awarenessProtocol.encodeAwarenessUpdate(
        doc.awareness,
        Array.from(awarenessStates.keys())
      )
    );
    send(doc, conn, encoding.toUint8Array(awarenessEncoder));
  }
}
