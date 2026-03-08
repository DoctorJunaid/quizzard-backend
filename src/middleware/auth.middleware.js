/**
 * middleware/auth.middleware.js
 *
 * Verifies the JWT sent in the Authorization header.
 * Usage on any protected route:
 *   router.get('/profile', protect, handler)
 *
 * Optionally restrict to admins:
 *   router.post('/quiz', protect, adminOnly, handler)
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    // 1. Check cookies for the token (Primary for browser-based auth)
    if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }
    // 2. Fallback to Authorization header (For mobile/stateless API flexibility)
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ message: 'No token provided. Access denied.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.NODE_ENV === 'production' ? process.env.JWT_SECRET : (process.env.JWT_SECRET || 'secret'));

        // Use secret from env, or a fallback for dev if required
        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
            return res.status(401).json({ message: 'User not found. Token invalid.' });
        }

        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Token expired or invalid.' });
    }
};

const optionalAuth = async (req, res, next) => {
    let token;

    if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.NODE_ENV === 'production' ? process.env.JWT_SECRET : (process.env.JWT_SECRET || 'secret'));
        const user = await User.findById(decoded.id).select('-password');
        if (user) {
            req.user = user;
        }
    } catch (err) {
        // Ignored for optional auth
    }
    next();
};

// ── adminOnly ────────────────────────────────────────────────────────────────
// Must be used AFTER protect so req.user is already populated.
const adminOnly = (req, res, next) => {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: 'Admins only.' });
    }
    next();
};

module.exports = { protect, optionalAuth, adminOnly };
