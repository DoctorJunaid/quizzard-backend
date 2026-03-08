/**
 * utils/jwt.utils.js
 *
 * Small helpers so token generation logic lives in one place
 * rather than scattered across auth controllers.
 */

const jwt = require('jsonwebtoken');

/**
 * Generate a signed JWT for a user.
 * @param {string|ObjectId} userId  – MongoDB _id of the user
 * @returns {string} signed JWT
 */
const generateToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

module.exports = { generateToken };
