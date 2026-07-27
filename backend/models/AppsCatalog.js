const mongoose = require("mongoose");

const appsCatalogSchema = new mongoose.Schema(
  {
    packageName: {
      type: String,
      required: true,
      unique: true,
    },
    appName: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: [
        "social",
        "entertainment",
        "games",
        "educational",
        "productivity",
        "utilities",
        "uncategorized",
      ],
      default: "uncategorized",
    },
    isDangerous: {
      type: Boolean,
      default: false,
    },
    isSocialMedia: {
      type: Boolean,
      default: false,
    },
    platform: {
      type: String,
      default: "Android",
    },
    riskLevel: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

appsCatalogSchema.index({ category: 1 });

module.exports = mongoose.model("AppsCatalog", appsCatalogSchema);
