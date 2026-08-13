const mongoose = require("mongoose");

const emailQueueSchema = new mongoose.Schema(
  {
    recipientEmail: { type: String, required: true, index: true },
    recipientName: { type: String },
    studentId: { type: String, index: true },
    subject: { type: String, required: true },
    htmlBody: { type: String, required: true },
    tempPassword: { type: String },
    role: { type: String, enum: ["student", "staff", "admin"], default: "student" },
    status: {
      type: String,
      enum: ["pending", "processing", "sent", "failed"],
      default: "pending",
      index: true,
    },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 5 },
    lastError: { type: String },
    nextRetryAt: { type: Date, default: Date.now, index: true },
    sentAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("EmailQueue", emailQueueSchema);
