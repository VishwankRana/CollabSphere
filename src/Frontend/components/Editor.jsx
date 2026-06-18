import { useEffect, useMemo, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";

import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";

import { createProvider } from "../yjs/provider";
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

function getProviderStatus(provider) {
  if (provider.synced) return "synced";
  if (provider.wsconnected) return "connected";
  if (provider.wsconnecting) return "connecting";

  return "disconnected";
}

export default function Editor({ documentId, readOnly = false, userName = "Guest" }) {
  const { provider, ydoc, indexeddbProvider } = useMemo(() => {
    return createProvider(documentId);
  }, [documentId]);
  const [connectionStatus, setConnectionStatus] = useState(() =>
    getProviderStatus(provider)
  );
  const [showOfflineToast, setShowOfflineToast] = useState(false);
  const hasBeenSyncedRef = useRef(false);
  const offlineToastTimeoutRef = useRef(null);

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

    const handleStatus = ({ status }) => {
      setConnectionStatus(status);

      if (status === "synced") {
        hasBeenSyncedRef.current = true;
      }

      if (status === "disconnected") {
        showOfflineToastIfNeeded();
      }
    };

    const handleSync = (isSynced) => {
      if (isSynced) {
        hasBeenSyncedRef.current = true;
        setConnectionStatus("synced");
        return;
      }

      setConnectionStatus("connected");
    };

    const handleConnectionClose = () => {
      const nextStatus = getProviderStatus(provider);
      setConnectionStatus(nextStatus);

      if (nextStatus === "disconnected") {
        showOfflineToastIfNeeded();
      }
    };

    const handleConnectionError = () => {
      setConnectionStatus("disconnected");
      showOfflineToastIfNeeded();
    };

    provider.on("status", handleStatus);
    provider.on("sync", handleSync);
    provider.on("connection-close", handleConnectionClose);
    provider.on("connection-error", handleConnectionError);

    return () => {
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

      <div className="editor-card">
        <Toolbar
          connectionStatus={connectionStatus}
          disabled={readOnly}
          editor={editor}
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
