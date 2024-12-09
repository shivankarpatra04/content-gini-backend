const axios = require('axios');

const analyzeContent = async (req, res) => {
    try {
        const { text } = req.body;
        const response = await axios.post(
            `${process.env.ML_SERVICE_URL}/api/analyze`,
            { text }
        );
        return res.json({
            success: true,
            data: response.data
        });
    } catch (error) {
        throw error;
    }
};

const generateContent = async (req, res) => {
    try {
        const { title, keywords, tone } = req.body;

        if (!title && !keywords) {
            throw new Error('Title or keywords are required');
        }

        const response = await axios.post(
            `${process.env.ML_SERVICE_URL}/api/generate`,
            { title, keywords, tone }
        );
        return res.json({
            success: true,
            data: response.data
        });
    } catch (error) {
        throw error;
    }
};

module.exports = {
    analyzeContent,
    generateContent
};