/**
 * controllers/leaderboard.controller.js
 *
 * Aggregates user scores for the leaderboard page.
 * Supports three time windows matching the frontend tabs:
 *   all-time | monthly | weekly
 */

const User = require('../models/User');
const Attempt = require('../models/Attempt');

// ── GET /api/leaderboard ──────────────────────────────────────────────────────
// Query params: ?period=all-time|monthly|weekly&limit=50
const getLeaderboard = async (req, res) => {
    try {
        const { period = 'all-time', limit = 50 } = req.query;

        // Build a date filter for the startedAt / completedAt field
        let dateFilter = {};
        const now = new Date();

        if (period === 'weekly') {
            const weekAgo = new Date(now);
            weekAgo.setDate(weekAgo.getDate() - 7);
            dateFilter = { completedAt: { $gte: weekAgo } };
        } else if (period === 'monthly') {
            const monthAgo = new Date(now);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            dateFilter = { completedAt: { $gte: monthAgo } };
        }

        // For time-windowed periods, aggregate attempt scores
        if (period !== 'all-time') {
            const results = await Attempt.aggregate([
                { $match: { status: 'completed', ...dateFilter } },
                {
                    $group: {
                        _id: '$userId',
                        totalPoints: { $sum: '$score' },
                        attempts: { $sum: 1 },
                    },
                },
                { $sort: { totalPoints: -1 } },
                { $limit: Number(limit) },
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'user',
                    },
                },
                { $unwind: '$user' },
                {
                    $project: {
                        _id: '$user._id',
                        name: '$user.name',
                        avatar: '$user.avatar',
                        level: '$user.level',
                        totalPoints: 1,
                        attempts: 1,
                    },
                },
            ]);

            return res.json({ period, leaderboard: results });
        }

        // All-time: sort by the user's stored totalPoints field (faster)
        const users = await User.find()
            .select('name avatar level totalPoints')
            .sort({ totalPoints: -1 })
            .limit(Number(limit));

        res.json({ period, leaderboard: users });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch leaderboard.', error: err.message });
    }
};

// ── GET /api/leaderboard/me ───────────────────────────────────────────────────
// Returns the logged-in user's rank and stats.
const getMyRank = async (req, res) => {
    try {
        // Count how many users have more points (= rank - 1)
        const rank = await User.countDocuments({
            totalPoints: { $gt: req.user.totalPoints },
        });

        res.json({
            rank: rank + 1,
            totalPoints: req.user.totalPoints,
            level: req.user.level,
            name: req.user.name,
            avatar: req.user.avatar,
        });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch your rank.', error: err.message });
    }
};

module.exports = { getLeaderboard, getMyRank };
