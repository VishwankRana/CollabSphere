import { useEffect, useMemo, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";

import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import { Markdown } from "@tiptap/markdown";

import { createProvider, getConnectionStatus } from "../yjs/provider";
import CollaborationCursor from "../extensions/CollaborationCursor";
import InlineHeading from "../extensions/InlineHeading";
import Toolbar from "./Toolbar";

function formatColor(seed) {
  return `#${(seed & 0xffffff).toString(16).padStart(6, "0")}`;
}

function createCursorUser(clientId) {
  return {
    name: `User ${clientId % 100}`,
    color: formatColor(clientId * 2654435761),
  };
}

export default function Editor({
  documentId,
  documentTitle = "document",
  readOnly = false,
  userName = "Guest",
}) {
  const editorCardRef = useRef(null);
  const { provider, ydoc, indexeddbProvider } = useMemo(() => {
    return createProvider(documentId);
  }, [documentId]);
  const [connectionStatus, setConnectionStatus] = useState(() =>
    getConnectionStatus(provider)
  );
  const [showOfflineToast, setShowOfflineToast] = useState(false);
  const hasBeenSyncedRef = useRef(false);
  const offlineToastTimeoutRef = useRef(null);
  const syncFallbackTimeoutRef = useRef(null);

  useEffect(() => {
    function showOfflineToastIfNeeded() {
      if (!hasBeenSyncedRef.current) {
        return;
      }

      setShowOfflineToast(true);
      window.clearTimeout(offlineToastTimeoutRef.current);
      offlineToastTimeoutRef.current = window.setTimeout(() => {
        setShowOfflineToast(false);
      }, 4000);
    }

    function clearSyncFallback() {
      window.clearTimeout(syncFallbackTimeoutRef.current);
      syncFallbackTimeoutRef.current = null;
    }

    function scheduleSyncFallback() {
      clearSyncFallback();

      syncFallbackTimeoutRef.current = window.setTimeout(() => {
        if (provider.wsconnected && !provider.synced) {
          hasBeenSyncedRef.current = true;
          setConnectionStatus("synced");
        }
      }, 2000);
    }

    function updateConnectionStatus() {
      const nextStatus = getConnectionStatus(provider);
      setConnectionStatus(nextStatus);

      if (nextStatus === "synced") {
        hasBeenSyncedRef.current = true;
        clearSyncFallback();
        return;
      }

      if (nextStatus === "disconnected" && hasBeenSyncedRef.current) {
        showOfflineToastIfNeeded();
        clearSyncFallback();
        return;
      }

      if (nextStatus === "connected") {
        scheduleSyncFallback();
      }
    }

    const handleStatus = ({ status }) => {
      if (status === "connected") {
        updateConnectionStatus();
        window.setTimeout(updateConnectionStatus, 0);
        window.setTimeout(updateConnectionStatus, 250);
        return;
      }

      updateConnectionStatus();
    };

    const handleSync = () => {
      updateConnectionStatus();
    };

    const handleConnectionClose = () => {
      updateConnectionStatus();
    };

    const handleConnectionError = () => {
      setConnectionStatus("disconnected");
      showOfflineToastIfNeeded();
      clearSyncFallback();
    };

    updateConnectionStatus();

    provider.on("status", handleStatus);
    provider.on("sync", handleSync);
    provider.on("connection-close", handleConnectionClose);
    provider.on("connection-error", handleConnectionError);

    return () => {
      clearSyncFallback();
      window.clearTimeout(offlineToastTimeoutRef.current);
      provider.off("status", handleStatus);
      provider.off("sync", handleSync);
      provider.off("connection-close", handleConnectionClose);
      provider.off("connection-error", handleConnectionError);
      indexeddbProvider.destroy();
      provider.destroy();
      ydoc.destroy();
    };
  }, [provider, ydoc, indexeddbProvider]);

  const cursorUser = useMemo(() => {
    return {
      ...createCursorUser(ydoc.clientID),
      name: userName,
    };
  }, [userName, ydoc]);

  const editor = useEditor({
    editable: !readOnly,
    extensions: [
      StarterKit.configure({
        heading: false,
        undoRedo: false,
      }),

      InlineHeading,

      Markdown,

      Collaboration.configure({
        document: ydoc,
      }),

      CollaborationCursor.configure({
        provider: provider,
        user: cursorUser,
      }),
    ],
  }, [provider, ydoc, cursorUser]);

  return (
    <section className="editor-panel">
      <div className="panel-header">
        <div>
          <p className="panel-kicker">Shared document</p>
          <h2>Focus editor</h2>
        </div>
      </div>

      <div className="document-meta">
        <span>Document ID</span>
        <strong>{documentId}</strong>
      </div>

      <div className="editor-card" ref={editorCardRef}>
        <Toolbar
          connectionStatus={connectionStatus}
          disabled={readOnly}
          documentTitle={documentTitle}
          editor={editor}
          editorContainerRef={editorCardRef}
        />
        <EditorContent className="editor-content" key={documentId} editor={editor} />
      </div>

      {showOfflineToast ? (
        <div className="offline-toast" role="status">
          You&apos;re offline. Changes will sync when you reconnect.
        </div>
      ) : null}
    </section>
  );
}
