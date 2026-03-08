/**
 * models/Question.js
 *
 * Represents a single multiple-choice question inside a quiz.
 *
 * Fields:
 *   quizId          – parent quiz reference
 *   text            – the question text
 *   options         – array of 4 option objects { text, isCorrect }
 *   explanation     – shown after the user answers (helps learning)
 *   timeLimit       – per-question override in seconds (0 = use quiz default)
 *   points          – points awarded for a correct answer
 *   order           – display order within the quiz
 *   tags            – topic tags for analytics / filtering
 */

const mongoose = require('mongoose');

// ── Embedded option sub-document ────────────────────────────────────────────
const optionSchema = new mongoose.Schema(
    {
        text: {
            type: String,
            required: [true, 'Option text is required.'],
            trim: true,
        },

        // Only ONE option per question should have isCorrect = true
        isCorrect: {
            type: Boolean,
            default: false,
        },
    },
    { _id: true } // keep _id so the frontend can reference chosen option by id
);

// ── Main question schema ─────────────────────────────────────────────────────
const questionSchema = new mongoose.Schema(
    {
        quizId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Quiz',
            required: true,
            index: true,
        },

        text: {
            type: String,
            required: [true, 'Question text is required.'],
            trim: true,
        },

        // Exactly 4 options (validated in the controller layer)
        options: {
            type: [optionSchema],
            validate: {
                validator: (arr) => arr.length === 4,
                message: 'A question must have exactly 4 options.',
            },
        },

        explanation: {
            type: String,
            default: '',
        },

        // 0 means "inherit from the quiz's default timeLimit"
        timeLimit: {
            type: Number,
            default: 0,
            min: 0,
        },

        points: {
            type: Number,
            default: 10,
            min: 1,
        },

        // Controls the display order on the quiz page
        order: {
            type: Number,
            default: 0,
        },

        tags: [
            {
                type: String,
                trim: true,
                lowercase: true,
            },
        ],
    },
    { timestamps: true }
);

module.exports = mongoose.model('Question', questionSchema);
