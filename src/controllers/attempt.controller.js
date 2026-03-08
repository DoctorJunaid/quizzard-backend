/**
 * controllers/attempt.controller.js
 *
 * Manages quiz attempts – the core gameplay loop.
 *
 * Anti-cheat measures implemented here:
 *   1. Duplicate check: if quiz.isRepeatable = false and a completed attempt
 *      already exists for (userId, quizId), the user is blocked from starting.
 *   2. Server-side scoring: correct answers are fetched from the DB on submit;
 *      the client never receives them beforehand.
 *   3. Expiry guard: the server records startedAt; if more time has passed than
 *      (totalQuestions × timeLimit + 30s grace), the attempt is rejected.
 *   4. In-progress guard: starting a second in-progress attempt for the same
 *      quiz is blocked – the existing in-progress attempt is returned instead.
 */

const Attempt = require('../models/Attempt');
const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const User = require('../models/User');

// ── POST /api/attempts/start ──────────────────────────────────────────────────
// Called when the user clicks "Play Now".
// Returns the attempt _id so the frontend can reference it on submit.
const startAttempt = async (req, res) => {
    const { quizId } = req.body;

    if (!quizId) {
        return res.status(400).json({ message: 'quizId is required.' });
    }

    try {
        const quiz = await Quiz.findById(quizId);
        if (!quiz || !quiz.isPublished) {
            return res.status(404).json({ message: 'Quiz not found or not available.' });
        }

        // ── Guard 1: already completed a non-repeatable quiz ────────────────
        if (!quiz.isRepeatable && req.user) {
            const completed = await Attempt.findOne({
                userId: req.user._id,
                quizId,
                status: 'completed',
            });
            if (completed) {
                return res.status(403).json({
                    message: 'You have already completed this quiz and cannot retake it.',
                    attempt: completed,
                });
            }
        }

        // ── Guard 2: already has an in-progress attempt (logged-in users only) ──────────────────────
        if (req.user) {
            const inProgress = await Attempt.findOne({
                userId: req.user._id,
                quizId,
                status: 'in_progress',
            });
            if (inProgress) {
                return res.json({
                    message: 'Resuming existing attempt.',
                    attempt: inProgress,
                });
            }
        }

        // Create a fresh attempt
        const attempt = await Attempt.create({
            userId: req.user ? req.user._id : undefined,
            quizId,
            startedAt: new Date(),
        });

        // Increment quiz play counter
        await Quiz.findByIdAndUpdate(quizId, { $inc: { playCount: 1 } });

        res.status(201).json({ message: 'Attempt started.', attempt });
    } catch (err) {
        res.status(500).json({ message: 'Failed to start attempt.', error: err.message });
    }
};

// ── POST /api/attempts/:id/submit ─────────────────────────────────────────────
// The client sends: { answers: [{ questionId, selectedOptionId }], timeTaken }
// The server scores the attempt and updates the user's totalPoints.
const submitAttempt = async (req, res) => {
    const { answers = [], timeTaken = 0 } = req.body;

    try {
        const attempt = await Attempt.findById(req.params.id);

        if (!attempt) {
            return res.status(404).json({ message: 'Attempt not found.' });
        }

        // Only the owner can submit
        if (attempt.userId && (!req.user || attempt.userId.toString() !== req.user._id.toString())) {
            return res.status(403).json({ message: 'Access denied.' });
        }

        if (attempt.status === 'completed') {
            return res.status(400).json({ message: 'This attempt has already been submitted.' });
        }

        // ── Guard 3: time expiry check ───────────────────────────────────────
        const quiz = await Quiz.findById(attempt.quizId);
        const GRACE_SECONDS = 30;
        const maxAllowed = quiz.totalQuestions * quiz.timeLimit + GRACE_SECONDS;
        const elapsed = (Date.now() - attempt.startedAt.getTime()) / 1000;

        if (elapsed > maxAllowed) {
            attempt.status = 'abandoned';
            await attempt.save();
            return res.status(400).json({
                message: 'Time limit exceeded. Attempt marked as abandoned.',
            });
        }

        // ── Guard 4: Anti-Cheat / Speed Detection ──────────────────────────────
        // Check for unrealistic answering speeds (tackle hacking)
        const MIN_REALISTIC_TIME_PER_QUESTION = 1.5; // seconds
        const totalDurationReported = answers.reduce((sum, a) => sum + (a.timeSpent || 0), 0);

        // If they finished a 10-question quiz in 5 seconds, that's hacking
        const tooFast = (timeTaken < quiz.totalQuestions * MIN_REALISTIC_TIME_PER_QUESTION) ||
            (totalDurationReported < quiz.totalQuestions * MIN_REALISTIC_TIME_PER_QUESTION);

        // Also check server-side elapsed time. It should be at least as much as timeTaken
        const timeSkew = elapsed < timeTaken * 0.5; // Server says 10s passed but client says 30s? Hacked.

        if (tooFast || timeSkew) {
            attempt.status = 'abandoned';
            await attempt.save();
            console.warn(`[anti-cheat] Flagged attempt ${attempt._id} for suspicious speed. Client timeTaken: ${timeTaken}, Elapsed: ${elapsed}`);
            return res.status(403).json({
                message: 'Suspect activity detected. Attempt rejected for unrealistic speed.',
                antiCheat: true
            });
        }

        // ── Server-side scoring ───────────────────────────────────────────────
        // Fetch all questions with correct answers (never sent to the client)
        const questions = await Question.find({ quizId: attempt.quizId });

        let score = 0;
        let maxScore = 0;

        const scoredAnswers = questions.map(question => {
            const correctOption = question.options.find(o => o.isCorrect);
            const userAnswer = answers.find(
                a => a.questionId === question._id.toString()
            );

            const pointsPossible = question.points;
            maxScore += pointsPossible;

            const selectedOptionId = userAnswer?.selectedOptionId;
            const isCorrect = selectedOptionId &&
                correctOption?._id.toString() === selectedOptionId;

            const pointsAwarded = isCorrect ? pointsPossible : 0;
            score += pointsAwarded;

            return {
                questionId: question._id,
                selectedOptionId: selectedOptionId || null,
                isCorrect: !!isCorrect,
                pointsAwarded,
            };
        });

        const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

        // Persist scored attempt
        attempt.answers = scoredAnswers;
        attempt.score = score;
        attempt.maxScore = maxScore;
        attempt.percentage = percentage;
        attempt.timeTaken = timeTaken;
        attempt.completedAt = new Date();
        attempt.status = 'completed';

        await attempt.save();

        // ── Award points to the user ──────────────────────────────────────────
        if (req.user) {
            await User.findByIdAndUpdate(req.user._id, {
                $inc: { totalPoints: score },
            });
        }

        // Recalculate quiz averageScore
        const allCompleted = await Attempt.find({
            quizId: attempt.quizId,
            status: 'completed',
        });
        const avg = allCompleted.reduce((acc, a) => acc + a.percentage, 0) / allCompleted.length;
        await Quiz.findByIdAndUpdate(attempt.quizId, { averageScore: Math.round(avg) });

        // Build a result with correct answers revealed (now safe, quiz is done)
        const resultWithAnswers = questions.map(q => ({
            _id: q._id,
            text: q.text,
            explanation: q.explanation,
            options: q.options,                     // full options including isCorrect
            userAnswer: scoredAnswers.find(
                a => a.questionId.toString() === q._id.toString()
            ),
        }));

        res.json({
            message: 'Attempt submitted successfully.',
            score,
            maxScore,
            percentage,
            timeTaken,
            questions: resultWithAnswers,
        });
    } catch (err) {
        res.status(500).json({ message: 'Failed to submit attempt.', error: err.message });
    }
};

// ── GET /api/attempts/my ─────────────────────────────────────────────────────
// Returns all of the logged-in user's completed attempts.
const getMyAttempts = async (req, res) => {
    try {
        const attempts = await Attempt.find({
            userId: req.user._id,
            status: 'completed',
        })
            .populate('quizId', 'title difficulty categoryId')
            .sort({ completedAt: -1 });

        res.json({ attempts });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch attempts.', error: err.message });
    }
};

// ── GET /api/attempts/:id ─────────────────────────────────────────────────────
// Get a specific attempt (owner or admin only).
const getAttemptById = async (req, res) => {
    try {
        const attempt = await Attempt.findById(req.params.id)
            .populate('quizId', 'title difficulty');

        if (!attempt) {
            return res.status(404).json({ message: 'Attempt not found.' });
        }

        const isOwner = req.user && attempt.userId && attempt.userId.toString() === req.user._id.toString();
        const isAdmin = req.user && req.user.role === 'admin';
        const isGuestAttempt = !attempt.userId;

        if (!isOwner && !isAdmin && !isGuestAttempt) {
            return res.status(403).json({ message: 'Access denied.' });
        }

        res.json({ attempt });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch attempt.', error: err.message });
    }
};

module.exports = { startAttempt, submitAttempt, getMyAttempts, getAttemptById };
