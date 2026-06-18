import http from "http";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { WebSocketServer } from "ws";
import * as Y from "yjs";
import { setPersistence, setupWSConnection, getDocumentYDoc } from "./yjsServerUtils.js";

import { connectDB, getDatabaseStatus, isDatabaseConnected } from "./db.js";
import { getBearerToken, hashPassword, signToken, verifyPassword, verifyToken } from "./auth.js";
import { canEditDocument, getUserRole, serializeCollaborator } from "./documents.js";
import User from "./models/User.js";
import Document from "./models/Document.js";
import DocumentContent from "./models/DocumentContent.js";
import DocumentVersion from "./models/DocumentVersion.js";
import {
  loadYDocState,
  maybeCreateAutoSnapshot,
  restoreDocumentFromSnapshot,
  saveDocumentVersion,
  serializeVersion,
  trackDocumentUpdate,
} from "./versionHistory.js";

// process.loadEnvFile?.(".env");
dotenv.config();

const PORT = Number(process.env.PORT || 1234);
const ALLOW_START_WITHOUT_DB = process.env.ALLOW_START_WITHOUT_DB === "true";

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

async function persistDocumentState(docId, ydoc) {
  const state = Buffer.from(Y.encodeStateAsUpdate(ydoc));

  await DocumentContent.findOneAndUpdate(
    { docId },
    { docId, yjsState: state },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

app.use(cors({
  origin: true,
  credentials: true,
}));
app.options(/.*/, cors());
app.use(express.json());

app.get("/health", (_request, response) => {
  response.send("OK");
});

app.use("/api", (request, response, next) => {
  if (request.method === "OPTIONS") {
    return response.sendStatus(200);
  }

  if (request.path === "/health") {
    return next();
  }

  if (isDatabaseConnected()) {
    return next();
  }

  response.status(503).json({
    message: "Database is unavailable.",
    detail: getDatabaseStatus().error,
  });
});

setPersistence({
  provider: {
    name: "mongodb",
  },
  async bindState(docId, ydoc) {
    await loadYDocState(docId, ydoc);

    ydoc.on("update", async () => {
      trackDocumentUpdate(docId, ydoc);

      try {
        await persistDocumentState(docId, ydoc);
      } catch (error) {
        console.error(`Failed to persist document ${docId}:`, error);
      }

      try {
        const document = await Document.findOne({ docId }).select("_id");

        if (!document) {
          return;
        }

        await maybeCreateAutoSnapshot(document._id, docId, ydoc);
      } catch (error) {
        console.error(`Failed to auto-snapshot document ${docId}:`, error);
      }
    });
  },
  async writeState(docId, ydoc) {
    await persistDocumentState(docId, ydoc);
  },
});

function getTokenFromRequest(request) {
  return getBearerToken(request.headers.authorization || "");
}

async function authenticateRequest(request, response, next) {
  try {
    const token = getTokenFromRequest(request);
    const payload = verifyToken(token);
    const user = await User.findById(payload.sub);

    if (!user) {
      response.status(401).json({ message: "Authentication required." });
      return;
    }

    request.user = user;
    next();
  } catch {
    response.status(401).json({ message: "Authentication required." });
  }
}

function createAuthResponse(user) {
  const safeUser = {
    id: String(user._id),
    name: user.name,
    email: user.email,
  };

  return {
    token: signToken({
      sub: safeUser.id,
      name: safeUser.name,
      email: safeUser.email,
    }),
    user: safeUser,
  };
}

function createDocumentTitle(docId) {
  if (docId.endsWith("-default-document")) {
    return "Default Document";
  }

  return docId
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

async function getOrCreateDocument(docId, user) {
  let document = await Document.findOne({ docId }).populate("owner", "name email");

  if (!document) {
    document = await Document.create({
      docId,
      title: createDocumentTitle(docId) || "Untitled Document",
      owner: user._id,
      collaborators: [],
    });

    document = await Document.findById(document._id).populate("owner", "name email");
  }

  return document;
}

function serializeDocument(document, role) {
  return {
    id: String(document._id),
    docId: document.docId,
    title: document.title,
    role,
    owner: {
      id: String(document.owner._id),
      name: document.owner.name,
      email: document.owner.email,
    },
  };
}

app.get("/api/health", (_request, response) => {
  response.json({
    ok: true,
    database: {
      connected: isDatabaseConnected(),
      required: !ALLOW_START_WITHOUT_DB,
      error: getDatabaseStatus().error,
    },
  });
});

app.post("/api/auth/signup", async (request, response) => {
  try {
    const { name, email, password } = request.body;

    if (!name?.trim() || !email?.trim() || !password?.trim()) {
      response.status(400).json({ message: "Name, email, and password are required." });
      return;
    }

    const existingUser = await User.findOne({ email: email.trim().toLowerCase() });

    if (existingUser) {
      response.status(409).json({ message: "An account with this email already exists." });
      return;
    }

    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash: await hashPassword(password),
    });

    response.status(201).json(createAuthResponse(user));
  } catch (error) {
    response.status(500).json({ message: "Unable to create account.", detail: error.message });
  }
});

app.post("/api/auth/login", async (request, response) => {
  try {
    const { email, password } = request.body;
    const user = await User.findOne({ email: email?.trim().toLowerCase() });

    if (!user || !(await verifyPassword(password || "", user.passwordHash))) {
      response.status(401).json({ message: "Invalid email or password." });
      return;
    }

    response.json(createAuthResponse(user));
  } catch (error) {
    response.status(500).json({ message: "Unable to login.", detail: error.message });
  }
});

app.get("/api/auth/me", authenticateRequest, async (request, response) => {
  response.json({
    user: {
      id: String(request.user._id),
      name: request.user.name,
      email: request.user.email,
    },
  });
});

app.get("/api/documents", authenticateRequest, async (request, response) => {
  const userId = String(request.user._id);
  const documents = await Document.find({
    $or: [{ owner: userId }, { "collaborators.user": userId }],
  })
    .populate("owner", "name email")
    .sort({ updatedAt: -1 });

  response.json({
    documents: documents.map((document) =>
      serializeDocument(document, getUserRole(document, userId))
    ),
  });
});

app.post("/api/documents", authenticateRequest, async (request, response) => {
  const rawTitle = request.body.title?.trim() || "Untitled Document";
  const slug = rawTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const docId = `${slug || "document"}-${Date.now()}`;

  const document = await Document.create({
    docId,
    title: rawTitle,
    owner: request.user._id,
    collaborators: [],
  });

  const populatedDocument = await Document.findById(document._id).populate(
    "owner",
    "name email"
  );

  response.status(201).json({
    document: serializeDocument(populatedDocument, "owner"),
  });
});

app.delete(
  "/api/documents/:docId",
  authenticateRequest,
  async (request, response) => {
    const document = await Document.findOne({ docId: request.params.docId }).populate(
      "owner",
      "name email"
    );

    if (!document) {
      response.status(404).json({ message: "Document not found." });
      return;
    }

    if (getUserRole(document, request.user._id) !== "owner") {
      response.status(403).json({ message: "Only the owner can delete this document." });
      return;
    }

    await Document.deleteOne({ _id: document._id });
    await DocumentContent.deleteOne({ docId: document.docId });
    await DocumentVersion.deleteMany({ documentId: document._id });

    response.json({ message: "Document deleted." });
  }
);

app.patch(
  "/api/documents/:docId",
  authenticateRequest,
  async (request, response) => {
    const document = await Document.findOne({ docId: request.params.docId }).populate(
      "owner",
      "name email"
    );

    if (!document) {
      response.status(404).json({ message: "Document not found." });
      return;
    }

    if (getUserRole(document, request.user._id) !== "owner") {
      response.status(403).json({ message: "Only the owner can rename this document." });
      return;
    }

    const title = request.body.title?.trim();

    if (!title) {
      response.status(400).json({ message: "A document title is required." });
      return;
    }

    document.title = title;
    await document.save();

    response.json({
      document: serializeDocument(document, "owner"),
    });
  }
);

app.get("/api/documents/:docId", authenticateRequest, async (request, response) => {
  const document = await getOrCreateDocument(request.params.docId, request.user);
  const role = getUserRole(document, request.user._id);

  if (!role) {
    response.status(403).json({ message: "You do not have access to this document." });
    return;
  }

  await document.populate("collaborators.user", "name email");

  response.json({
    document: serializeDocument(document, role),
    permissions: {
      canEdit: canEditDocument(role),
      canManageAccess: role === "owner",
    },
    collaborators: document.collaborators.map(serializeCollaborator),
  });
});

app.patch(
  "/api/documents/:docId/access",
  authenticateRequest,
  async (request, response) => {
    const { email, role } = request.body;
    const document = await Document.findOne({ docId: request.params.docId }).populate(
      "owner",
      "name email"
    );

    if (!document) {
      response.status(404).json({ message: "Document not found." });
      return;
    }

    if (getUserRole(document, request.user._id) !== "owner") {
      response.status(403).json({ message: "Only the owner can manage access." });
      return;
    }

    if (!email?.trim() || !["editor", "viewer"].includes(role)) {
      response.status(400).json({ message: "Valid email and role are required." });
      return;
    }

    const invitedUser = await User.findOne({ email: email.trim().toLowerCase() });

    if (!invitedUser) {
      response.status(404).json({ message: "No user found with that email." });
      return;
    }

    if (String(document.owner._id) === String(invitedUser._id)) {
      response.status(400).json({ message: "The owner already has full access." });
      return;
    }

    const existingCollaborator = document.collaborators.find((collaborator) => {
      return String(collaborator.user) === String(invitedUser._id);
    });

    if (existingCollaborator) {
      existingCollaborator.role = role;
    } else {
      document.collaborators.push({
        user: invitedUser._id,
        role,
      });
    }

    await document.save();
    await document.populate("collaborators.user", "name email");

    response.json({
      collaborators: document.collaborators.map(serializeCollaborator),
    });
  }
);

app.get(
  "/api/documents/:docId/versions",
  authenticateRequest,
  async (request, response) => {
    const document = await Document.findOne({ docId: request.params.docId });

    if (!document) {
      response.status(404).json({ message: "Document not found." });
      return;
    }

    const role = getUserRole(document, request.user._id);

    if (!role) {
      response.status(403).json({ message: "You do not have access to this document." });
      return;
    }

    const versions = await DocumentVersion.find({ documentId: document._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .select("_id authorName snapshotType label createdAt");

    response.json({
      versions: versions.map(serializeVersion),
    });
  }
);

app.post(
  "/api/documents/:docId/versions/save",
  authenticateRequest,
  async (request, response) => {
    const document = await Document.findOne({ docId: request.params.docId });

    if (!document) {
      response.status(404).json({ message: "Document not found." });
      return;
    }

    const role = getUserRole(document, request.user._id);

    if (!canEditDocument(role)) {
      response.status(403).json({ message: "You do not have permission to save versions." });
      return;
    }

    let ydoc = getDocumentYDoc(document.docId, { create: false });

    if (!ydoc) {
      ydoc = new Y.Doc();
      await loadYDocState(document.docId, ydoc);
    }

    const version = await saveDocumentVersion({
      documentId: document._id,
      ydoc,
      snapshotType: "manual",
      label: request.body.label,
      author: {
        authorId: request.user._id,
        authorName: request.user.name,
      },
    });

    document.updatedAt = new Date();
    await document.save();

    response.status(201).json({
      version: serializeVersion(version),
    });
  }
);

app.post(
  "/api/documents/:docId/versions/:versionId/restore",
  authenticateRequest,
  async (request, response) => {
    const document = await Document.findOne({ docId: request.params.docId });

    if (!document) {
      response.status(404).json({ message: "Document not found." });
      return;
    }

    const role = getUserRole(document, request.user._id);

    if (!canEditDocument(role)) {
      response.status(403).json({ message: "You do not have permission to restore versions." });
      return;
    }

    const version = await DocumentVersion.findById(request.params.versionId);

    if (!version || String(version.documentId) !== String(document._id)) {
      response.status(404).json({ message: "Version not found." });
      return;
    }

    await DocumentContent.findOneAndUpdate(
      { docId: document.docId },
      { docId: document.docId, yjsState: version.content },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const ydoc = getDocumentYDoc(document.docId, { create: false });

    if (ydoc) {
      restoreDocumentFromSnapshot(ydoc, version.content);
    }

    const restoredAt = new Date();
    document.updatedAt = restoredAt;
    await document.save();

    response.json({
      success: true,
      restoredAt,
    });
  }
);

wss.on("connection", async (conn, req) => {
  try {
    if (!isDatabaseConnected()) {
      conn.close(1013, "Database unavailable");
      return;
    }

    const requestUrl = new URL(req.url || "/", `http://${req.headers.host}`);
    const docId = requestUrl.pathname.slice(1);
    const token = requestUrl.searchParams.get("token");
    const payload = verifyToken(token);
    const user = await User.findById(payload.sub);

    if (!user) {
      conn.close(1008, "Unauthorized");
      return;
    }

    const document = await Document.findOne({ docId });

    if (!document || !getUserRole(document, user._id)) {
      conn.close(1008, "Forbidden");
      return;
    }

    setupWSConnection(conn, req);
  } catch {
    conn.close(1008, "Unauthorized");
  }
});

async function startServer() {
  try {
    await connectDB();
  } catch (error) {
    if (!ALLOW_START_WITHOUT_DB) {
      throw error;
    }

    console.warn("Starting server without database connectivity.");
  }

  server.listen(PORT, () => {
    console.log(
      `API and Yjs WebSocket server running on port ${PORT}${
        isDatabaseConnected() ? "" : " (database unavailable)"
      }`
    );
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
