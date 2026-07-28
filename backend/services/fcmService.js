const { getMessaging } = require("../config/firebase");
const logger = require("../utils/logger");

exports.sendToDevice = async (fcmToken, data) => {
  const messaging = getMessaging();
  if (!messaging) {
    logger.warn("Firebase Messaging not available — skipping FCM push");
    return null;
  }

  try {
    const response = await messaging.send({
      token: fcmToken,
      data,
      android: {
        priority: "high",
      },
    });
    logger.debug(`FCM sent to token: ${response}`);
    return response;
  } catch (err) {
    if (
      err.code === "messaging/registration-token-not-registered" ||
      err.code === "messaging/invalid-registration-token"
    ) {
      logger.warn(`Invalid FCM token, should deregister: ${err.message}`);
    } else {
      logger.error(`FCM send error: ${err.message}`);
    }
    return null;
  }
};

exports.sendToMultipleDevices = async (tokens, data) => {
  const messaging = getMessaging();
  if (!messaging) {
    logger.warn("Firebase Messaging not available — skipping FCM pushes");
    return null;
  }

  const validTokens = tokens.filter(Boolean);
  if (validTokens.length === 0) return null;

  try {
    const response = await messaging.sendEachForMulticast({
      tokens: validTokens,
      data,
      android: {
        priority: "high",
      },
    });
    logger.debug(`FCM multicast: ${response.successCount} success, ${response.failureCount} failed`);
    return response;
  } catch (err) {
    logger.error(`FCM multicast error: ${err.message}`);
    return null;
  }
};
