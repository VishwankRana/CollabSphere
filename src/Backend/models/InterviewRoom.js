import crypto from "crypto";
import mongoose from "mongoose";

const problemExampleSchema = new mongoose.Schema(
  {
    input: {
      type: String,
      default: "",
    },
    output: {
      type: String,
      default: "",
    },
    explanation: {
      type: String,
      default: "",
    },
  },
  {
    _id: false,
  }
);

const problemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    examples: {
      type: [problemExampleSchema],
      default: [],
    },
    constraints: {
      type: String,
      default: "",
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard", "Easy", "Medium", "Hard"],
      default: "medium",
    },
  },
  {
    _id: false,
  }
);

const testCaseSchema = new mongoose.Schema(
  {
    input: {
      type: String,
      default: "",
    },
    expectedOutput: {
      type: String,
      default: "",
    },
    isHidden: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: false,
  }
);

const interviewRoomSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    problem: {
      type: problemSchema,
      default: () => ({}),
    },
    starterCode: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
    language: {
      type: String,
      enum: ["javascript", "python", "java", "cpp"],
      default: "javascript",
    },
    interviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: ["waiting", "active", "ended"],
      default: "waiting",
      index: true,
    },
    inviteToken: {
      type: String,
      unique: true,
      index: true,
      default: () => crypto.randomBytes(6).toString("hex"),
    },
    testCases: {
      type: [testCaseSchema],
      default: [],
    },
    startedAt: {
      type: Date,
      default: null,
    },
    endedAt: {
      type: Date,
      default: null,
    },
    finalScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

const InterviewRoom =
  mongoose.models.InterviewRoom ||
  mongoose.model("InterviewRoom", interviewRoomSchema);

export default InterviewRoom;
