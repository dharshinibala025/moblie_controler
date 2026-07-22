const mongoose = require("mongoose");

const deviceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fcmToken: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["online", "offline", "blocked"],
      default: "offline",
    },
    lastKnownCommand: {
      ruleId: { type: mongoose.Schema.Types.ObjectId, ref: "Rule", default: null },
      action: { type: String, default: null },
      serverTimestamp: { type: Date, default: null },
    },
    lastSyncAt: {
      type: Date,
      default: null,
    },
    isCompliant: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

deviceSchema.index({ userId: 1 }, { unique: true });
deviceSchema.index({ fcmToken: 1 });
deviceSchema.index({ status: 1 });

module.exports = mongoose.model("Device", deviceSchema);
