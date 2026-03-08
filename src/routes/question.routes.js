/**
 * routes/question.routes.js
 *
 * All read routes are protected (user must be logged in to play).
 * Write routes are admin only.
 *
 * GET    /api/questions/:quizId        – list questions for a quiz (no correct answers)
 * POST   /api/questions/:quizId        – create a question (admin)
 * PUT    /api/questions/:id            – update a question (admin)
 * DELETE /api/questions/:id            – delete a question (admin)
 */

const express = require('express');
const {
    getQuestionsByQuiz,
    createQuestion,
    updateQuestion,
    deleteQuestion,
} = require('../controllers/question.controller');
const { protect, adminOnly, optionalAuth } = require('../middleware/auth.middleware');

const router = express.Router();

// Protected: logged-in users can retrieve questions (correct answers stripped)
router.get('/:quizId', optionalAuth, getQuestionsByQuiz);

// Admin only: manage questions
router.post('/:quizId', protect, adminOnly, createQuestion);
router.put('/:id', protect, adminOnly, updateQuestion);
router.delete('/:id', protect, adminOnly, deleteQuestion);

module.exports = router;
