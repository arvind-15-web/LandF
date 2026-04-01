const Item = require('../models/Item');
const Match = require('../models/Match');
const { createNotification } = require('./notifications');

/**
 * Calculate match score between a lost and found item
 */
const calculateMatchScore = (lostItem, foundItem) => {
  let score = 0;

  // Category match (40 points)
  if (lostItem.category === foundItem.category) {
    score += 40;
  }

  // Location similarity (30 points) — simple keyword overlap
  const lostWords = lostItem.location.toLowerCase().split(/[\s,]+/);
  const foundWords = foundItem.location.toLowerCase().split(/[\s,]+/);
  const commonLocWords = lostWords.filter(w => w.length > 2 && foundWords.includes(w));
  if (commonLocWords.length > 0) {
    score += Math.min(30, commonLocWords.length * 10);
  }

  // Description keyword overlap (30 points)
  const stopWords = new Set(['the', 'a', 'an', 'is', 'it', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or', 'with']);
  const lostDesc = lostItem.description.toLowerCase().split(/\W+/).filter(w => w.length > 2 && !stopWords.has(w));
  const foundDesc = foundItem.description.toLowerCase().split(/\W+/).filter(w => w.length > 2 && !stopWords.has(w));
  const commonWords = lostDesc.filter(w => foundDesc.includes(w));
  if (commonWords.length > 0) {
    score += Math.min(30, commonWords.length * 10);
  }

  return score;
};

/**
 * Run auto-matching for a newly reported item
 * @param {Object} newItem - The newly reported Item document
 */
const runAutoMatching = async (newItem) => {
  try {
    const oppositeType = newItem.type === 'lost' ? 'found' : 'lost';

    // Find all active items of opposite type
    const candidates = await Item.find({
      type: oppositeType,
      status: 'active',
      category: newItem.category, // Must share category
    }).populate('reportedBy');

    const MATCH_THRESHOLD = 40; // Minimum score to create a match

    for (const candidate of candidates) {
      const lostItem = newItem.type === 'lost' ? newItem : candidate;
      const foundItem = newItem.type === 'found' ? newItem : candidate;

      // Check no existing match
      const existing = await Match.findOne({ lostItem: lostItem._id, foundItem: foundItem._id });
      if (existing) continue;

      const score = calculateMatchScore(lostItem, foundItem);

      if (score >= MATCH_THRESHOLD) {
        const match = await Match.create({
          lostItem: lostItem._id,
          foundItem: foundItem._id,
          lostUser: lostItem.reportedBy._id || lostItem.reportedBy,
          foundUser: foundItem.reportedBy._id || foundItem.reportedBy,
          matchScore: score,
          status: 'MATCHED',
        });

        // Notify both users
        const lostUserId = lostItem.reportedBy._id || lostItem.reportedBy;
        const foundUserId = foundItem.reportedBy._id || foundItem.reportedBy;

        await createNotification({
          userId: lostUserId,
          title: '🎯 Match Found!',
          message: `A found item "${foundItem.title}" may match your lost "${lostItem.title}". Check your matches!`,
          type: 'match_found',
          link: `/matches`,
          relatedMatch: match._id,
        });

        await createNotification({
          userId: foundUserId,
          title: '🎯 Match Found!',
          message: `Your found item "${foundItem.title}" may match someone's lost "${lostItem.title}".`,
          type: 'match_found',
          link: `/matches`,
          relatedMatch: match._id,
        });
      }
    }
  } catch (err) {
    console.error('Auto-matching error:', err.message);
  }
};

module.exports = { runAutoMatching, calculateMatchScore };
