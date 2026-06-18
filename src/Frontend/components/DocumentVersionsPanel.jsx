import { useCallback, useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";

import { apiRequest } from "../lib/api";

function formatRelativeTime(value) {
  return formatDistanceToNow(new Date(value), { addSuffix: true });
}

export default function DocumentVersionsPanel({ documentId, token, canEdit }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [commitLabel, setCommitLabel] = useState("");
  const [committing, setCommitting] = useState(false);
  const [commitMessage, setCommitMessage] = useState("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [confirmingVersionId, setConfirmingVersionId] = useState(null);
  const [restoringVersionId, setRestoringVersionId] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  const fetchVersions = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await apiRequest(`/api/documents/${documentId}/versions`, { token });
      setVersions(data.versions);
    } catch (requestError) {
      setError(requestError.message);
      setVersions([]);
    } finally {
      setLoading(false);
    }
  }, [documentId, token]);

  useEffect(() => {
    if (!isHistoryOpen) {
      return undefined;
    }

    fetchVersions();
    setConfirmingVersionId(null);

    return undefined;
  }, [fetchVersions, isHistoryOpen]);

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

  async function handleCommit() {
    setCommitting(true);
    setError("");
    setCommitMessage("");

    try {
      await apiRequest(`/api/documents/${documentId}/versions/save`, {
        method: "POST",
        token,
        body: {
          label: commitLabel.trim() || undefined,
        },
      });

      setCommitLabel("");
      setCommitMessage("Version committed.");
      setIsHistoryOpen(true);
      await fetchVersions();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setCommitting(false);
    }
  }

  async function handleRestore(version) {
    setRestoringVersionId(version._id);
    setError("");

    try {
      await apiRequest(
        `/api/documents/${documentId}/versions/${version._id}/restore`,
        {
          method: "POST",
          token,
        }
      );

      const timestamp = new Date(version.createdAt).toLocaleString();
      setToastMessage(`Document restored to ${timestamp} version`);
      setIsHistoryOpen(false);
      await fetchVersions();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setRestoringVersionId(null);
      setConfirmingVersionId(null);
    }
  }

  return (
    <aside className="versions-panel access-panel">
      <div className="panel-header">
        <div>
          <p className="panel-kicker">Snapshots</p>
          <h2>Versions</h2>
        </div>
        <div className="comment-count">{versions.length || "—"}</div>
      </div>

      <p className="comments-subtitle">
        Edits are <strong>auto-saved every 10 minutes</strong>. Use Commit to save a named
        checkpoint you can restore later.
      </p>

      {canEdit ? (
        <div className="version-commit-form">
          <input
            className="comment-input"
            type="text"
            placeholder="Commit message (optional)"
            value={commitLabel}
            onChange={(event) => setCommitLabel(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleCommit();
              }
            }}
          />
          <button
            className="comment-submit"
            disabled={committing}
            onClick={handleCommit}
            type="button"
          >
            {committing ? "Committing..." : "Commit"}
          </button>
        </div>
      ) : null}

      {commitMessage ? <p className="access-message">{commitMessage}</p> : null}
      {error ? <p className="access-message version-history-error">{error}</p> : null}

      <button
        className={`hero-link-button version-history-toggle${
          isHistoryOpen ? " is-active" : ""
        }`}
        onClick={() => setIsHistoryOpen((open) => !open)}
        type="button"
      >
        {isHistoryOpen ? "Hide Version History" : "Version History"}
      </button>

      {isHistoryOpen ? (
        <div className="version-history-list">
          {loading ? <p className="comment-empty">Loading versions...</p> : null}

          {!loading && versions.length === 0 ? (
            <p className="comment-empty">No saved versions yet.</p>
          ) : null}

          {!loading
            ? versions.map((version, index) => {
                const isCurrent = index === 0;
                const isConfirming = confirmingVersionId === version._id;
                const isRestoring = restoringVersionId === version._id;
                const isCommit = version.snapshotType === "manual";

                return (
                  <article
                    className={`version-history-item version-${version.snapshotType}${
                      isConfirming ? " is-confirming" : ""
                    }`}
                    key={version._id}
                  >
                    <div className="version-history-item-main">
                      <span
                        className={`version-dot version-dot-${version.snapshotType}`}
                        aria-hidden="true"
                      />

                      <div className="version-history-item-content">
                        <div className="version-history-item-header">
                          <strong>{version.authorName}</strong>
                          <span className="version-history-time">
                            {formatRelativeTime(version.createdAt)}
                          </span>
                        </div>

                        <div className="version-history-badges">
                          {isCurrent ? (
                            <span className="version-badge version-badge-current">Current</span>
                          ) : null}
                          <span
                            className={`version-badge version-badge-${version.snapshotType}`}
                          >
                            {isCommit ? "Commit" : "Auto"}
                          </span>
                          {version.label ? (
                            <span className="version-badge version-badge-label">
                              {version.label}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {canEdit && !isCurrent && !isConfirming ? (
                        <button
                          className="hero-link-button version-restore-button"
                          onClick={() => setConfirmingVersionId(version._id)}
                          type="button"
                        >
                          Restore
                        </button>
                      ) : null}
                    </div>

                    {isConfirming ? (
                      <div className="version-restore-confirm">
                        <p>
                          Restore this version? This will overwrite the current document for all
                          collaborators.
                        </p>
                        <div className="version-restore-confirm-actions">
                          <button
                            className="comment-submit"
                            disabled={isRestoring}
                            onClick={() => handleRestore(version)}
                            type="button"
                          >
                            {isRestoring ? "Restoring..." : "Confirm"}
                          </button>
                          <button
                            className="hero-cancel-button"
                            disabled={isRestoring}
                            onClick={() => setConfirmingVersionId(null)}
                            type="button"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </article>
                );
              })
            : null}
        </div>
      ) : null}

      {toastMessage ? (
        <p className="access-message" role="status">
          {toastMessage}
        </p>
      ) : null}
    </aside>
  );
}
