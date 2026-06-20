# CodeScreen

A real-time collaborative coding interview platform with live Monaco editing, question bank, analytics, and session replay — plus a shared document editor built on the same Yjs collaboration stack.

---

## About

**CodeScreen** helps interviewers run live technical interviews and lets candidates code together in real time. Interviewers can create rooms from a built-in question bank or custom problems, invite candidates with a shareable code, run code and tests, review analytics, and replay sessions afterward.

The project also includes a **collaborative document editor** where multiple users can edit rich-text documents with live cursors, role-based access, and MongoDB-backed persistence.

Both experiences share authentication, WebSocket infrastructure, and Yjs CRDT sync for conflict-free multi-user editing.

---

## Features

### Interview platform

- **Live coding rooms** — Monaco editor with JavaScript, Python, Java, and C++
- **Real-time collaboration** — Yjs + y-monaco sync with live cursors (name + role color)
- **Offline resilience** — IndexedDB caching and automatic merge on reconnect
- **Question bank** — 16 built-in LeetCode-style problems plus custom questions (create, edit, filter, use in interviews)
- **Room creation** — Pick from the question bank or write a custom problem with test cases and starter code
- **Code execution** — Run code and hidden/visible test cases via backend execution service
- **In-room chat** — Real-time messaging between interviewer and candidate
- **Anti-cheat signals** — Tab/window focus monitoring for candidates
- **Interview analytics** — Duration, run timeline, integrity signals, final score, and notes
- **Session replay** — Scrub through recorded code snapshots and chat history
- **Role-based dashboard** — Separate Interviewer and Candidate views for past sessions
- **Invite flow** — Copy invite code from the room; candidates join via code or link

### Collaborative documents

- **Rich-text editing** — Tiptap editor with Markdown support
- **Live cursors** — See collaborators’ presence and cursor positions in real time
- **Access control** — Owner, editor, and viewer roles with email-based sharing
- **Version history** — Snapshots and restore for document content
- **MongoDB persistence** — Yjs state stored so content survives restarts

### General

- JWT authentication (signup / login)
- Collapsible app sidebar and dark CodeScreen UI
- Responsive layout for dashboard, room, analytics, and question bank pages

---

## Tech Stack

### Frontend

| Area | Technologies |
|------|----------------|
| Framework | React 19, Vite 8 |
| Routing | React Router 7 |
| Interview editor | Monaco Editor (`@monaco-editor/react`), y-monaco |
| Document editor | Tiptap, `@tiptap/extension-collaboration`, `@tiptap/extension-collaboration-cursor` |
| Real-time (client) | Yjs, y-websocket, y-indexeddb |
| UI | Custom CSS design system, lucide-react icons |
| Utilities | date-fns, Socket.IO client |

### Backend

| Area | Technologies |
|------|----------------|
| Runtime | Node.js, Express 5 |
| Database | MongoDB, Mongoose |
| Auth | Custom JWT (Bearer tokens) |
| Real-time | WebSocket (`ws`, `@y/websocket-server`), Socket.IO |
| CRDT sync | Yjs, y-protocols (awareness + sync) |
| Code execution | JDoodle API integration (configurable via env) |

### Dev & tooling

- ESLint, PostCSS, Tailwind CSS (legacy/global styles)
- npm scripts: `dev`, `server`, `build`, `seed:questions`

---

## Quick start

1. Create a `.env` file in the project root:

```env
PORT=1234
MONGO_URI=mongodb://127.0.0.1:27017/collab-editor
JWT_SECRET=dev-secret-change-me
CORS_ORIGIN=http://localhost:5173
VITE_API_BASE_URL=http://localhost:1234
VITE_COLLAB_SERVER_URL=ws://localhost:1234
```

2. Install dependencies and seed the question bank (optional):

```bash
npm install
npm run seed:questions
```

3. Run the backend and frontend:

```bash
npm run server
npm run dev
```

4. Open [http://localhost:5173](http://localhost:5173).

---

## License

ISC
