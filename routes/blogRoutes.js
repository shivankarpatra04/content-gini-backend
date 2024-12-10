const express = require('express');
const router = express.Router();
const { analyzeContent, generateContent, checkStatus } = require('../controllers/blogController');

router.post('/analyze', analyzeContent);
router.post('/generate', generateContent);
router.get('/status/:jobId', checkStatus);

module.exports = router;