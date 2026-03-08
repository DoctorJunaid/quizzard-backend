/**
 * models/Quiz.js
 *
 * Represents a quiz that belongs to one category and contains
 * multiple questions.
 *
 * Fields:
 *   title           – quiz display name
 *   description     – short blurb shown on cards
 *   categoryId      – ref to Category
 *   tags            – searchable tags (inherited from Questions too)
 *   difficulty      – 'easy' | 'medium' | 'hard'
 *   timeLimit       – default per-question time limit in seconds
 *   totalQuestions  – denormalised count (updated by question controller)
 *   isPublished     – draft vs live
 *   isRepeatable    – if false, a user can only attempt this quiz once
 *   createdBy       – admin/user who created it (ref to User)
 *   playCount       – how many times this quiz has been started
 *   averageScore    – rolling average, updated after each attempt
 */

const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Quiz title is required.'],
            trim: true,
        },

        description: {
            type: String,
            default: '',
        },

        heroImage: {
            type: String,
            default: '',
        },

        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            required: true,
            index: true,
        },

        tags: [
            {
                type: String,
                trim: true,
                lowercase: true,
            },
        ],

        difficulty: {
            type: String,
            enum: ['easy', 'medium', 'hard'],
            default: 'medium',
        },

        // Default time (seconds) a user has to answer each question
        timeLimit: {
            type: Number,
            default: 30,
            min: 5,
        },

        // Denormalised – updated when questions are added / removed
        totalQuestions: {
            type: Number,
            default: 0,
        },

        // Unpublished quizzes are hidden from regular users
        isPublished: {
            type: Boolean,
            default: false,
        },

        // If false ➜ user is blocked from a second attempt (anti-cheat)
        isRepeatable: {
            type: Boolean,
            default: false,
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },

        playCount: {
            type: Number,
            default: 0,
        },

        averageScore: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Quiz', quizSchema);
