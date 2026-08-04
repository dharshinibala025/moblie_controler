const mongoose = require("mongoose");

const academicYearSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    institutionId: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

academicYearSchema.index({ name: 1, institutionId: 1 }, { unique: true });

module.exports = mongoose.model("AcademicYear", academicYearSchema);
