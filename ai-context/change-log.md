# Change Log

## 2026-06-19 — Dashboard role filter and problem difficulty

- **Timestamp:** 2026-06-19
- **Files changed:**
  - `src/Backend/models/InterviewRoom.js`
  - `src/Backend/routes/rooms.js`
  - `src/Frontend/pages/InterviewDashboardPage.jsx`
  - `src/Frontend/pages/CreateInterviewRoomPage.jsx`
  - `src/Frontend/components/ProblemPanel.jsx`
  - `src/Frontend/styles/codescreen.css`
- **Summary of change:** Replaced dashboard New Interview button with Interviewer/Candidate view toggles; API now returns rooms for both roles; create interview form adds Easy/Medium/Hard difficulty selection.
- **Impacted modules:** Dashboard, room creation, rooms API
- **Risk level:** Low

## 2026-06-19 — Analytics back link, sidebar cleanup

- **Timestamp:** 2026-06-19
- **Files changed:**
  - `src/Frontend/pages/InterviewAnalyticsPage.jsx`
  - `src/Frontend/components/Sidebar.jsx`
  - `src/Frontend/styles/codescreen.css`
- **Summary of change:** Analytics back navigation now returns to the interview room page; removed Settings from the sidebar; replaced Interviewer label with the signed-in user's email.
- **Impacted modules:** Analytics navigation, app sidebar
- **Risk level:** Low

## 2026-06-19 — Output panel test cases, resize UX, chat layout polish

- **Timestamp:** 2026-06-19
- **Files changed:**
  - `src/Frontend/components/CodeOutputPanel.jsx`
  - `src/Frontend/components/ChatPanel.jsx`
  - `src/Frontend/components/ProblemPanel.jsx`
  - `src/Frontend/components/ResizeHandle.jsx`
  - `src/Frontend/pages/InterviewRoomPage.jsx`
  - `src/Frontend/styles/codescreen.css`
- **Summary of change:** Always show Test Cases tab with room test case definitions; improved vertical resize handle hit area and layout; centered chat empty/closed messages; moved collapse control to In this room header; reduced difficulty badge size.
- **Impacted modules:** Interview room UI
- **Risk level:** Low

## 2026-06-19 — Interview room resizable panels, chat relocation, timer fix

- **Timestamp:** 2026-06-19
- **Files changed:**
  - `src/Frontend/components/ResizeHandle.jsx` (new)
  - `src/Frontend/components/ProblemPanel.jsx`
  - `src/Frontend/components/ChatPanel.jsx`
  - `src/Frontend/components/CodeOutputPanel.jsx`
  - `src/Frontend/pages/InterviewRoomPage.jsx`
  - `src/Frontend/styles/codescreen.css`
- **Summary of change:** Added draggable resizable panels between problem, editor, and output sections; moved chat into the problem panel; moved test cases into output panel tabs (Output / Test Cases); removed quick references; fixed interview timer to stop when the session ends.
- **Impacted modules:** Interview room layout and UI
- **Risk level:** Low

## 2026-06-19 — Sidebar, density improvements, lucide-react icons

- **Timestamp:** 2026-06-19
- **Files changed:**
  - `package.json`, `package-lock.json`
  - `src/Frontend/App.jsx`
  - `src/Frontend/components/AppShellLayout.jsx` (new)
  - `src/Frontend/components/Sidebar.jsx` (new)
  - `src/Frontend/components/IconLabel.jsx` (new)
  - `src/Frontend/components/ConnectionStatusBadge.jsx`
  - `src/Frontend/components/ProblemPanel.jsx`
  - `src/Frontend/components/CodeOutputPanel.jsx`
  - `src/Frontend/components/ChatPanel.jsx`
  - `src/Frontend/components/CollaborativeCodeEditor.jsx`
  - `src/Frontend/pages/InterviewDashboardPage.jsx`
  - `src/Frontend/pages/CreateInterviewRoomPage.jsx`
  - `src/Frontend/pages/InterviewRoomPage.jsx`
  - `src/Frontend/pages/InterviewAnalyticsPage.jsx`
  - `src/Frontend/pages/InterviewReplayPage.jsx`
  - `src/Frontend/pages/SettingsPage.jsx` (new)
  - `src/Frontend/lib/timeFormat.js` (new)
  - `src/Frontend/styles/codescreen.css`
- **Summary of change:** Added persistent collapsible sidebar layout, filled empty UI areas with stats/denser tables/participant strips/analytics sections, replaced text symbols with lucide-react icons throughout, and increased spacing density on dashboard, interview room, and analytics pages.
- **Impacted modules:** Frontend layout and interview UI
- **Risk level:** Low

## 2026-06-19 — CodeScreen UI redesign (interview platform)

- **Timestamp:** 2026-06-19
- **Files changed:**
  - `index.html`
  - `src/Frontend/main.jsx`
  - `src/Frontend/index.css`
  - `src/Frontend/styles/codescreen.css` (new)
  - `src/Frontend/lib/monacoTheme.js` (new)
  - `src/Frontend/components/AppTopBar.jsx` (new)
  - `src/Frontend/components/CollaborativeCodeEditor.jsx`
  - `src/Frontend/components/LanguageSelector.jsx`
  - `src/Frontend/components/CodeOutputPanel.jsx`
  - `src/Frontend/components/ChatPanel.jsx`
  - `src/Frontend/components/ProblemPanel.jsx`
  - `src/Frontend/pages/InterviewRoomPage.jsx`
  - `src/Frontend/pages/InterviewDashboardPage.jsx`
  - `src/Frontend/pages/CreateInterviewRoomPage.jsx`
  - `src/Frontend/pages/InterviewAnalyticsPage.jsx`
  - `src/Frontend/pages/InterviewReplayPage.jsx`
  - `src/Frontend/pages/JoinInterviewPage.jsx`
  - `src/Frontend/pages/InterviewEndedPage.jsx`
  - `src/Frontend/pages/LoginPage.jsx`
  - `src/Frontend/pages/SignupPage.jsx`
- **Summary of change:** Redesigned the interview platform UI with a dark CodeScreen design system (CSS variables, Inter/Space Grotesk/JetBrains Mono typography), global top bar, full-viewport interview room layout, Monaco `codescreen-dark` theme, tabbed output panel, table dashboard, and restyled auth/analytics/replay pages. UI-only; no backend or business logic changes.
- **Impacted modules:** Frontend interview UI, shared global styles
- **Risk level:** Low


- **Timestamp:** 2026-06-19
- **Files changed:**
  - `src/Backend/models/InterviewRoom.js` (new)
  - `src/Backend/models/RecordingEvent.js` (new)
  - `src/Backend/models/CheatLog.js` (new)
- **Summary of change:** Added Mongoose models for interview rooms, recording events, and cheat logs to support the coding interview platform alongside the existing document editor.
- **Impacted modules:** Backend data layer
- **Risk level:** Low

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
