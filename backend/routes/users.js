const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');
const { upload, cloudinary } = require('../config/cloudinary');

// PATCH /api/users/profile — Update profile
router.patch('/profile', verifyToken, upload.single('profileImage'), async (req, res) => {
  try {
    const { name } = req.body;

    if (name) req.user.name = name;

    if (req.file) {
      // Delete old image from Cloudinary if exists
      if (req.user.profileImage) {
        const publicId = req.user.profileImage.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`lost-and-found/${publicId}`).catch(() => {});
      }
      req.user.profileImage = req.file.path;
    }

    await req.user.save();
    res.json({ message: 'Profile updated', user: req.user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/:id — Get public profile
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('name profileImage stars createdAt');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
