const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Simple in-memory store (use Redis/DB in production)
const jobStore = new Map();

const analyzeContent = async (req, res) => {
    try {
        // Validate request body
        if (!req.body || !req.body.text) {
            console.error('Invalid request body: Missing text');
            return res.status(400).json({
                success: false,
                error: 'Text is required'
            });
        }

        const { text } = req.body;

        // Create job ID
        const jobId = uuidv4();

        // Store initial job status
        jobStore.set(jobId, {
            status: 'processing',
            data: null,
            error: null,
            timestamp: Date.now()
        });

        // Start background processing
        startAnalysis(jobId, text);

        // Return immediate response
        return res.status(202).json({
            success: true,
            jobId,
            message: 'Analysis started',
            statusEndpoint: `/api/status/${jobId}`
        });

    } catch (error) {
        console.error('Error in analyzeContent:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
};

const startAnalysis = async (jobId, text) => {
    try {
        if (!process.env.ML_SERVICE_URL) {
            throw new Error('ML_SERVICE_URL environment variable is not set');
        }

        const response = await axios.post(
            `${process.env.ML_SERVICE_URL}/api/analyze`,
            { text },
            {
                timeout: 300000, // 5 minutes
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        jobStore.set(jobId, {
            status: 'completed',
            data: response.data,
            error: null,
            timestamp: Date.now()
        });

    } catch (error) {
        console.error('Error in startAnalysis:', error);
        jobStore.set(jobId, {
            status: 'failed',
            data: null,
            error: error.message || 'Analysis failed',
            timestamp: Date.now()
        });
    }
};

const checkStatus = async (req, res) => {
    try {
        const { jobId } = req.params;

        if (!jobId) {
            return res.status(400).json({
                success: false,
                error: 'Job ID is required'
            });
        }

        const job = jobStore.get(jobId);

        if (!job) {
            return res.status(404).json({
                success: false,
                error: 'Job not found'
            });
        }

        return res.json({
            success: true,
            ...job
        });

    } catch (error) {
        console.error('Error in checkStatus:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
};

const generateContent = async (req, res) => {
    try {
        const { title, keywords, tone } = req.body;

        // Validate request
        if (!title && !keywords) {
            return res.status(400).json({
                success: false,
                error: 'Title or keywords are required'
            });
        }

        const jobId = uuidv4();

        // Store initial job status
        jobStore.set(jobId, {
            status: 'processing',
            data: null,
            error: null,
            timestamp: Date.now()
        });

        // Start background processing
        startGeneration(jobId, { title, keywords, tone });

        return res.status(202).json({
            success: true,
            jobId,
            message: 'Content generation started',
            statusEndpoint: `/api/status/${jobId}`
        });

    } catch (error) {
        console.error('Error in generateContent:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
};

const startGeneration = async (jobId, data) => {
    try {
        if (!process.env.ML_SERVICE_URL) {
            throw new Error('ML_SERVICE_URL environment variable is not set');
        }

        const response = await axios.post(
            `${process.env.ML_SERVICE_URL}/api/generate`,
            data,
            {
                timeout: 300000,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        jobStore.set(jobId, {
            status: 'completed',
            data: response.data,
            error: null,
            timestamp: Date.now()
        });

    } catch (error) {
        console.error('Error in startGeneration:', error);
        jobStore.set(jobId, {
            status: 'failed',
            data: null,
            error: error.message || 'Generation failed',
            timestamp: Date.now()
        });
    }
};

module.exports = {
    analyzeContent,
    generateContent,
    checkStatus
};