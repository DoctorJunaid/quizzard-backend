/**
 * controllers/user.controller.js
 *
 * Profile management for the authenticated user.
 * Admins can also list / view all users.
 */

const User = require('../models/User');
const Attempt = require('../models/Attempt');

// ── GET /api/users/profile ────────────────────────────────────────────────────
// Returns the full profile of the logged-in user.
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found.' });

        res.json({ user });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch profile.', error: err.message });
    }
};

// ── PUT /api/users/profile ────────────────────────────────────────────────────
// Allows a user to update name and avatar only.
// Password changes require the dedicated change-password route.
const updateProfile = async (req, res) => {
    try {
        // Whitelist updatable fields – users cannot update role or totalPoints
        const { name, avatar } = req.body;
        const updates = {};

        if (name) updates.name = name.trim();
        if (avatar) updates.avatar = avatar;

        const user = await User.findByIdAndUpdate(req.user._id, updates, {
            new: true,
            runValidators: true,
        });

        res.json({ message: 'Profile updated.', user });
    } catch (err) {
        res.status(400).json({ message: 'Failed to update profile.', error: err.message });
    }
};

// ── PUT /api/users/change-password ────────────────────────────────────────────
const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Both currentPassword and newPassword are required.' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters.' });
    }

    try {
        const user = await User.findById(req.user._id).select('+password');

        if (!user.password) {
            return res.status(400).json({
                message: 'This account uses Google Sign-In. Password change is not applicable.',
            });
        }

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ message: 'Current password is incorrect.' });
        }

        user.password = newPassword; // pre-save hook re-hashes
        await user.save();

        res.json({ message: 'Password changed successfully.' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to change password.', error: err.message });
    }
};

// ── GET /api/users/stats ──────────────────────────────────────────────────────
// Returns quiz statistics for the logged-in user's profile page.
const getMyStats = async (req, res) => {
    try {
        const [totalAttempts, avgResult] = await Promise.all([
            Attempt.countDocuments({ userId: req.user._id, status: 'completed' }),
            Attempt.aggregate([
                { $match: { userId: req.user._id, status: 'completed' } },
                {
                    $group: {
                        _id: null,
                        avgPercentage: { $avg: '$percentage' },
                        totalScore: { $sum: '$score' },
                    },
                },
            ]),
        ]);

        const avgPercentage = avgResult[0]?.avgPercentage ?? 0;
        const totalScore = avgResult[0]?.totalScore ?? 0;

        res.json({
            totalAttempts,
            averagePercentage: Math.round(avgPercentage),
            totalScore,
            level: req.user.level,
            totalPoints: req.user.totalPoints,
        });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch stats.', error: err.message });
    }
};

// ── GET /api/users (admin) ─────────────────────────────────────────────────────
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });
        res.json({ users });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch users.', error: err.message });
    }
};

const { generateUploadSignature } = require('../utils/cloudinary.utils');

// ── GET /api/users/cloudinary-signature ──────────────────────────────────────
const getCloudinarySignature = (req, res) => {
    try {
        const { folder } = req.query;
        const signatureData = generateUploadSignature(folder);
        res.json(signatureData);
    } catch (err) {
        res.status(500).json({ message: 'Failed to generate signature.', error: err.message });
    }
};

module.exports = {
    getProfile,
    updateProfile,
    changePassword,
    getMyStats,
    getAllUsers,
    getCloudinarySignature,
};
