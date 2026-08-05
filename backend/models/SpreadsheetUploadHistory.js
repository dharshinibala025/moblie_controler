const mongoose = require("mongoose");

const spreadsheetUploadHistorySchema = new mongoose.Schema(
  {
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    uploadType: {
      type: String,
      enum: ["student", "staff"],
      required: true,
    },
    totalRows: {
      type: Number,
      default: 0,
    },
    createdCount: {
      type: Number,
      default: 0,
    },
    skippedCount: {
      type: Number,
      default: 0,
    },
    emailSentCount: {
      type: Number,
      default: 0,
    },
    errors: [
      {
        row: Number,
        identifier: String,
        reason: String,
      },
    ],
    institutionId: {
      type: String,
      default: "KSRCE",
    },
  },
  { timestamps: true }
);

spreadsheetUploadHistorySchema.index({ uploadedBy: 1, uploadType: 1 });

module.exports = mongoose.model("SpreadsheetUploadHistory", spreadsheetUploadHistorySchema);
