const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Match = require('../models/Match');
const Item = require('../models/Item');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');
const { createNotification } = require('../utils/notifications');

// GET /api/matches — Get matches for current user
router.get('/', verifyToken, async (req, res) => {
  try {
    const matches = await Match.find({
      $or: [{ lostUser: req.user._id }, { foundUser: req.user._id }]
    })
      .populate('lostItem')
      .populate('foundItem')
      .populate('lostUser', 'name profileImage stars')
      .populate('foundUser', 'name profileImage stars')
      .sort({ createdAt: -1 });

    // Mask contact info based on status
    const sanitized = matches.map(m => {
      const match = m.toObject();
      const isApproved = match.status === 'APPROVED' || match.status === 'COMPLETED';
      const isLostUser = match.lostUser._id.toString() === req.user._id.toString();
      const isFoundUser = match.foundUser._id.toString() === req.user._id.toString();

      if (!isApproved) {
        // Hide contact details
        if (match.lostItem) {
          match.lostItem.contactPhone = '***hidden***';
        }
        if (match.foundItem) {
          match.foundItem.contactPhone = '***hidden***';
        }
        if (!isLostUser && match.lostUser) {
          match.lostUser.phone = '***hidden***';
        }
        if (!isFoundUser && match.foundUser) {
          match.foundUser.phone = '***hidden***';
        }
      }

      // Never expose secret codes
      if (match.lostItem) {
        delete match.lostItem.secretCodeHash;
        delete match.lostItem.secretCodePlain;
      }
      if (match.foundItem) {
        delete match.foundItem.secretCodeHash;
        if (!isFoundUser) delete match.foundItem.secretCodePlain;
      }

      return match;
    });

    res.json(sanitized);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/matches/:id — Get single match
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate('lostItem')
      .populate('foundItem')
      .populate('lostUser', 'name profileImage stars phone')
      .populate('foundUser', 'name profileImage stars phone');

    if (!match) return res.status(404).json({ message: 'Match not found' });

    const isParticipant =
      match.lostUser._id.toString() === req.user._id.toString() ||
      match.foundUser._id.toString() === req.user._id.toString();

    if (!isParticipant) return res.status(403).json({ message: 'Not authorized' });

    const matchObj = match.toObject();
    const isApproved = ['APPROVED', 'COMPLETED'].includes(matchObj.status);

    // Mask contacts unless approved
    if (!isApproved) {
      if (matchObj.lostItem) matchObj.lostItem.contactPhone = '***hidden***';
      if (matchObj.foundItem) matchObj.foundItem.contactPhone = '***hidden***';
    }

    if (matchObj.lostItem) {
      delete matchObj.lostItem.secretCodeHash;
      delete matchObj.lostItem.secretCodePlain;
    }
    if (matchObj.foundItem) {
      delete matchObj.foundItem.secretCodeHash;
      if (!isFoundUser) delete matchObj.foundItem.secretCodePlain;
    }

    res.json(matchObj);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/matches/:id/request — Request contact info
router.post('/:id/request', verifyToken, async (req, res) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate('lostUser', 'name')
      .populate('foundUser', 'name')
      .populate('lostItem', 'title')
      .populate('foundItem', 'title');

    if (!match) return res.status(404).json({ message: 'Match not found' });
    if (match.status !== 'MATCHED') {
      return res.status(400).json({ message: `Cannot request contact. Current status: ${match.status}` });
    }

    const isLostUser = match.lostUser._id.toString() === req.user._id.toString();
    const isFoundUser = match.foundUser._id.toString() === req.user._id.toString();
    if (!isLostUser && !isFoundUser) return res.status(403).json({ message: 'Not authorized' });

    match.status = 'REQUESTED';
    match.requestedBy = req.user._id;
    await match.save();

    // Notify the other party
    const receiverId = isLostUser ? match.foundUser._id : match.lostUser._id;
    const senderName = req.user.name;

    await createNotification({
      userId: receiverId,
      title: '📬 Contact Request Received',
      message: `${senderName} wants to share contact info for the match between "${match.lostItem.title}" and "${match.foundItem.title}".`,
      type: 'contact_request',
      link: `/matches`,
      relatedMatch: match._id,
    });

    res.json({ message: 'Contact request sent', match });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/matches/:id/respond — Accept or reject contact request
router.post('/:id/respond', verifyToken, async (req, res) => {
  try {
    const { action } = req.body; // 'accept' | 'reject'
    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ message: "action must be 'accept' or 'reject'" });
    }

    const match = await Match.findById(req.params.id)
      .populate('lostUser', 'name')
      .populate('foundUser', 'name')
      .populate('lostItem', 'title')
      .populate('foundItem', 'title');

    if (!match) return res.status(404).json({ message: 'Match not found' });
    if (match.status !== 'REQUESTED') {
      return res.status(400).json({ message: `Cannot respond. Current status: ${match.status}` });
    }

    // Only the non-requester can respond
    const requesterId = match.requestedBy.toString();
    if (requesterId === req.user._id.toString()) {
      return res.status(403).json({ message: 'You cannot respond to your own request' });
    }

    const isParticipant =
      match.lostUser._id.toString() === req.user._id.toString() ||
      match.foundUser._id.toString() === req.user._id.toString();
    if (!isParticipant) return res.status(403).json({ message: 'Not authorized' });

    match.status = action === 'accept' ? 'APPROVED' : 'REJECTED';
    await match.save();

    const notifTitle = action === 'accept' ? '✅ Contact Request Accepted' : '❌ Contact Request Rejected';
    const notifType = action === 'accept' ? 'request_accepted' : 'request_rejected';
    const notifMsg = action === 'accept'
      ? `Your contact request was accepted! You can now see each other's contact details.`
      : `Your contact request was declined.`;

    await createNotification({
      userId: match.requestedBy,
      title: notifTitle,
      message: notifMsg,
      type: notifType,
      link: `/matches`,
      relatedMatch: match._id,
    });

    res.json({ message: `Request ${action}ed`, match });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/matches/:id/handshake — Verify secret code and complete
router.post('/:id/handshake', verifyToken, async (req, res) => {
  try {
    const { secretCode } = req.body;
    if (!secretCode) return res.status(400).json({ message: 'Secret code is required' });

    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ message: 'Match not found' });
    if (match.status !== 'APPROVED') {
      return res.status(400).json({ message: 'Match must be APPROVED before handshake' });
    }

    // Only the lost item owner can do the handshake
    if (match.lostUser.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the lost item reporter can verify the code' });
    }

    // Get the found item's secret code hash
    const foundItem = await Item.findById(match.foundItem);
    if (!foundItem?.secretCodeHash) {
      return res.status(400).json({ message: 'No secret code found for this item' });
    }

    const isValid = await bcrypt.compare(secretCode, foundItem.secretCodeHash);
    if (!isValid) {
      return res.status(400).json({ message: 'Incorrect secret code. Please try again.' });
    }

    // Complete the match
    match.status = 'COMPLETED';
    await match.save();

    // Mark both items as resolved
    await Item.findByIdAndUpdate(match.lostItem, { status: 'resolved' });
    await Item.findByIdAndUpdate(match.foundItem, { status: 'resolved' });

    await createNotification({
      userId: match.foundUser,
      title: '🎉 Handshake Complete!',
      message: 'The item has been successfully returned! Please wait for the rating.',
      type: 'handshake_complete',
      link: `/matches`,
      relatedMatch: match._id,
    });

    res.json({ message: 'Handshake verified! Match completed successfully.', match });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/matches/:id/rate — Rate the finder (lost user rates)
router.post('/:id/rate', verifyToken, async (req, res) => {
  try {
    const { rating } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ message: 'Match not found' });
    if (match.status !== 'COMPLETED') {
      return res.status(400).json({ message: 'Can only rate after match is completed' });
    }
    if (match.lostUser.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the lost item reporter can give ratings' });
    }
    if (match.ratingGiven) {
      return res.status(400).json({ message: 'Rating already given for this match' });
    }

    match.rating = rating;
    match.ratingGiven = true;
    await match.save();

    // Add stars to finder
    let starsToAdd = 0;
    if (rating === 5) starsToAdd = 2;
    else if (rating >= 3) starsToAdd = 1;

    if (starsToAdd > 0) {
      await User.findByIdAndUpdate(match.foundUser, { $inc: { stars: starsToAdd } });
    }

    res.json({ message: `Rating submitted! ${starsToAdd} star(s) added to finder's profile.` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Helper to generate a short readable secret code
const generateSecretCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// POST /api/matches/:id/generate-code — Generate secret code (finder only, when APPROVED)
router.post('/:id/generate-code', verifyToken, async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ message: 'Match not found' });
    
    if (match.status !== 'APPROVED') {
      return res.status(400).json({ message: 'Match must be APPROVED to generate secret code' });
    }

    // Only the finder can generate the code
    if (match.foundUser.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the finder can generate the secret code' });
    }

    const plainCode = generateSecretCode();
    const salt = await bcrypt.genSalt(12);
    const secretCodeHash = await bcrypt.hash(plainCode, salt);

    // Save to the found item
    const foundItem = await Item.findById(match.foundItem);
    if (!foundItem) return res.status(404).json({ message: 'Associated found item not found' });

    foundItem.secretCodeHash = secretCodeHash;
    foundItem.secretCodePlain = plainCode;
    await foundItem.save();

    res.json({ message: 'Secret code generated successfully', secretCode: plainCode });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
