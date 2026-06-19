import mongoose from "mongoose";

const cheatLogSchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InterviewRoom",
      required: true,
      index: true,
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    type: {
      type: String,
      enum: ["tab_switch", "focus_loss", "paste", "inactivity"],
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: false,
  }
);

const CheatLog =
  mongoose.models.CheatLog || mongoose.model("CheatLog", cheatLogSchema);

export default CheatLog;
