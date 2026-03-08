/**
 * routes/index.js
 *
 * Central router indexing all API routes for the QuizApp backend.
 */

const express = require('express');

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const categoryRoutes = require('./category.routes');
const quizRoutes = require('./quiz.routes');
const questionRoutes = require('./question.routes');
const attemptRoutes = require('./attempt.routes');
const leaderboardRoutes = require('./leaderboard.routes');
const aiRoutes = require('./ai.routes');

const router = express.Router();

// ── Mount Sub-Routers ────────────────────────────────────────────────────────

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/categories', categoryRoutes);
router.use('/quizzes', quizRoutes);
router.use('/questions', questionRoutes);
router.use('/attempts', attemptRoutes);
router.use('/leaderboard', leaderboardRoutes);
router.use('/ai', aiRoutes);

module.exports = router;
