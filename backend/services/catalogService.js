const AppsCatalog = require("../models/AppsCatalog");
const auditService = require("./auditService");

class CatalogService {
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
    await auditService.logAction(
      userId,
      role,
      "catalog.update",
      { type: "catalog", id: catalog.packageName },
      data
    );
    return catalog;
  }
}

module.exports = new CatalogService();