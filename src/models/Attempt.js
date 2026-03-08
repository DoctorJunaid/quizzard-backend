/**
 * models/Attempt.js
 *
 * Records a single quiz attempt by a user.
 * This is the primary anti-cheat mechanism:
 *   – Before starting a quiz we check if an Attempt already exists for
 *     (userId, quizId) when the quiz is NOT repeatable.
 *   – Answers are stored server-side and scored here, so the client
 *     never receives the correct answers before submitting.
 *
 * Fields:
 *   userId        – who took the quiz
 *   quizId        – which quiz
 *   answers       – array of { questionId, selectedOptionId } submitted
 *   score         – server-calculated after submission
 *   maxScore      – maximum achievable score (sum of all question points)
 *   percentage    – (score / maxScore) * 100
 *   timeTaken     – total seconds the user spent (client-reported)
 *   startedAt     – when the attempt began (set server-side)
 *   completedAt   – when the user submitted
 *   status        – 'in_progress' | 'completed' | 'abandoned'
 */

const mongoose = require('mongoose');

// ── Per-answer sub-document ─────────────────────────────────────────────────
const answerSchema = new mongoose.Schema(
    {
        questionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Question',
            required: true,
        },

        selectedOptionId: {
            type: mongoose.Schema.Types.ObjectId,
            // Can be null if the user skipped / timed out
        },

        // Populated by the server during scoring – never exposed to the client
        // until after scoring is complete
        isCorrect: {
            type: Boolean,
            default: false,
        },

        pointsAwarded: {
            type: Number,
            default: 0,
        },

        // Client-reported time spent on this specific question
        timeSpent: {
            type: Number,
            default: 0,
        },
    },
    { _id: false } // sub-docs don't need their own _id
);

// ── Main attempt schema ─────────────────────────────────────────────────────
const attemptSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            index: true,
        },

        quizId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Quiz',
            required: true,
            index: true,
        },

        answers: [answerSchema],

        score: {
            type: Number,
            default: 0,
        },

        maxScore: {
            type: Number,
            default: 0,
        },

        percentage: {
            type: Number,
            default: 0,
        },

        // Reported by client, used for leaderboard tiebreaking
        timeTaken: {
            type: Number,
            default: 0,
        },

        // Set server-side so clients cannot manipulate start time
        startedAt: {
            type: Date,
            default: Date.now,
        },

        completedAt: {
            type: Date,
        },

        status: {
            type: String,
            enum: ['in_progress', 'completed', 'abandoned'],
            default: 'in_progress',
        },
    },
    { timestamps: true }
);

// ── Compound index: quickly check if a user already attempted a quiz ─────────
attemptSchema.index({ userId: 1, quizId: 1 });

module.exports = mongoose.model('Attempt', attemptSchema);
