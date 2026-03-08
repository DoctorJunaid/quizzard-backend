/**
 * models/Category.js
 *
 * Represents a quiz category shown on the Categories page.
 *
 * Fields:
 *   key         – short URL-safe identifier (e.g. 'science')
 *   label       – human-readable name (e.g. 'Science & Nature')
 *   image       – path / URL to the category thumbnail
 *   description – optional short blurb
 *   tags        – free-form string tags for filtering / search
 *   isActive    – soft-disable a category without deleting it
 *   quizCount   – denormalised counter updated on quiz create/delete
 */

const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
    {
        key: {
            type: String,
            required: [true, 'Category key is required.'],
            unique: true,
            trim: true,
            lowercase: true,
        },

        label: {
            type: String,
            required: [true, 'Category label is required.'],
            trim: true,
        },

        image: {
            type: String,
            default: '',
        },

        description: {
            type: String,
            default: '',
        },

        // Tags allow fine-grained filtering (e.g. 'biology', 'physics')
        tags: [
            {
                type: String,
                trim: true,
                lowercase: true,
            },
        ],

        isActive: {
            type: Boolean,
            default: true,
        },

        // Denormalised – incremented/decremented by the quiz service
        quizCount: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Category', categorySchema);
