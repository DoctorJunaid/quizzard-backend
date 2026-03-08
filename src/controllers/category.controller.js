/**
 * controllers/category.controller.js
 *
 * CRUD operations for quiz categories.
 * Public endpoints: list, get one.
 * Admin-only: create, update, delete, seed.
 */

const Category = require('../models/Category');

// ── GET /api/categories ──────────────────────────────────────────────────────
// Lists all active categories. Supports ?search= for label/tag filtering.
const getCategories = async (req, res) => {
    try {
        const { search } = req.query;

        const filter = { isActive: true };

        if (search) {
            // Case-insensitive search across label and tags
            filter.$or = [
                { label: { $regex: search, $options: 'i' } },
                { tags: { $regex: search, $options: 'i' } },
            ];
        }

        const categories = await Category.find(filter).sort({ label: 1 });
        res.json({ categories });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch categories.', error: err.message });
    }
};

// ── GET /api/categories/:id ──────────────────────────────────────────────────
const getCategoryById = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found.' });
        }
        res.json({ category });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch category.', error: err.message });
    }
};

// ── POST /api/categories (admin) ─────────────────────────────────────────────
const createCategory = async (req, res) => {
    try {
        const category = await Category.create(req.body);
        res.status(201).json({ message: 'Category created.', category });
    } catch (err) {
        res.status(400).json({ message: 'Failed to create category.', error: err.message });
    }
};

// ── PUT /api/categories/:id (admin) ──────────────────────────────────────────
const updateCategory = async (req, res) => {
    try {
        const category = await Category.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!category) {
            return res.status(404).json({ message: 'Category not found.' });
        }
        res.json({ message: 'Category updated.', category });
    } catch (err) {
        res.status(400).json({ message: 'Failed to update category.', error: err.message });
    }
};

// ── DELETE /api/categories/:id (admin) ───────────────────────────────────────
// Soft-delete: sets isActive = false rather than removing the document.
const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        );
        if (!category) {
            return res.status(404).json({ message: 'Category not found.' });
        }
        res.json({ message: 'Category disabled.' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete category.', error: err.message });
    }
};

// ── POST /api/categories/seed (admin) ────────────────────────────────────────
// Inserts the 12 default categories from the frontend if they don't exist yet.
const seedCategories = async (req, res) => {
    const defaults = [
        { key: 'general', label: 'General Knowledge', tags: ['general', 'trivia'], image: '/landing_page-assets/cat_general.png' },
        { key: 'science', label: 'Science & Nature', tags: ['science', 'biology', 'physics', 'chemistry'], image: '/landing_page-assets/cat_science.png' },
        { key: 'history', label: 'History', tags: ['history', 'world', 'events'], image: '/landing_page-assets/cat_history.png' },
        { key: 'entertainment', label: 'Entertainment', tags: ['entertainment', 'pop culture'], image: '/landing_page-assets/cat_entertainment.png' },
        { key: 'geography', label: 'Geography', tags: ['geography', 'countries', 'capitals'], image: '/landing_page-assets/cat_geography_1772800391003.png' },
        { key: 'technology', label: 'Technology', tags: ['tech', 'computers', 'coding'], image: '/landing_page-assets/cat_technology_1772800409924.png' },
        { key: 'literature', label: 'Literature', tags: ['books', 'authors', 'fiction'], image: '/landing_page-assets/cat_general.png' },
        { key: 'movies', label: 'Movies & TV', tags: ['movies', 'films', 'television'], image: '/landing_page-assets/cat_entertainment.png' },
        { key: 'music', label: 'Music', tags: ['music', 'bands', 'songs'], image: '/landing_page-assets/cat_history.png' },
        { key: 'sports', label: 'Sports', tags: ['sports', 'athletes', 'games'], image: '/landing_page-assets/cat_sports_1772800427142.png' },
        { key: 'art', label: 'Art & Culture', tags: ['art', 'culture', 'paintings'], image: '/landing_page-assets/cat_general.png' },
        { key: 'gaming', label: 'Gaming', tags: ['gaming', 'videogames', 'esports'], image: '/landing_page-assets/cat_technology_1772800409924.png' },
    ];

    try {
        let created = 0;
        for (const data of defaults) {
            const exists = await Category.findOne({ key: data.key });
            if (!exists) {
                await Category.create(data);
                created++;
            }
        }
        res.json({ message: `Seeded ${created} new categories.` });
    } catch (err) {
        res.status(500).json({ message: 'Seed failed.', error: err.message });
    }
};

module.exports = {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
    seedCategories,
};
