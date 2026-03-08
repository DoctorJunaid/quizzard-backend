/**
 * routes/ai.routes.js
 * 
 * Secure AI generation endpoints.
 */

const express = require('express');
const { generateQuizFromTopic } = require('../controllers/ai.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// Only logged-in users can use the AI quiz generation tool.
router.post('/generate', protect, generateQuizFromTopic);

module.exports = router;
