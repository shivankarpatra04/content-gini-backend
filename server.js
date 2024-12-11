const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const blogRoutes = require('./routes/blogRoutes');

const app = express();

// Connect to database with retry logic
const initializeDB = async () => {
    try {
        await connectDB();
        console.log('Database connected successfully');
    } catch (error) {
        console.error('Database connection failed:', error);
        // Don't exit process on Vercel
        if (process.env.NODE_ENV !== 'production') {
            process.exit(1);
        }
    }
};

initializeDB();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configure CORS
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL
        : ['https://content-gini.vercel.app'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request timeout middleware
app.use((req, res, next) => {
    res.setTimeout(300000, () => {
        res.status(408).json({
            success: false,
            error: 'Request timeout'
        });
    });
    next();
});

// Health check route
app.get('/', async (req, res) => {
    try {
        // Add basic system health checks
        res.json({
            status: 'healthy',
            environment: process.env.NODE_ENV,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/blog', blogRoutes);

// Test route with environment check
app.get('/test', (req, res) => {
    res.json({
        message: 'Backend is working!',
        env: process.env.NODE_ENV,
        mlServiceUrl: process.env.ML_SERVICE_URL ? 'Configured' : 'Not configured'
    });
});

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        path: req.path,
        method: req.method
    });

    // Handle specific error types
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            error: 'Validation Error',
            details: err.message
        });
    }

    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({
            success: false,
            error: 'Unauthorized'
        });
    }

    // Generic error response
    res.status(err.status || 500).json({
        success: false,
        error: process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : err.message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: `Route ${req.originalUrl} not found`
    });
});

// Development server
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 8000;
    app.listen(PORT, () => {
        console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
}

// Export for Vercel
module.exports = app;