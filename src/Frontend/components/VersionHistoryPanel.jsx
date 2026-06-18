import { useCallback, useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";

import { apiRequest } from "../lib/api";

function formatRelativeTime(value) {
  return formatDistanceToNow(new Date(value), { addSuffix: true });
}

export default function VersionHistoryPanel({
  documentId,
  token,
  canEdit,
  isOpen,
  onClose,
  onRestoreSuccess,
}) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [label, setLabel] = useState("");
  const [showLabelInput, setShowLabelInput] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmingVersionId, setConfirmingVersionId] = useState(null);
  const [restoringVersionId, setRestoringVersionId] = useState(null);

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
    if (!isOpen) {
      return undefined;
    }

    fetchVersions();
    setConfirmingVersionId(null);
    setShowLabelInput(false);
    setLabel("");

    return undefined;
  }, [fetchVersions, isOpen]);

  async function handleSaveVersion() {
    setSaving(true);
    setError("");

    try {
      await apiRequest(`/api/documents/${documentId}/versions/save`, {
        method: "POST",
        token,
        body: {
          label: label.trim() || undefined,
        },
      });

      setLabel("");
      setShowLabelInput(false);
      await fetchVersions();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
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

      onRestoreSuccess?.(version.createdAt);
      onClose();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setRestoringVersionId(null);
      setConfirmingVersionId(null);
    }
  }

  if (!isOpen) {
    return null;
  }

  return (
    <aside className="version-history-panel" aria-label="Version history">
      <div className="panel-header">
        <div>
          <p className="panel-kicker">Snapshots</p>
          <h2>Version History</h2>
        </div>
        <button
          className="version-history-close"
          onClick={onClose}
          type="button"
          aria-label="Close version history"
        >
          ×
        </button>
      </div>

      {canEdit ? (
        <div className="version-history-actions">
          {showLabelInput ? (
            <div className="version-history-save-form">
              <input
                className="comment-input"
                type="text"
                placeholder="Optional label"
                value={label}
                onChange={(event) => setLabel(event.target.value)}
              />
              <div className="version-history-save-buttons">
                <button
                  className="comment-submit"
                  disabled={saving}
                  onClick={handleSaveVersion}
                  type="button"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  className="hero-cancel-button"
                  disabled={saving}
                  onClick={() => {
                    setShowLabelInput(false);
                    setLabel("");
                  }}
                  type="button"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              className="comment-submit"
              disabled={saving}
              onClick={() => setShowLabelInput(true)}
              type="button"
            >
              Save current version
            </button>
          )}
        </div>
      ) : null}

      {error ? <p className="access-message version-history-error">{error}</p> : null}

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
                          {version.snapshotType === "manual" ? "Manual" : "Auto"}
                        </span>
                        {version.label ? (
                          <span className="version-badge version-badge-label">{version.label}</span>
                        ) : null}
                      </div>
                    </div>

                    {canEdit && !isCurrent && !isConfirming ? (
                      <button
                        className="version-restore-button"
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
    </aside>
  );
}
