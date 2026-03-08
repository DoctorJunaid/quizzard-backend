/**
 * routes/quiz.routes.js
 *
 * Public (read):
 *   GET  /api/quizzes                  – list published quizzes
 *   GET  /api/quizzes/:id              – single quiz metadata
 *
 * Protected:
 *   GET  /api/quizzes/:id/check-attempt – can the user retake this quiz?
 *
 * Admin only:
 *   POST   /api/quizzes                – create quiz
 *   PUT    /api/quizzes/:id            – update quiz
 *   DELETE /api/quizzes/:id            – delete quiz
 */

const express = require('express');
const {
    getQuizzes,
    getQuizById,
    createQuiz,
    updateQuiz,
    deleteQuiz,
    checkAttempt,
} = require('../controllers/quiz.controller');
const { protect, adminOnly, optionalAuth } = require('../middleware/auth.middleware');

const router = express.Router();

// Public
router.get('/', getQuizzes);
router.get('/:id', getQuizById);

// Protected
router.get('/:id/check-attempt', optionalAuth, checkAttempt);

// Admin
router.post('/', protect, adminOnly, createQuiz);
router.put('/:id', protect, adminOnly, updateQuiz);
router.delete('/:id', protect, adminOnly, deleteQuiz);

module.exports = router;
