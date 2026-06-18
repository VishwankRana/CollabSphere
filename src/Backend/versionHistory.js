import * as Y from "yjs";

import Document from "./models/Document.js";
import DocumentContent from "./models/DocumentContent.js";
import DocumentVersion from "./models/DocumentVersion.js";

const MAX_VERSIONS_PER_DOCUMENT = 50;
const AUTO_SNAPSHOT_INTERVAL_MS = 10 * 60 * 1000;

export const lastSnapshotTimes = new Map();
export const lastSnapshotAuthors = new Map();

export function serializeVersion(version) {
  return {
    _id: String(version._id),
    authorName: version.authorName,
    snapshotType: version.snapshotType,
    label: version.label || null,
    createdAt: version.createdAt,
  };
}

export function getAuthorFromAwareness(ydoc) {
  if (!ydoc.awareness) {
    return null;
  }

  for (const state of ydoc.awareness.getStates().values()) {
    if (state?.user?.name) {
      return {
        authorName: state.user.name,
      };
    }
  }

  return null;
}

export async function resolveSnapshotAuthor(documentId, ydoc, explicitAuthor) {
  if (explicitAuthor?.authorId && explicitAuthor?.authorName) {
    return explicitAuthor;
  }

  const awarenessAuthor = getAuthorFromAwareness(ydoc);

  if (awarenessAuthor?.authorName) {
    const document = await Document.findById(documentId).select("owner");

    return {
      authorId: document?.owner,
      authorName: awarenessAuthor.authorName,
    };
  }

  const document = await Document.findById(documentId).select("owner").populate("owner", "name");

  if (document?.owner) {
    return {
      authorId: document.owner._id || document.owner,
      authorName: explicitAuthor?.authorName || "Auto-save",
    };
  }

  return {
    authorId: explicitAuthor?.authorId,
    authorName: explicitAuthor?.authorName || "Auto-save",
  };
}

export async function pruneOldVersions(documentId) {
  let count = await DocumentVersion.countDocuments({ documentId });

  while (count > MAX_VERSIONS_PER_DOCUMENT) {
    const oldestAuto = await DocumentVersion.findOne({
      documentId,
      snapshotType: "auto",
    }).sort({ createdAt: 1 });

    if (!oldestAuto) {
      break;
    }

    await DocumentVersion.deleteOne({ _id: oldestAuto._id });
    count -= 1;
  }
}

export async function saveDocumentVersion({
  documentId,
  ydoc,
  snapshotType,
  label,
  author,
}) {
  const resolvedAuthor = await resolveSnapshotAuthor(documentId, ydoc, author);
  const content = Buffer.from(Y.encodeStateAsUpdate(ydoc));

  const version = await DocumentVersion.create({
    documentId,
    content,
    authorId: resolvedAuthor.authorId,
    authorName: resolvedAuthor.authorName,
    snapshotType,
    label: label?.trim() || undefined,
  });

  await pruneOldVersions(documentId);

  return version;
}

export function restoreDocumentFromSnapshot(ydoc, snapshotBuffer) {
  const restoredDoc = new Y.Doc();
  Y.applyUpdate(restoredDoc, new Uint8Array(snapshotBuffer));

  const stateVector = Y.encodeStateVector(ydoc);
  const restoreUpdate = Y.encodeStateAsUpdate(restoredDoc, stateVector);
  Y.applyUpdate(ydoc, restoreUpdate);
}

export async function loadYDocState(docId, ydoc) {
  const savedContent = await DocumentContent.findOne({ docId });

  if (savedContent?.yjsState?.length) {
    Y.applyUpdate(ydoc, new Uint8Array(savedContent.yjsState));
  }
}

export async function maybeCreateAutoSnapshot(documentId, docId, ydoc) {
  const now = Date.now();
  const lastSnapshotTime = lastSnapshotTimes.get(docId) || 0;

  if (now - lastSnapshotTime < AUTO_SNAPSHOT_INTERVAL_MS) {
    return null;
  }

  const pendingAuthor = lastSnapshotAuthors.get(docId);
  const version = await saveDocumentVersion({
    documentId,
    ydoc,
    snapshotType: "auto",
    author: pendingAuthor,
  });

  lastSnapshotTimes.set(docId, now);
  return version;
}

export function trackDocumentUpdate(docId, ydoc) {
  const author = getAuthorFromAwareness(ydoc);

  if (author) {
    lastSnapshotAuthors.set(docId, author);
  }
}
