import express from "express";

import InterviewRoom from "../models/InterviewRoom.js";
import RecordingEvent from "../models/RecordingEvent.js";
import CheatLog from "../models/CheatLog.js";
import {
  formatDuration,
  getRoomRole,
  getYjsRoomName,
  isInterviewer,
  mergeStarterCode,
  sampleRecordingEvents,
  serializeRoom,
} from "../interviewRooms.js";
import { stopInterviewSnapshotTimer } from "../interviewSnapshots.js";
import { executeCode } from "../services/codeExecution.js";

function serializeRecordingEvent(event) {
  return {
    id: String(event._id),
    roomId: String(event.roomId),
    timestamp: event.timestamp,
    type: event.type,
    userId: String(event.userId),
    userRole: event.userRole,
    payload: event.payload,
  };
}

let interviewSocketIO = null;

export function setInterviewSocketIO(io) {
  interviewSocketIO = io;
}

export function createRoomsRouter(authenticateRequest) {
  const router = express.Router();

  router.post("/", authenticateRequest, async (request, response) => {
    try {
      const { title, problem, language, testCases, starterCode } = request.body;

      if (!title?.trim()) {
        response.status(400).json({ message: "A room title is required." });
        return;
      }

      const room = await InterviewRoom.create({
        title: title.trim(),
        problem: problem || {},
        language: language || "javascript",
        testCases: testCases || [],
        starterCode: mergeStarterCode(starterCode),
        interviewerId: request.user._id,
      });

      const populatedRoom = await InterviewRoom.findById(room._id)
        .populate("interviewerId", "name email")
        .populate("candidateId", "name email");

      response.status(201).json({
        room: serializeRoom(populatedRoom, "interviewer"),
      });
    } catch (error) {
      response.status(500).json({
        message: "Unable to create interview room.",
        detail: error.message,
      });
    }
  });

  router.get("/", authenticateRequest, async (request, response) => {
    try {
      const rooms = await InterviewRoom.find({
        $or: [
          { interviewerId: request.user._id },
          { candidateId: request.user._id },
        ],
      })
        .populate("interviewerId", "name email")
        .populate("candidateId", "name email")
        .sort({ createdAt: -1 });

      response.json({
        rooms: rooms.map((room) => {
          const role = getRoomRole(room, request.user._id);
          return serializeRoom(room, role);
        }),
      });
    } catch (error) {
      response.status(500).json({
        message: "Unable to load interview rooms.",
        detail: error.message,
      });
    }
  });

  router.post("/join/:inviteToken", authenticateRequest, async (request, response) => {
    try {
      const room = await InterviewRoom.findOne({
        inviteToken: request.params.inviteToken,
      })
        .populate("interviewerId", "name email")
        .populate("candidateId", "name email");

      if (!room) {
        response.status(404).json({ message: "Interview room not found." });
        return;
      }

      if (room.status === "ended") {
        response.status(400).json({ message: "This interview has already ended." });
        return;
      }

      if (
        room.candidateId &&
        String(room.candidateId._id || room.candidateId) !== String(request.user._id)
      ) {
        response.status(403).json({ message: "This interview room is already assigned." });
        return;
      }

      const isNewCandidate = !room.candidateId;
      const now = new Date();

      if (isNewCandidate) {
        room.candidateId = request.user._id;
        room.status = "active";
        room.startedAt = now;
        await room.save();

        await RecordingEvent.create({
          roomId: room._id,
          timestamp: now,
          type: "room_start",
          userId: request.user._id,
          userRole: "candidate",
          payload: {
            interviewerName: room.interviewerId.name,
            candidateName: request.user.name,
          },
        });
      }

      await room.populate("candidateId", "name email");

      response.json({
        room: serializeRoom(room, "candidate"),
        yjsRoomName: getYjsRoomName(room._id),
      });
    } catch (error) {
      response.status(500).json({
        message: "Unable to join interview room.",
        detail: error.message,
      });
    }
  });

  router.get("/:id/recording", authenticateRequest, async (request, response) => {
    try {
      const room = await InterviewRoom.findById(request.params.id);

      if (!room) {
        response.status(404).json({ message: "Interview room not found." });
        return;
      }

      if (!isInterviewer(room, request.user._id)) {
        response.status(403).json({ message: "Only the interviewer can access recordings." });
        return;
      }

      const events = await RecordingEvent.find({ roomId: room._id }).sort({ timestamp: 1 });
      const sampledEvents = sampleRecordingEvents(events);

      response.json({
        events: sampledEvents.map(serializeRecordingEvent),
        totalEvents: events.length,
        sampled: events.length > sampledEvents.length,
      });
    } catch (error) {
      response.status(500).json({
        message: "Unable to load interview recording.",
        detail: error.message,
      });
    }
  });

  router.post("/:id/run-tests", authenticateRequest, async (request, response) => {
    try {
      const room = await InterviewRoom.findById(request.params.id);

      if (!room) {
        response.status(404).json({ message: "Interview room not found." });
        return;
      }

      const role = getRoomRole(room, request.user._id);

      if (!role) {
        response.status(403).json({ message: "You do not have access to this interview room." });
        return;
      }

      if (room.status === "ended") {
        response.status(400).json({ message: "This interview has already ended." });
        return;
      }

      const { code, language } = request.body;

      if (!code?.trim()) {
        response.status(400).json({ message: "Code is required to run tests." });
        return;
      }

      const resolvedLanguage = language || room.language;
      const testCases = room.testCases || [];

      if (testCases.length === 0) {
        response.json({ results: [] });
        return;
      }

      const results = await Promise.all(
        testCases.map(async (testCase) => {
          const result = await executeCode(resolvedLanguage, code, testCase.input || "");
          const passed = result.stdout.trim() === (testCase.expectedOutput || "").trim();

          const fullResult = {
            input: testCase.input,
            expectedOutput: testCase.expectedOutput,
            actualOutput: result.stdout,
            stderr: result.stderr,
            exitCode: result.exitCode,
            passed,
            isHidden: Boolean(testCase.isHidden),
          };

          if (role === "candidate" && testCase.isHidden) {
            return {
              passed,
              isHidden: true,
            };
          }

          return fullResult;
        })
      );

      response.json({ results });
    } catch (error) {
      response.status(503).json({
        message: "Unable to run test cases.",
        detail: error.message,
      });
    }
  });

  router.get("/:id/analytics", authenticateRequest, async (request, response) => {
    try {
      const room = await InterviewRoom.findById(request.params.id);

      if (!room) {
        response.status(404).json({ message: "Interview room not found." });
        return;
      }

      if (!isInterviewer(room, request.user._id)) {
        response.status(403).json({ message: "Only the interviewer can access analytics." });
        return;
      }

      const [events, cheats] = await Promise.all([
        RecordingEvent.find({ roomId: room._id }).sort({ timestamp: 1 }),
        CheatLog.find({ roomId: room._id }),
      ]);

      const runEvents = events.filter((event) => event.type === "code_run");
      const totalRuns = runEvents.length;
      const errorRuns = runEvents.filter((event) => event.payload?.exitCode !== 0).length;
      const passedRuns = runEvents.filter((event) => event.payload?.exitCode === 0).length;

      const durationMs = room.startedAt
        ? (room.endedAt || new Date()) - room.startedAt
        : 0;

      const lastSnapshot = events.filter((event) => event.type === "code_snapshot").at(-1);
      const finalCode = lastSnapshot?.payload?.code || "";

      response.json({
        duration: {
          ms: durationMs,
          formatted: formatDuration(durationMs),
        },
        codeExecution: {
          total: totalRuns,
          errors: errorRuns,
          passed: passedRuns,
        },
        finalScore: room.finalScore,
        finalCodeLength: finalCode.length,
        languageUsed: room.language,
        antiCheat: {
          tabSwitches: cheats.filter((entry) => entry.type === "tab_switch").length,
          focusLoss: cheats.filter((entry) => entry.type === "focus_loss").length,
          pasteEvents: cheats.filter((entry) => entry.type === "paste").length,
          inactivityFlags: cheats.filter((entry) => entry.type === "inactivity").length,
          totalFlags: cheats.length,
        },
        timeline: runEvents.map((event) => ({
          time: event.timestamp,
          exitCode: event.payload?.exitCode,
          language: event.payload?.language,
        })),
      });
    } catch (error) {
      response.status(500).json({
        message: "Unable to load interview analytics.",
        detail: error.message,
      });
    }
  });

  router.post("/:id/end", authenticateRequest, async (request, response) => {
    try {
      const room = await InterviewRoom.findById(request.params.id)
        .populate("interviewerId", "name email")
        .populate("candidateId", "name email");

      if (!room) {
        response.status(404).json({ message: "Interview room not found." });
        return;
      }

      if (!isInterviewer(room, request.user._id)) {
        response.status(403).json({ message: "Only the interviewer can end this interview." });
        return;
      }

      if (room.status === "ended") {
        response.status(400).json({ message: "This interview has already ended." });
        return;
      }

      const { finalScore, notes } = request.body;
      const endedAt = new Date();

      if (finalScore !== undefined && finalScore !== null) {
        const score = Number(finalScore);

        if (Number.isNaN(score) || score < 0 || score > 100) {
          response.status(400).json({ message: "Final score must be between 0 and 100." });
          return;
        }

        room.finalScore = score;
      }

      if (notes !== undefined) {
        room.notes = String(notes).trim();
      }

      room.status = "ended";
      room.endedAt = endedAt;
      await room.save();
      stopInterviewSnapshotTimer(room._id);

      const durationMs = room.startedAt ? endedAt - room.startedAt : 0;

      await RecordingEvent.create({
        roomId: room._id,
        timestamp: endedAt,
        type: "room_end",
        userId: request.user._id,
        userRole: "interviewer",
        payload: {
          durationMs,
          finalScore: room.finalScore,
        },
      });

      if (interviewSocketIO) {
        interviewSocketIO.to(`room:${room._id}`).emit("room:ended", {
          finalScore: room.finalScore,
        });
      }

      response.json({
        room: serializeRoom(room, "interviewer"),
      });
    } catch (error) {
      response.status(500).json({
        message: "Unable to end interview.",
        detail: error.message,
      });
    }
  });

  router.patch("/:id", authenticateRequest, async (request, response) => {
    try {
      const room = await InterviewRoom.findById(request.params.id)
        .populate("interviewerId", "name email")
        .populate("candidateId", "name email");

      if (!room) {
        response.status(404).json({ message: "Interview room not found." });
        return;
      }

      if (!isInterviewer(room, request.user._id)) {
        response.status(403).json({ message: "Only the interviewer can update this room." });
        return;
      }

      if (request.body.notes !== undefined) {
        room.notes = String(request.body.notes).trim();
        await room.save();
      }

      response.json({
        room: serializeRoom(room, "interviewer"),
      });
    } catch (error) {
      response.status(500).json({
        message: "Unable to update interview room.",
        detail: error.message,
      });
    }
  });

  router.get("/:id", authenticateRequest, async (request, response) => {
    try {
      const room = await InterviewRoom.findById(request.params.id)
        .populate("interviewerId", "name email")
        .populate("candidateId", "name email");

      if (!room) {
        response.status(404).json({ message: "Interview room not found." });
        return;
      }

      const role = getRoomRole(room, request.user._id);

      if (!role) {
        response.status(403).json({ message: "You do not have access to this interview room." });
        return;
      }

      response.json({
        room: serializeRoom(room, role),
      });
    } catch (error) {
      response.status(500).json({
        message: "Unable to load interview room.",
        detail: error.message,
      });
    }
  });

  return router;
}
