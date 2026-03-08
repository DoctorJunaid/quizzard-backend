/**
 * routes/user.routes.js
 *
 * All routes require authentication (protect middleware).
 *
 * GET  /api/users/profile          – view own profile
 * PUT  /api/users/profile          – update name / avatar
 * PUT  /api/users/change-password  – change password
 * GET  /api/users/stats            – personal quiz stats
 * GET  /api/users                  – list all users (admin only)
 */

const express = require('express');
const {
    getProfile,
    updateProfile,
    changePassword,
    getMyStats,
    getAllUsers,
    getCloudinarySignature,
} = require('../controllers/user.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');

const router = express.Router();

// All user routes require a valid JWT
router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);
router.get('/stats', getMyStats);
router.get('/cloudinary-signature', getCloudinarySignature);

// Admin only
router.get('/', adminOnly, getAllUsers);

module.exports = router;
