const axios = require('axios');

exports.analyzeContent = async (req, res) => {
    try {
        const { text } = req.body;
        const response = await axios.post(
            `${process.env.ML_SERVICE_URL}/api/analyze`,
            { text }
        );
        res.json(response.data);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

exports.generateContent = async (req, res) => {
    try {
        const { title, keywords, tone } = req.body;
        const response = await axios.post(
            `${process.env.ML_SERVICE_URL}/api/generate`,
            { title, keywords, tone }
        );
        res.json(response.data);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};