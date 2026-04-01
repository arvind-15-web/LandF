const Notification = require('../models/Notification');
const User = require('../models/User');
const admin = require('../config/firebase');

/**
 * Create an in-app notification (stored in DB)
 */
const createNotification = async ({ userId, title, message, type, link = '', relatedMatch }) => {
  try {
    const notif = await Notification.create({ userId, title, message, type, link, relatedMatch });

    // Also send FCM push notification
    const user = await User.findById(userId);
    if (user?.fcmToken) {
      await sendPushNotification(user.fcmToken, title, message, { link });
    }

    return notif;
  } catch (err) {
    console.error('Notification creation error:', err.message);
  }
};

/**
 * Send Firebase Cloud Messaging push notification
 */
const sendPushNotification = async (fcmToken, title, body, data = {}) => {
  try {
    await admin.messaging().send({
      token: fcmToken,
      notification: { title, body },
      data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
    });
  } catch (err) {
    // Token might be invalid/expired — don't throw
    console.warn('FCM push failed:', err.message);
  }
};

module.exports = { createNotification, sendPushNotification };
