/**
 * models/User.js
 *
 * Represents a registered user (email/password or Google OAuth).
 *
 * Fields:
 *   name        – display name
 *   email       – unique identifier
 *   password    – bcrypt hash (null for Google-only accounts)
 *   googleId    – Google subject ID (null for email/password accounts)
 *   avatar      – URL to profile picture
 *   totalPoints – cumulative score across all quiz attempts
 *   level       – derived from totalPoints (computed on save)
 *   role        – 'user' | 'admin'
 *   createdAt   – Mongoose timestamp
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const POINTS_PER_LEVEL = 500; // every 500 pts = +1 level

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required.'],
            trim: true,
        },

        email: {
            type: String,
            required: [true, 'Email is required.'],
            unique: true,
            lowercase: true,
            trim: true,
        },

        // Null for Google OAuth users
        password: {
            type: String,
            select: false, // never returned in queries by default
        },

        // Null for email/password users
        googleId: {
            type: String,
            unique: true,
            sparse: true, // allows multiple nulls in the index
        },

        avatar: {
            type: String,
            default: '',
        },

        totalPoints: {
            type: Number,
            default: 0,
        },

        // Level is auto-calculated from totalPoints
        level: {
            type: Number,
            default: 1,
        },

        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user',
        },

        // ── Auth Verification & Reset ──────────────────────────────────────────
        isVerified: {
            type: Boolean,
            default: false,
        },
        verificationToken: String,
        resetPasswordToken: String,
        resetPasswordExpires: Date,
    },
    { timestamps: true }
);

const crypto = require('crypto');

// ── Instance method: generate email verification token ───────────────────────
userSchema.methods.createVerificationToken = function () {
    const rawToken = crypto.randomBytes(32).toString('hex');
    this.verificationToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    return rawToken;
};

// ── Instance method: generate password reset token ────────────────────────────
userSchema.methods.createResetPasswordToken = function () {
    const rawToken = crypto.randomBytes(32).toString('hex');
    this.resetPasswordToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    this.resetPasswordExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
    return rawToken;
};

// ── Pre-save hook: hash password if it was modified ─────────────────────────
userSchema.pre('save', async function (next) {
    // Recalculate level whenever totalPoints changes
    if (this.isModified('totalPoints')) {
        this.level = Math.floor(this.totalPoints / POINTS_PER_LEVEL) + 1;
    }

    // Only hash if the password field was set/changed
    if (!this.isModified('password') || !this.password) return next();

    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// ── Instance method: verify a plain-text password ───────────────────────────
userSchema.methods.comparePassword = async function (plainText) {
    return bcrypt.compare(plainText, this.password);
};

module.exports = mongoose.model('User', userSchema);
