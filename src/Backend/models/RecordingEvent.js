import mongoose from "mongoose";

const recordingEventSchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InterviewRoom",
      required: true,
      index: true,
    },
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "room_start",
        "room_end",
        "code_snapshot",
        "code_run",
        "chat_message",
        "language_change",
      ],
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userRole: {
      type: String,
      enum: ["interviewer", "candidate", "system"],
      required: true,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: false,
  }
);

recordingEventSchema.index({ roomId: 1, timestamp: 1 });

const RecordingEvent =
  mongoose.models.RecordingEvent ||
  mongoose.model("RecordingEvent", recordingEventSchema);

export default RecordingEvent;
