const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firebaseUid: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  profileImage: { type: String, default: '' },
  stars: { type: Number, default: 0 },
  fcmToken: { type: String, default: '' }, // Firebase Cloud Messaging token
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
