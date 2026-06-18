# Change Log

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
