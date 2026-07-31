const EmailQueue = require("../models/EmailQueue");
const emailService = require("./emailService");
const logger = require("../utils/logger");

class EmailQueueService {
  /**
   * Enqueue a new email into the background retry queue
   */
  async enqueueEmail({ recipientEmail, recipientName, subject, htmlBody, tempPassword, role }) {
    try {
      const queueItem = await EmailQueue.create({
        recipientEmail: recipientEmail.trim().toLowerCase(),
        recipientName: recipientName || "User",
        subject,
        htmlBody,
        tempPassword,
        role: role || "student",
        status: "pending",
        nextRetryAt: new Date(),
      });

      // Attempt immediate dispatch
      this.dispatchQueueItem(queueItem._id).catch((err) => {
        logger.warn(`Immediate email dispatch warning for ${recipientEmail}: ${err.message}`);
      });

      return queueItem;
    } catch (err) {
      logger.error(`Failed to enqueue email: ${err.message}`);
      throw err;
    }
  }

  /**
   * Dispatch a single queued email item
   */
  async dispatchQueueItem(queueId) {
    const item = await EmailQueue.findById(queueId);
    if (!item || item.status === "sent") return;

    item.attempts += 1;
    try {
      const result = await emailService.sendTemporaryPasswordEmail({
        toEmail: item.recipientEmail,
        name: item.recipientName,
        tempPassword: item.tempPassword,
        role: item.role,
      });

      if (result.success) {
        item.status = "sent";
        item.sentAt = new Date();
        item.lastError = null;
      } else {
        item.lastError = result.error || "SMTP send error";
        if (item.attempts >= item.maxAttempts) {
          item.status = "failed";
        } else {
          // Exponential backoff: 30s, 2m, 10m, 1h
          const delaySeconds = Math.pow(4, item.attempts) * 10;
          item.nextRetryAt = new Date(Date.now() + delaySeconds * 1000);
        }
      }
    } catch (err) {
      item.lastError = err.message;
      if (item.attempts >= item.maxAttempts) {
        item.status = "failed";
      } else {
        const delaySeconds = Math.pow(4, item.attempts) * 10;
        item.nextRetryAt = new Date(Date.now() + delaySeconds * 1000);
      }
    }

    await item.save();
  }

  /**
   * Worker loop: Process all pending emails whose nextRetryAt <= now
   */
  async processPendingQueue() {
    try {
      const pendingItems = await EmailQueue.find({
        status: "pending",
        nextRetryAt: { $lte: new Date() },
        attempts: { $lt: 5 },
      }).limit(20);

      for (const item of pendingItems) {
        await this.dispatchQueueItem(item._id);
      }
    } catch (err) {
      logger.error(`Error processing email queue: ${err.message}`);
    }
  }
}

module.exports = new EmailQueueService();
