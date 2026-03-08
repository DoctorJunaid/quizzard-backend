/**
 * routes/leaderboard.routes.js
 *
 * GET /api/leaderboard      – public leaderboard (?period=all-time|monthly|weekly)
 * GET /api/leaderboard/me   – logged-in user's rank (requires JWT)
 */

const express = require('express');
const {
    getLeaderboard,
    getMyRank,
} = require('../controllers/leaderboard.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// /me must come before / to avoid /:id style ambiguity
router.get('/me', protect, getMyRank);
router.get('/', getLeaderboard);

module.exports = router;
