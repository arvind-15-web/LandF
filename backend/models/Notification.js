const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  link: { type: String, default: '' }, // e.g., '/matches/123'
  read: { type: Boolean, default: false },
  type: {
    type: String,
    enum: ['match_found', 'contact_request', 'request_accepted', 'request_rejected', 'handshake_complete'],
    required: true
  },
  relatedMatch: { type: mongoose.Schema.Types.ObjectId, ref: 'Match' },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
