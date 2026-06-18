# Change Log

## 2026-06-19 — Fix connection status stuck on Syncing

- **Timestamp:** 2026-06-19
- **Files changed:**
  - `src/Frontend/yjs/provider.js`
  - `src/Frontend/components/Editor.jsx`
- **Summary of change:** Deferred WebSocket connect until IndexedDB finishes loading, derive badge status from provider.synced, and added a connected-state fallback when y-websocket never emits sync completion.
- **Impacted modules:** Yjs provider, connection status UI
- **Risk level:** Low

## 2026-06-19 — Feature 3: Export (Markdown + PDF)

- **Timestamp:** 2026-06-19
- **Files changed:**
  - `src/Frontend/lib/exportDocument.js` (new)
  - `src/Frontend/components/ExportDropdown.jsx` (new)
  - `src/Frontend/components/Editor.jsx`
  - `src/Frontend/components/Toolbar.jsx`
  - `src/Frontend/pages/DocumentPage.jsx`
  - `src/Frontend/index.css`
  - `package.json`
  - `package-lock.json`
- **Summary of change:** Added client-side Markdown and PDF export via toolbar dropdown, registered @tiptap/markdown on the editor, and hid collaboration UI during PDF generation.
- **Impacted modules:** Editor toolbar, export utilities
- **Risk level:** Low

## 2026-06-19 — Feature 2: Offline Support + Connection Status

- **Timestamp:** 2026-06-19
- **Files changed:**
  - `src/Frontend/yjs/provider.js`
  - `src/Frontend/components/ConnectionStatusBadge.jsx` (new)
  - `src/Frontend/components/Editor.jsx`
  - `src/Frontend/components/Toolbar.jsx`
  - `src/Frontend/index.css`
  - `package.json`
  - `package-lock.json`
- **Summary of change:** Added IndexedDB persistence via y-indexeddb for offline editing, WebSocket connection status tracking, a toolbar connection badge (Synced / Syncing / Offline), and an offline toast when connection drops after being synced.
- **Impacted modules:** Yjs provider, editor toolbar, connection UI
- **Risk level:** Medium

## 2026-06-19 — Fix version restore + consistent Versions UI

- **Timestamp:** 2026-06-19
- **Files changed:**
  - `src/Backend/versionHistory.js`
  - `src/Backend/Server.js`
  - `src/Frontend/components/DocumentVersionsPanel.jsx`
  - `src/Frontend/index.css`
- **Summary of change:** Fixed restore to fully replace Yjs shared document content (so the editor updates live), aligned Commit/Restore/History buttons with existing app styles, and removed emoji usage.
- **Impacted modules:** Version restore, Versions sidebar UI
- **Risk level:** Medium

## 2026-06-19 — Version History UI moved to sidebar + Commit button

- **Timestamp:** 2026-06-19
- **Files changed:**
  - `src/Frontend/components/DocumentVersionsPanel.jsx` (new)
  - `src/Frontend/components/VersionHistoryPanel.jsx` (removed)
  - `src/Frontend/components/Editor.jsx`
  - `src/Frontend/components/Toolbar.jsx`
  - `src/Frontend/pages/DocumentPage.jsx`
  - `src/Frontend/index.css`
- **Summary of change:** Moved version controls out of the editor toolbar into a sidebar panel with a Commit button for manual snapshots, a Version History toggle, and retained backend auto-save every 10 minutes.
- **Impacted modules:** Document page sidebar, editor UI
- **Risk level:** Low

## 2026-06-19 — Feature 1: Version History

- **Timestamp:** 2026-06-19
- **Files changed:**
  - `src/Backend/models/DocumentVersion.js` (new)
  - `src/Backend/versionHistory.js` (new)
  - `src/Backend/yjsServerUtils.js`
  - `src/Backend/Server.js`
  - `src/Frontend/components/VersionHistoryPanel.jsx` (new)
  - `src/Frontend/components/Toolbar.jsx`
  - `src/Frontend/components/Editor.jsx`
  - `src/Frontend/index.css`
  - `package.json`
  - `package-lock.json`
- **Summary of change:** Added document version snapshots with auto-save every 10 minutes, manual save/restore API routes, and a right-side Version History panel in the editor toolbar.
- **Impacted modules:** Backend persistence/Yjs server, document API, editor UI
- **Risk level:** Medium
