/**
 * controllers/quiz.controller.js
 *
 * CRUD for quizzes.
 * Questions are managed separately via the question controller.
 * Published quizzes are visible to everyone; unpublished are admin-only.
 */

const Quiz = require('../models/Quiz');
const Category = require('../models/Category');
const Attempt = require('../models/Attempt');

// ── GET /api/quizzes ─────────────────────────────────────────────────────────
// Lists published quizzes. Supports ?category=, ?difficulty=, ?search=, ?tags=
const getQuizzes = async (req, res) => {
    try {
        const { category, difficulty, search, tags } = req.query;

        // Regular users see only published quizzes; admins see all
        const filter = req.user?.role === 'admin' ? {} : { isPublished: true };

        if (category) filter.categoryId = category;
        if (difficulty) filter.difficulty = difficulty;

        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];
        }

        if (tags) {
            // ?tags=science,biology → both tags must be present
            const tagArray = tags.split(',').map(t => t.trim().toLowerCase());
            filter.tags = { $all: tagArray };
        }

        const quizzes = await Quiz.find(filter)
            .populate('categoryId', 'key label image')
            .sort({ createdAt: -1 });

        res.json({ quizzes });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch quizzes.', error: err.message });
    }
};

// ── GET /api/quizzes/:id ─────────────────────────────────────────────────────
// Returns quiz metadata (NOT the questions / correct answers yet).
const getQuizById = async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id)
            .populate('categoryId', 'key label image');

        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found.' });
        }

        // Non-admins cannot view unpublished quizzes
        if (!quiz.isPublished && req.user?.role !== 'admin') {
            return res.status(403).json({ message: 'This quiz is not available.' });
        }

        res.json({ quiz });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch quiz.', error: err.message });
    }
};

// ── POST /api/quizzes (admin) ─────────────────────────────────────────────────
const createQuiz = async (req, res) => {
    try {
        const quiz = await Quiz.create({ ...req.body, createdBy: req.user._id });

        // Increment the category's quiz counter
        await Category.findByIdAndUpdate(quiz.categoryId, { $inc: { quizCount: 1 } });

        res.status(201).json({ message: 'Quiz created.', quiz });
    } catch (err) {
        res.status(400).json({ message: 'Failed to create quiz.', error: err.message });
    }
};

// ── PUT /api/quizzes/:id (admin) ──────────────────────────────────────────────
const updateQuiz = async (req, res) => {
    try {
        const quiz = await Quiz.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found.' });
        }
        res.json({ message: 'Quiz updated.', quiz });
    } catch (err) {
        res.status(400).json({ message: 'Failed to update quiz.', error: err.message });
    }
};

// ── DELETE /api/quizzes/:id (admin) ──────────────────────────────────────────
const deleteQuiz = async (req, res) => {
    try {
        const quiz = await Quiz.findByIdAndDelete(req.params.id);
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found.' });
        }

        // Decrement the category counter
        await Category.findByIdAndUpdate(quiz.categoryId, { $inc: { quizCount: -1 } });

        res.json({ message: 'Quiz deleted.' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete quiz.', error: err.message });
    }
};

// ── GET /api/quizzes/:id/check-attempt ───────────────────────────────────────
// Lets the frontend know whether the logged-in user can start this quiz.
// Returns { canAttempt: bool, reason?: string }
const checkAttempt = async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found.' });
        }

        // If the quiz is repeatable there is nothing to check
        if (quiz.isRepeatable) {
            return res.json({ canAttempt: true });
        }

        if (!req.user) {
            return res.json({ canAttempt: true });
        }

        // Check for a completed attempt by this user
        const previous = await Attempt.findOne({
            userId: req.user._id,
            quizId: quiz._id,
            status: 'completed',
        });

        if (previous) {
            return res.json({
                canAttempt: false,
                reason: 'You have already completed this quiz.',
                attempt: previous,
            });
        }

        res.json({ canAttempt: true });
    } catch (err) {
        res.status(500).json({ message: 'Check failed.', error: err.message });
    }
};

module.exports = {
    getQuizzes,
    getQuizById,
    createQuiz,
    updateQuiz,
    deleteQuiz,
    checkAttempt,
};
