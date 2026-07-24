const User = require("../models/User");
const logger = require("../utils/logger");

class InstitutionService {
  async ensureAdminExists() {
    try {
      const adminExists = await User.findOne({ role: "admin" });
      if (adminExists) {
        logger.info("Admin account already exists, skipping bootstrap");
        return adminExists;
      }

      const adminEmail = process.env.ADMIN_EMAIL;
      const adminPassword = process.env.ADMIN_PASSWORD;
      const adminName = process.env.ADMIN_NAME;
      const adminEmployeeId = process.env.ADMIN_EMPLOYEE_ID;

      if (!adminEmail || !adminPassword) {
        logger.warn("ADMIN_EMAIL or ADMIN_PASSWORD not set in .env — skipping admin bootstrap");
        return null;
      }

      const admin = await User.create({
        name: adminName || "System Administrator",
        email: adminEmail,
        password: adminPassword,
        role: "admin",
        employeeId: adminEmployeeId || "ADM001",
        institutionId: "KSRCE",
        status: "active",
        isActive: true,
        hasSetPassword: true,
        hasAcceptedTerms: true,
        termsAcceptedAt: new Date(),
      });

      logger.info(`First admin auto-created: ${admin.email}`);
      return admin;
    } catch (err) {
      logger.error(`Admin bootstrap failed: ${err.message}`);
      return null;
    }
  }
}

module.exports = new InstitutionService();
