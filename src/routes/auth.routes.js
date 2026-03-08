/**
 * routes/auth.routes.js
 *
 * POST /api/auth/register  – create account with email & password
 * POST /api/auth/login     – sign in and receive a JWT
 * POST /api/auth/google    – sign in / sign up via Google ID token
 * GET  /api/auth/me        – return current user (requires JWT)
 */

const express = require('express');
const {
    register,
    login,
    googleSignIn,
    logout,
    getMe,
    verifyEmail,
    forgotPassword,
    resetPassword,
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleSignIn);
router.post('/logout', logout);
router.get('/verify-email', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', protect, getMe);

module.exports = router;
