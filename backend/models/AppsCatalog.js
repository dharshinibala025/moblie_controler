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
  },
  { timestamps: true }
);

appsCatalogSchema.index({ category: 1 });

module.exports = mongoose.model("AppsCatalog", appsCatalogSchema);
