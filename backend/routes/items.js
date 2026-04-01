const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('crypto').randomUUID ? { v4: () => require('crypto').randomUUID() } : require('crypto');
const Item = require('../models/Item');
const { verifyToken } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');
const { runAutoMatching } = require('../utils/matching');

// Helper to generate a short readable secret code
const generateSecretCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// GET /api/items — Get all items (with optional filters)
router.get('/', async (req, res) => {
  try {
    const { type, category, status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (status) filter.status = status;
    else filter.status = 'active';

    const items = await Item.find(filter)
      .populate('reportedBy', 'name profileImage stars')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Item.countDocuments(filter);

    res.json({ items, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/items/:id — Get single item
router.get('/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).populate('reportedBy', 'name profileImage stars');
    if (!item) return res.status(404).json({ message: 'Item not found' });
    
    // Never expose secretCodeHash or secretCodePlain
    const itemObj = item.toObject();
    delete itemObj.secretCodeHash;
    delete itemObj.secretCodePlain;
    
    res.json(itemObj);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/items — Report new item (lost or found)
router.post('/', verifyToken, upload.array('images', 5), async (req, res) => {
  try {
    const { type, title, description, category, location, date } = req.body;

    if (!type || !title || !description || !category || !location || !date) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const images = req.files ? req.files.map(f => f.path) : [];

    const itemData = {
      type,
      title,
      description,
      category,
      location,
      date: new Date(date),
      images,
      reportedBy: req.user._id,
      contactName: req.user.name,
      contactPhone: req.user.phone,
    };

    // For found items: generate secret code
    let plainCode;
    if (type === 'found') {
      plainCode = generateSecretCode();
      const salt = await bcrypt.genSalt(12);
      itemData.secretCodeHash = await bcrypt.hash(plainCode, salt);
    }

    const item = await Item.create(itemData);

    // Trigger auto-matching in background
    runAutoMatching(item).catch(console.error);

    const response = { message: 'Item reported successfully', item };
    if (type === 'found' && plainCode) {
      response.secretCode = plainCode;
      response.secretCodeNote = 'IMPORTANT: Save this code! Give it to the lost item owner to verify the handshake. It will not be shown again.';
    }

    res.status(201).json(response);
  } catch (err) {
    console.error('Create item error:', err);
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/items/:id — Update item (only owner)
router.patch('/:id', verifyToken, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    if (item.reportedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const allowed = ['title', 'description', 'location', 'date'];
    allowed.forEach(f => { if (req.body[f] !== undefined) item[f] = req.body[f]; });
    await item.save();

    res.json({ message: 'Item updated', item });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/items/:id — Delete item (only owner)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    if (item.reportedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await item.deleteOne();
    res.json({ message: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/items/my/items — Get current user's items
router.get('/my/items', verifyToken, async (req, res) => {
  try {
    const items = await Item.find({ reportedBy: req.user._id }).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
