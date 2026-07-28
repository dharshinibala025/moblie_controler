const mongoose = require("mongoose");

const syncLogSchema = new mongoose.Schema(
  {
    deviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Device",
      required: true,
    },
    syncType: {
      type: String,
      enum: ["login", "foreground", "periodic", "reconnect"],
      required: true,
    },
    policyVersionBefore: {
      type: Number,
      default: 0,
    },
    policyVersionAfter: {
      type: Number,
      default: 0,
    },
    syncedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

syncLogSchema.index({ deviceId: 1, syncedAt: -1 });

module.exports = mongoose.model("SyncLog", syncLogSchema);
