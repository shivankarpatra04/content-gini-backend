const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// In-memory storage for job status (use Redis/DB in production)
const jobStore = new Map();

const createJob = (jobId) => {
    jobStore.set(jobId, {
        status: 'processing',
        data: null,
        error: null,
        timestamp: Date.now()
    });
    return jobId;
};

const updateJob = (jobId, status, data = null, error = null) => {
    jobStore.set(jobId, {
        status,
        data,
        error,
        timestamp: Date.now()
    });
};

const getJobStatus = (jobId) => {
    return jobStore.get(jobId);
};

// Clean up old jobs periodically
setInterval(() => {
    const oneHourAgo = Date.now() - 3600000;
    for (const [jobId, job] of jobStore.entries()) {
        if (job.timestamp < oneHourAgo) {
            jobStore.delete(jobId);
        }
    }
}, 3600000);

const analyzeContent = async (req, res) => {
    try {
        const { text } = req.body;
        const jobId = uuidv4();

        // Create job and return ID immediately
        createJob(jobId);

        // Process in background
        processAnalysis(jobId, text);

        return res.status(202).json({
            success: true,
            jobId,
            message: 'Analysis started',
            statusEndpoint: `/api/status/${jobId}`
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

const processAnalysis = async (jobId, text) => {
    try {
        const response = await axios.post(
            `${process.env.ML_SERVICE_URL}/api/analyze`,
            { text },
            { timeout: 300000 } // 5 minute timeout
        );
        updateJob(jobId, 'completed', response.data);
    } catch (error) {
        updateJob(jobId, 'failed', null, error.message);
    }
};

const generateContent = async (req, res) => {
    try {
        const { title, keywords, tone } = req.body;

        if (!title && !keywords) {
            return res.status(400).json({
                success: false,
                error: 'Title or keywords are required'
            });
        }

        const jobId = uuidv4();
        createJob(jobId);

        // Process in background
        processGeneration(jobId, { title, keywords, tone });

        return res.status(202).json({
            success: true,
            jobId,
            message: 'Content generation started',
            statusEndpoint: `/api/status/${jobId}`
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

const processGeneration = async (jobId, data) => {
    try {
        const response = await axios.post(
            `${process.env.ML_SERVICE_URL}/api/generate`,
            data,
            { timeout: 300000 } // 5 minute timeout
        );
        updateJob(jobId, 'completed', response.data);
    } catch (error) {
        updateJob(jobId, 'failed', null, error.message);
    }
};

const checkStatus = async (req, res) => {
    try {
        const { jobId } = req.params;
        const status = getJobStatus(jobId);

        if (!status) {
            return res.status(404).json({
                success: false,
                error: 'Job not found'
            });
        }

        return res.json({
            success: true,
            ...status
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

module.exports = {
    analyzeContent,
    generateContent,
    checkStatus
};