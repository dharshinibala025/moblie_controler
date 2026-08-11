const mongoose = require("mongoose");

const consentRecordSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    institutionId: {
      type: String,
      required: true,
    },
    consentVersion: {
      type: String,
      required: true,
    },
    acceptedAt: {
      type: Date,
      default: Date.now,
    },
    ipAddress: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

consentRecordSchema.index({ userId: 1, institutionId: 1 });
consentRecordSchema.index({ userId: 1, consentVersion: 1 });

module.exports = mongoose.model("ConsentRecord", consentRecordSchema);
