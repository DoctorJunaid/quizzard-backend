/**
 * routes/attempt.routes.js
 *
 * All routes require authentication.
 *
 * POST /api/attempts/start        – begin a quiz attempt
 * POST /api/attempts/:id/submit   – submit answers and receive score
 * GET  /api/attempts/my           – list my completed attempts
 * GET  /api/attempts/:id          – get a specific attempt (owner or admin)
 */

const express = require('express');
const {
    startAttempt,
    submitAttempt,
    getMyAttempts,
    getAttemptById,
} = require('../controllers/attempt.controller');
const { protect, optionalAuth } = require('../middleware/auth.middleware');

const router = express.Router();

// protect will be used directly inside specific routes

// IMPORTANT: /my must come before /:id so Express doesn't treat "my" as an id
router.get('/my', protect, getMyAttempts);

router.post('/start', optionalAuth, startAttempt);
router.post('/:id/submit', optionalAuth, submitAttempt);
router.get('/:id', optionalAuth, getAttemptById);

module.exports = router;
