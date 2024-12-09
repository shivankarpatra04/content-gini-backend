// routes/blogRoutes.js
const express = require('express');
const router = express.Router();
const {
    analyzeContent,
    generateContent
} = require('../controllers/blogController');
const { protect } = require('../middleware/authMiddleware');

// Blog routes with authentication middleware
router.post('/analyze', protect, analyzeContent);
router.post('/generate', protect, generateContent);

module.exports = router;