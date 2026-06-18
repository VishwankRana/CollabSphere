import { useEffect, useMemo, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";

import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";

import { createProvider } from "../yjs/provider";
import CollaborationCursor from "../extensions/CollaborationCursor";
import InlineHeading from "../extensions/InlineHeading";
import Toolbar from "./Toolbar";
import VersionHistoryPanel from "./VersionHistoryPanel";
import { useAuth } from "../auth/useAuth.jsx";

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

function getStatusLabel(status) {
  if (status === "synced") return "Live";
  if (status === "connected") return "Connected";
  if (status === "connecting") return "Connecting";

  return "Offline";
}

export default function Editor({ documentId, readOnly = false, userName = "Guest" }) {
  const { token } = useAuth();
  const { provider, ydoc } = useMemo(() => {
    return createProvider(documentId);
  }, [documentId]);
  const [connectionStatus, setConnectionStatus] = useState(() =>
    getProviderStatus(provider)
  );
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    const handleStatus = ({ status }) => {
      setConnectionStatus(status);
    };

    const handleSync = (isSynced) => {
      setConnectionStatus(isSynced ? "synced" : "connected");
    };

    const handleConnectionClose = () => {
      setConnectionStatus(getProviderStatus(provider));
    };

    const handleConnectionError = () => {
      setConnectionStatus("disconnected");
    };

    provider.on("status", handleStatus);
    provider.on("sync", handleSync);
    provider.on("connection-close", handleConnectionClose);
    provider.on("connection-error", handleConnectionError);

    return () => {
      provider.off("status", handleStatus);
      provider.off("sync", handleSync);
      provider.off("connection-close", handleConnectionClose);
      provider.off("connection-error", handleConnectionError);
      provider.destroy();
      ydoc.destroy();
    };
  }, [provider, ydoc]);

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

  useEffect(() => {
    if (!toastMessage) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setToastMessage("");
    }, 4000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [toastMessage]);

  function handleRestoreSuccess(restoredAt) {
    const timestamp = new Date(restoredAt).toLocaleString();
    setToastMessage(`Document restored to ${timestamp} version`);
  }

  return (
    <section className={`editor-panel${isVersionHistoryOpen ? " has-version-panel" : ""}`}>
      <div className="panel-header">
        <div>
          <p className="panel-kicker">Shared document</p>
          <h2>Focus editor</h2>
        </div>

        <div className={`status-pill status-${connectionStatus}`}>
          <span className="status-dot" />
          {getStatusLabel(connectionStatus)}
        </div>
      </div>

      <div className="document-meta">
        <span>Document ID</span>
        <strong>{documentId}</strong>
      </div>

      <div className="editor-card">
        <Toolbar
          disabled={readOnly}
          editor={editor}
          onOpenVersionHistory={() => setIsVersionHistoryOpen(true)}
        />
        <EditorContent className="editor-content" key={documentId} editor={editor} />
      </div>

      <VersionHistoryPanel
        canEdit={!readOnly}
        documentId={documentId}
        isOpen={isVersionHistoryOpen}
        onClose={() => setIsVersionHistoryOpen(false)}
        onRestoreSuccess={handleRestoreSuccess}
        token={token}
      />

      {toastMessage ? (
        <div className="editor-toast" role="status">
          {toastMessage}
        </div>
      ) : null}
    </section>
  );
}
