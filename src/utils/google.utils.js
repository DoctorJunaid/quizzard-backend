/**
 * utils/google.utils.js
 *
 * Wraps the google-auth-library OAuth2Client to verify
 * the ID token that the frontend receives after a Google Sign-In.
 *
 * Flow:
 *   1. Frontend completes Google OAuth and receives an idToken.
 *   2. Frontend POSTs { idToken } to /api/auth/google.
 *   3. This util verifies the token with Google's servers.
 *   4. Returns the decoded payload { googleId, email, name, picture }.
 */

const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Verify a Google ID token and return the user payload.
 * @param {string} idToken  – token from the frontend
 * @returns {{ googleId, email, name, picture }}
 */
const verifyGoogleToken = async (idToken) => {
    const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    return {
        googleId: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
    };
};

module.exports = { verifyGoogleToken };
