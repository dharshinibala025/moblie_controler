const AppsCatalog = require("../models/AppsCatalog");
const auditService = require("./auditService");

const KNOWN_SOCIAL_PACKAGES = new Set([
  "com.whatsapp",
  "com.instagram.android",
  "com.facebook.katana",
  "com.facebook.orca",
  "com.twitter.android",
  "com.snapchat.android",
  "org.telegram.messenger",
  "com.zhiliaoapp.musically",
  "com.instagram.barcelona",
  "com.discord",
  "com.likee",
  "com.pinterest",
  "com.linkedin.android",
  "com.reddit.frontpage",
  "com.tinder",
  "com.badoo.mobile",
  "com.quora.android",
  "com.tumblr",
  "com.google.android.youtube",
]);

class CatalogService {
  isSocialMediaPackage(packageName = "", appName = "") {
    const pkg = packageName.toLowerCase();
    const name = appName.toLowerCase();
    if (KNOWN_SOCIAL_PACKAGES.has(pkg)) return true;
    if (
      pkg.includes("facebook") ||
      pkg.includes("instagram") ||
      pkg.includes("whatsapp") ||
      pkg.includes("twitter") ||
      pkg.includes("snapchat") ||
      pkg.includes("telegram") ||
      pkg.includes("tiktok") ||
      pkg.includes("discord") ||
      pkg.includes("pinterest")
    ) {
      return true;
    }
    if (
      name.includes("instagram") ||
      name.includes("whatsapp") ||
      name.includes("facebook") ||
      name.includes("messenger") ||
      name.includes("telegram") ||
      name.includes("snapchat") ||
      name.includes("tiktok") ||
      name.includes("threads") ||
      name.includes("twitter") ||
      name.includes("discord")
    ) {
      return true;
    }
    return false;
  }

  async getCatalog(category) {
    const query = {};
    if (category) query.category = category;
    return AppsCatalog.find(query).sort({ packageName: 1 });
  }

  async updateCatalog(packageName, data, userId, role) {
    const catalog = await AppsCatalog.findOneAndUpdate(
      { packageName },
      data,
      { new: true, upsert: true }
    );
    if (userId && role) {
      await auditService.logAction(
        userId,
        role,
        "catalog.update",
        { type: "catalog", id: catalog.packageName },
        data
      );
    }
    return catalog;
  }
}

module.exports = new CatalogService();