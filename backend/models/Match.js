const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  lostItem: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  foundItem: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  lostUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  foundUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  matchScore: { type: Number, default: 0 }, // 0-100 confidence score
  status: {
    type: String,
    enum: ['MATCHED', 'REQUESTED', 'APPROVED', 'REJECTED', 'COMPLETED'],
    default: 'MATCHED'
  },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // who sent contact request
  rating: { type: Number, min: 1, max: 5 }, // rating given after completion
  ratingGiven: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Match', matchSchema);
