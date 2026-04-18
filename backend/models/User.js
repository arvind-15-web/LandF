const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firebaseUid: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, default: '' },   // from Google provider
  phone: { type: String, default: '' },   // from Phone provider (linked)
  profileImage: { type: String, default: '' },
  stars: { type: Number, default: 0 },
  fcmToken: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);