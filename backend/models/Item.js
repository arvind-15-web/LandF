const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  type: { type: String, enum: ['lost', 'found'], required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: {
    type: String,
    enum: ['wallet', 'phone', 'documents', 'keys', 'bag', 'jewelry', 'electronics', 'clothing', 'pet', 'other'],
    required: true
  },
  location: { type: String, required: true },
  date: { type: Date, required: true },
  images: [{ type: String }], // Cloudinary URLs
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  contactName: { type: String, required: true },
  contactPhone: { type: String, required: true },
  status: { type: String, enum: ['active', 'matched', 'resolved'], default: 'active' },

  // Secret code for found items (bcrypt hashed)
  secretCodeHash: { type: String },
  secretCodePlain: { type: String }, // Only for initial display to finder (NOT stored after first view)
}, { timestamps: true });

// Text index for keyword matching
itemSchema.index({ title: 'text', description: 'text', location: 'text' });

module.exports = mongoose.model('Item', itemSchema);
