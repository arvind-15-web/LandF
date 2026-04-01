const express = require('express');
const router = express.Router();
const admin = require('../config/firebase');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');

// POST /api/auth/register — Called after Firebase login + OTP verification
router.post('/register', async (req, res) => {
  try {
    const { firebaseToken, name, phone, fcmToken } = req.body;

    if (!firebaseToken || !name || !phone) {
      return res.status(400).json({ message: 'firebaseToken, name, and phone are required' });
    }

    // Verify Firebase token
    const decoded = await admin.auth().verifyIdToken(firebaseToken);

    // Check if user already exists
    let user = await User.findOne({ firebaseUid: decoded.uid });

    if (user) {
      // Update profile if needed
      user.name = name;
      user.phone = phone;
      if (fcmToken) user.fcmToken = fcmToken;
      await user.save();
      return res.json({ message: 'User updated', user });
    }

    // Create new user
    user = await User.create({
      firebaseUid: decoded.uid,
      name,
      email: decoded.email || '',
      phone,
      profileImage: decoded.picture || '',
      fcmToken: fcmToken || '',
    });

    res.status(201).json({ message: 'User registered successfully', user });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/me — Get current user profile
router.get('/me', verifyToken, async (req, res) => {
  res.json({ user: req.user });
});

// PATCH /api/auth/fcm-token — Update FCM token
router.patch('/fcm-token', verifyToken, async (req, res) => {
  try {
    const { fcmToken } = req.body;
    req.user.fcmToken = fcmToken;
    await req.user.save();
    res.json({ message: 'FCM token updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
