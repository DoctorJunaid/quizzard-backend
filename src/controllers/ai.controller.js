/**
 * controllers/ai.controller.js
 * 
 * Logic to generate a quiz from an AI prompt and save it to the DB.
 */

const { generateAIQuiz } = require('../services/ai.service');
const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const Category = require('../models/Category');

// ── POST /api/ai/generate ──────────────────────────────────────────────────────
const generateQuizFromTopic = async (req, res) => {
    const { topic, categoryId, difficulty } = req.body;

    if (!topic || !categoryId) {
        return res.status(400).json({ message: 'Topic and categoryId are required.' });
    }

    try {
        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ message: 'Category not found.' });
        }

        // 1. Generate quiz content via AI
        const aiData = await generateAIQuiz(topic, difficulty);

        // 2. Save the Quiz structure to DB
        const quiz = await Quiz.create({
            ...aiData.quiz,
            categoryId,
            difficulty: difficulty || 'medium',
            createdBy: req.user._id,
            isPublished: true, // AI generated is live by default
        });

        // 3. Save Questions to DB
        const questionsInput = aiData.questions.map((q, idx) => ({
            ...q,
            quizId: quiz._id,
            order: idx,
        }));

        await Question.insertMany(questionsInput);

        // 4. Update the category count
        await Category.findByIdAndUpdate(categoryId, { $inc: { quizCount: 1 } });

        // Update the Quiz metadata with question count
        quiz.totalQuestions = questionsInput.length;
        await quiz.save();

        res.status(201).json({
            message: 'AI quiz successfully created.',
            quizId: quiz._id,
            quiz: quiz,
        });
    } catch (err) {
        res.status(500).json({
            message: 'AI Generation failed.',
            error: err.message,
        });
    }
};

module.exports = { generateQuizFromTopic };
