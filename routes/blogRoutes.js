// routes/blogRoutes.js
const express = require('express');
const router = express.Router();
const {
    analyzeContent,
    generateContent
} = require('../controllers/blogController');
const { protect } = require('../middleware/authMiddleware');

// Middleware to handle timeouts
const timeoutMiddleware = (timeoutMs = 8000) => async (req, res, next) => {
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
            reject(new Error('Request timeout'));
        }, timeoutMs);
    });

    req.timeoutPromise = timeoutPromise;
    next();
};

// Blog routes with authentication middleware and timeout handling
router.post('/analyze', protect, timeoutMiddleware(8000), async (req, res) => {
    try {
        const result = await Promise.race([
            analyzeContent(req, res),
            req.timeoutPromise
        ]);
        return result;
    } catch (error) {
        if (error.message === 'Request timeout') {
            return res.status(504).json({
                success: false,
                error: 'Analysis timed out',
                message: 'Please try with shorter content'
            });
        }
        return res.status(500).json({
            success: false,
            error: 'Analysis failed',
            message: error.message
        });
    }
});

router.post('/generate', protect, timeoutMiddleware(8000), async (req, res) => {
    try {
        const result = await Promise.race([
            generateContent(req, res),
            req.timeoutPromise
        ]);
        return result;
    } catch (error) {
        if (error.message === 'Request timeout') {
            return res.status(504).json({
                success: false,
                error: 'Generation timed out',
                message: 'Please try with simpler parameters'
            });
        }
        return res.status(500).json({
            success: false,
            error: 'Generation failed',
            message: error.message
        });
    }
});

module.exports = router;