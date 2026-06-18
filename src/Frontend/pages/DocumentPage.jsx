import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../auth/useAuth.jsx";
import AccessPanel from "../components/AccessPanel";
import Comments from "../components/Comments";
import DocumentLibrary from "../components/DocumentLibrary.jsx";
import DocumentVersionsPanel from "../components/DocumentVersionsPanel";
import Editor from "../components/Editor";
import { apiRequest } from "../lib/api";
import { getDefaultDocumentPath } from "../lib/documents.js";

export default function DocumentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { logout, token, user } = useAuth();
  const [documentState, setDocumentState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copyState, setCopyState] = useState("idle");
  const [documents, setDocuments] = useState([]);
  const [renameTitle, setRenameTitle] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameMessage, setRenameMessage] = useState("");
  const [renameSaving, setRenameSaving] = useState(false);
  const [deleteSaving, setDeleteSaving] = useState(false);

  const defaultDocumentPath = getDefaultDocumentPath(user);
  const canRedirectToDefault =
    Boolean(user?.id) && defaultDocumentPath !== `/docs/${id}`;

  useEffect(() => {
    if (!id || !token) return;
    let ignore = false;

    apiRequest(`/api/documents/${id}`, { token })
      .then((data) => {
        if (ignore) return;
        setDocumentState(data);
        setRenameTitle(data.document.title);
        setError("");
        setLoading(false);
      })
      .catch((requestError) => {
        if (ignore) return;
        setDocumentState(null);
        setError(requestError.message);
        setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [id, token]);

  useEffect(() => {
    if (!token) return;
    let ignore = false;

    apiRequest("/api/documents", { token })
      .then((data) => {
        if (ignore) return;
        setDocuments(data.documents);
      })
      .catch(() => {
        if (ignore) return;
        setDocuments([]);
      });

    return () => {
      ignore = true;
    };
  }, [token]);

  useEffect(() => {
    if (
      error === "You do not have access to this document." &&
      canRedirectToDefault
    ) {
      navigate(defaultDocumentPath, { replace: true });
    }
  }, [canRedirectToDefault, defaultDocumentPath, error, navigate]);

  if (!id) {
    return <p style={{ padding: 24 }}>Document not found.</p>;
  }

  async function handleAddCollaborator(payload) {
    const data = await apiRequest(`/api/documents/${id}/access`, {
      method: "PATCH",
      token,
      body: payload,
    });

    setDocumentState((current) => ({
      ...current,
      collaborators: data.collaborators,
    }));
  }

  async function handleCreateDocument(title) {
    const data = await apiRequest("/api/documents", {
      method: "POST",
      token,
      body: {
        title: title.trim() || "Untitled Document",
      },
    });

    setDocuments((current) => [data.document, ...current]);
    navigate(`/docs/${data.document.docId}`);
  }

  function handleOpenDocument(docId) {
    navigate(`/docs/${docId}`);
  }

  async function handleDeleteDocument(targetDocument) {
    setDeleteSaving(true);
    await apiRequest(`/api/documents/${targetDocument.docId}`, {
      method: "DELETE",
      token,
    });

    const remainingDocuments = documents.filter(
      (documentItem) => documentItem.docId !== targetDocument.docId
    );

    setDocuments(remainingDocuments);

    if (targetDocument.docId === id) {
      const fallbackDocument = remainingDocuments[0];

      if (fallbackDocument) {
        setDeleteSaving(false);
        navigate(`/docs/${fallbackDocument.docId}`, { replace: true });
        return;
      }

      const data = await apiRequest("/api/documents", {
        method: "POST",
        token,
        body: {
          title: "Untitled Document",
        },
      });

      setDocuments([data.document]);
      setDeleteSaving(false);
      navigate(`/docs/${data.document.docId}`, { replace: true });
      return;
    }

    setDeleteSaving(false);
  }

  async function handleRenameDocument(targetDocument, nextTitle) {
    setRenameSaving(true);
    setRenameMessage("");

    const data = await apiRequest(`/api/documents/${targetDocument.docId}`, {
      method: "PATCH",
      token,
      body: {
        title: nextTitle,
      },
    });

    setDocuments((current) =>
      current.map((documentItem) =>
        documentItem.docId === targetDocument.docId ? data.document : documentItem
      )
    );

    if (targetDocument.docId === id) {
      setDocumentState((current) => ({
        ...current,
        document: {
          ...current.document,
          title: data.document.title,
        },
      }));
    }

    setRenameTitle(data.document.title);
    setIsRenaming(false);
    setRenameSaving(false);
  }

  async function handleHeroRenameSubmit(event) {
    event.preventDefault();

    if (!renameTitle.trim()) {
      setRenameMessage("Document title cannot be empty.");
      return;
    }

    try {
      await handleRenameDocument(documentState.document, renameTitle.trim());
    } catch (error) {
      setRenameSaving(false);
      setRenameMessage(error.message);
    }
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyState("copied");

      window.setTimeout(() => {
        setCopyState("idle");
      }, 1800);
    } catch {
      setCopyState("error");

      window.setTimeout(() => {
        setCopyState("idle");
      }, 1800);
    }
  }

  if (loading) {
    return <main className="auth-shell">Loading document access...</main>;
  }

  if (error || !documentState) {
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <h1>Access issue</h1>
          <p className="hero-copy">
            {error || "Unable to load this document."}
          </p>
          {canRedirectToDefault ? (
            <button
              className="comment-submit"
              onClick={() => navigate(defaultDocumentPath, { replace: true })}
              type="button"
            >
              Go to My Document
            </button>
          ) : null}
          <button className="comment-submit" onClick={logout} type="button">
            Logout
          </button>
        </section>
      </main>
    );
  }

  const { collaborators, document, permissions } = documentState;

  return (
    <main className="document-shell">
      <section className="hero-panel">
        <div className="w-full">
          <p className="eyebrow">Collaborative Workspace</p>
          <div className="hero-headline-row">
            {isRenaming ? (
              <form className="hero-rename-form" onSubmit={handleHeroRenameSubmit}>
                <input
                  className="comment-input hero-rename-input"
                  type="text"
                  value={renameTitle}
                  onChange={(event) => setRenameTitle(event.target.value)}
                />
                <button
                  className="hero-link-button"
                  disabled={renameSaving}
                  type="submit"
                >
                  {renameSaving ? "Saving..." : "Save"}
                </button>
                <button
                  className="hero-cancel-button"
                  onClick={() => {
                    setIsRenaming(false);
                    setRenameTitle(document.title);
                    setRenameMessage("");
                  }}
                  type="button"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <div className="hero-chip">{document.title}</div>
            )}

            <div className="hero-actions">
              {document.role === "owner" && !isRenaming ? (
                <button
                  className="hero-link-button"
                  onClick={() => {
                    setRenameMessage("");
                    setRenameTitle(document.title);
                    setIsRenaming(true);
                  }}
                  type="button"
                >
                  Rename
                </button>
              ) : null}
              {document.role === "owner" ? (
                <button
                  className="hero-delete-button"
                  disabled={deleteSaving}
                  onClick={async () => {
                    const confirmed = window.confirm(
                      `Delete "${document.title}"? This will remove the saved document content too.`,
                    );

                    if (!confirmed) {
                      return;
                    }

                    await handleDeleteDocument(document);
                  }}
                  type="button"
                >
                  {deleteSaving ? "Deleting..." : "Delete"}
                </button>
              ) : null}
              <button
                className="hero-link-button"
                onClick={handleCopyLink}
                type="button"
              >
                {copyState === "copied"
                  ? "Link Copied"
                  : copyState === "error"
                    ? "Copy Failed"
                    : "Copy Link"}
              </button>
              <button
                className="hero-logout-button"
                onClick={logout}
                type="button"
              >
                Logout
              </button>
            </div>
          </div>
          {renameMessage ? <p className="access-message">{renameMessage}</p> : null}
          <p className="hero-copy">
            Signed in as <strong>{user.name}</strong>. Your role for this
            document is <strong>{document.role}</strong>.
          </p>
        </div>
      </section>

      <div className="workspace-grid">
        <Editor
          documentId={id}
          readOnly={!permissions.canEdit}
          userName={user.name}
        />

        <div className="sidebar-stack">
          <DocumentLibrary
            activeDocId={id}
            documents={documents}
            onCreateDocument={handleCreateDocument}
            onOpenDocument={handleOpenDocument}
          />
          <AccessPanel
            canManageAccess={permissions.canManageAccess}
            collaborators={collaborators}
            currentRole={document.role}
            onAddCollaborator={handleAddCollaborator}
            owner={document.owner}
          />
          <DocumentVersionsPanel
            canEdit={permissions.canEdit}
            documentId={id}
            token={token}
          />
          <Comments documentId={id} />
        </div>
      </div>
    </main>
  );
}
