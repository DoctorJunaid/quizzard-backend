/**
 * controllers/question.controller.js
 *
 * Manages questions within a quiz.
 *
 * KEY ANTI-CHEAT RULE:
 *   The `isCorrect` field is NEVER included in responses to regular users.
 *   Correct answers are only revealed after the attempt is submitted and
 *   scored by the attempt controller.
 */

const Question = require('../models/Question');
const Quiz = require('../models/Quiz');

// ── GET /api/questions/:quizId ───────────────────────────────────────────────
// Returns all questions for a quiz – WITHOUT isCorrect (for regular users).
const getQuestionsByQuiz = async (req, res) => {
    try {
        const questions = await Question.find({ quizId: req.params.quizId })
            .sort({ order: 1 });

        // Strip isCorrect from all options unless caller is an admin
        const isAdmin = req.user?.role === 'admin';

        const sanitised = questions.map(q => {
            const obj = q.toObject();

            if (!isAdmin) {
                obj.options = obj.options.map(({ _id, text }) => ({ _id, text }));
            }

            return obj;
        });

        res.json({ questions: sanitised });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch questions.', error: err.message });
    }
};

// ── POST /api/questions/:quizId (admin) ──────────────────────────────────────
const createQuestion = async (req, res) => {
    try {
        // Validate exactly ONE correct option
        const correctCount = (req.body.options || []).filter(o => o.isCorrect).length;
        if (correctCount !== 1) {
            return res.status(400).json({ message: 'Exactly one option must be marked correct.' });
        }

        const question = await Question.create({
            ...req.body,
            quizId: req.params.quizId,
        });

        // Increment the quiz's total question counter
        await Quiz.findByIdAndUpdate(req.params.quizId, { $inc: { totalQuestions: 1 } });

        res.status(201).json({ message: 'Question created.', question });
    } catch (err) {
        res.status(400).json({ message: 'Failed to create question.', error: err.message });
    }
};

// ── PUT /api/questions/:id (admin) ────────────────────────────────────────────
const updateQuestion = async (req, res) => {
    try {
        // Re-validate correct option count if options are being updated
        if (req.body.options) {
            const correctCount = req.body.options.filter(o => o.isCorrect).length;
            if (correctCount !== 1) {
                return res.status(400).json({ message: 'Exactly one option must be marked correct.' });
            }
        }

        const question = await Question.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!question) {
            return res.status(404).json({ message: 'Question not found.' });
        }
        res.json({ message: 'Question updated.', question });
    } catch (err) {
        res.status(400).json({ message: 'Failed to update question.', error: err.message });
    }
};

// ── DELETE /api/questions/:id (admin) ─────────────────────────────────────────
const deleteQuestion = async (req, res) => {
    try {
        const question = await Question.findByIdAndDelete(req.params.id);
        if (!question) {
            return res.status(404).json({ message: 'Question not found.' });
        }

        // Decrement quiz counter
        await Quiz.findByIdAndUpdate(question.quizId, { $inc: { totalQuestions: -1 } });

        res.json({ message: 'Question deleted.' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete question.', error: err.message });
    }
};

module.exports = {
    getQuestionsByQuiz,
    createQuestion,
    updateQuestion,
    deleteQuestion,
};
