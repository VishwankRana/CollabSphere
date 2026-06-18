import mongoose from "mongoose";

const documentVersionSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
      index: true,
    },
    content: {
      type: Buffer,
      required: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    authorName: {
      type: String,
      required: true,
      trim: true,
    },
    snapshotType: {
      type: String,
      enum: ["auto", "manual"],
      default: "auto",
    },
    label: {
      type: String,
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

const DocumentVersion =
  mongoose.models.DocumentVersion ||
  mongoose.model("DocumentVersion", documentVersionSchema);

export default DocumentVersion;
