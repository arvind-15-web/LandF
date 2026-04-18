const express = require('express');
const router = express.Router();
const admin = require('../config/firebase');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');

// POST /api/auth/register
// Called after Google login + Phone OTP linking are both complete.
// auth.currentUser at this point has BOTH providers linked, so the
// decoded token contains email (from Google) and phone_number (from Phone).
router.post('/register', async (req, res) => {
  try {
    const { firebaseToken, name, phone, fcmToken } = req.body;

    if (!firebaseToken || !name) {
      return res.status(400).json({ message: 'firebaseToken and name are required' });
    }

    const decoded = await admin.auth().verifyIdToken(firebaseToken);

    // After linkWithPhoneNumber, Firebase populates phone_number in the token
    const resolvedPhone = decoded.phone_number || phone || '';
    const resolvedEmail = decoded.email || '';

    let user = await User.findOne({ firebaseUid: decoded.uid });

    if (user) {
      user.name = name;
      if (resolvedEmail) user.email = resolvedEmail;
      if (resolvedPhone) user.phone = resolvedPhone;
      if (fcmToken) user.fcmToken = fcmToken;
      await user.save();
      return res.json({ message: 'User updated', user });
    }

    user = await User.create({
      firebaseUid: decoded.uid,
      name,
      email: resolvedEmail,
      phone: resolvedPhone,
      profileImage: decoded.picture || '',
      fcmToken: fcmToken || '',
    });

    res.status(201).json({ message: 'User registered successfully', user });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/me
router.get('/me', verifyToken, async (req, res) => {
  res.json({ user: req.user });
});

// PATCH /api/auth/fcm-token
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