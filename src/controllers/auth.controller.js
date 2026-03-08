const crypto = require('crypto');
const User = require('../models/User');
const { generateToken } = require('../utils/jwt.utils');
const { verifyGoogleToken } = require('../utils/google.utils');
const {
    sendVerificationEmail,
    sendResetEmail
} = require('../utils/email.utils');

// ── Helper: send token in cookie and JSON ────────────────────────────────────
const sendTokenResponse = (user, statusCode, res, message) => {
    const token = generateToken(user._id);

    const cookieOptions = {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
    };

    res.status(statusCode)
        .cookie('token', token, cookieOptions)
        .json({
            message,
            token,
            user: formatUser(user),
        });
};

// ── POST /api/auth/register ──────────────────────────────────────────────────
const register = async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email and password are required.' });
    }

    try {
        const existing = await User.findOne({ email });
        if (existing) {
            if (!existing.isVerified) {
                // If user exists but is not verified, delete old unverified data and let them sign up again
                await User.deleteOne({ _id: existing._id });
            } else {
                return res.status(409).json({ message: 'Email already in use.' });
            }
        }

        const user = new User({ name, email, password });

        // Generate verification token
        const rawToken = user.createVerificationToken();
        await user.save();

        // Send Email asynchronously (don't await) so the UI responds instantly
        sendVerificationEmail(user, rawToken).catch(err => {
            console.error('[Email Error]:', err.message);
        });

        res.status(201).json({
            message: 'Registration successful. Please check your email to verify your account.',
            user: formatUser(user),
        });
    } catch (err) {
        res.status(500).json({ message: 'Registration failed.', error: err.message });
    }
};

// ── GET /api/auth/verify-email?token=... ─────────────────────────────────────
const verifyEmail = async (req, res) => {
    if (!req.query.token) {
        return res.status(400).json({ message: 'Token is required.' });
    }

    const hashedToken = crypto.createHash('sha256').update(req.query.token).digest('hex');

    try {
        const user = await User.findOne({ verificationToken: hashedToken });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired verification token.' });
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save();

        res.status(200).json({ message: 'Email verified successfully! You can now log in.' });
    } catch (err) {
        res.status(500).json({ message: 'Verification failed.', error: err.message });
    }
};

// ── POST /api/auth/login ─────────────────────────────────────────────────────
const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        const user = await User.findOne({ email }).select('+password');
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        if (!user.isVerified) {
            return res.status(401).json({ message: 'Please verify your email to log in.' });
        }

        sendTokenResponse(user, 200, res, 'Login successful.');
    } catch (err) {
        res.status(500).json({ message: 'Login failed.', error: err.message });
    }
};

// ── POST /api/auth/forgot-password ──────────────────────────────────────────
const forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'No account found with that email.' });
        }

        const rawToken = user.createResetPasswordToken();
        await user.save();

        try {
            await sendResetEmail(user, rawToken);
            res.json({ message: 'Password reset link sent to your email.' });
        } catch (err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            await user.save();
            return res.status(500).json({ message: 'Failed to send reset email.' });
        }
    } catch (err) {
        res.status(500).json({ message: 'An error occurred.', error: err.message });
    }
};

// ── POST /api/auth/reset-password?token=... ──────────────────────────────────
const resetPassword = async (req, res) => {
    const { password } = req.body;
    if (!req.query.token) {
        return res.status(400).json({ message: 'Token is required.' });
    }

    const hashedToken = crypto.createHash('sha256').update(req.query.token).digest('hex');

    try {
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset token.' });
        }

        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({ message: 'Password reset successful. You can now log in.' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to reset password.', error: err.message });
    }
};

// ── POST /api/auth/google ────────────────────────────────────────────────────
const googleSignIn = async (req, res) => {
    const { idToken } = req.body;

    try {
        const { googleId, email, name, picture } = await verifyGoogleToken(idToken);
        let user = await User.findOne({ $or: [{ googleId }, { email }] });

        if (user) {
            if (!user.googleId) {
                user.googleId = googleId;
                user.avatar = user.avatar || picture;
            }
            user.isVerified = true;
            await user.save();
        } else {
            user = await User.create({ name, email, googleId, avatar: picture, isVerified: true });
        }

        sendTokenResponse(user, 200, res, 'Google sign-in successful.');
    } catch (err) {
        res.status(401).json({ message: 'Google authentication failed.', error: err.message });
    }
};

// ── POST /api/auth/logout ────────────────────────────────────────────────────
const logout = (_req, res) => {
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000), // expire in 10s
        httpOnly: true,
    });
    res.json({ message: 'Logged out successfully.' });
};

// ── GET /api/auth/me ─────────────────────────────────────────────────────────
const getMe = async (req, res) => {
    res.json({ user: formatUser(req.user) });
};

const formatUser = (user) => ({
    _id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    totalPoints: user.totalPoints,
    level: user.level,
    role: user.role,
    isVerified: user.isVerified,
    createdAt: user.createdAt,
});

module.exports = {
    register,
    login,
    googleSignIn,
    logout,
    getMe,
    verifyEmail,
    forgotPassword,
    resetPassword
};
