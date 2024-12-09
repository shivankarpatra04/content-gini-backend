const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const blogRoutes = require('./routes/blogRoutes');

const app = express();

// Enhanced error logging
const logError = (error, req) => {
    console.error('Error details:', {
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
        error: error.message,
        stack: error.stack
    });
};

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Database connection with error handling
app.use(async (req, res, next) => {
    try {
        if (!req.path.startsWith('/health')) { // Skip DB connection for health check
            await connectDB();
        }
        next();
    } catch (error) {
        logError(error, req);
        res.status(500).json({
            status: 'error',
            message: 'Database connection failed'
        });
    }
});

// Timeout middleware
app.use((req, res, next) => {
    res.setTimeout(30000, () => {
        logError(new Error('Request timeout'), req);
        res.status(504).json({
            status: 'error',
            message: 'Request timeout'
        });
    });
    next();
});

// Health check route
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/blog', blogRoutes);

// Test route
app.get('/test', (req, res) => {
    res.json({
        message: 'Backend is working!',
        environment: process.env.NODE_ENV
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    logError(err, req);
    res.status(err.status || 500).json({
        status: 'error',
        message: err.message || 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? {
            stack: err.stack,
            details: err.details
        } : undefined
    });
});

// 404 handler - must be after all valid routes
app.use('*', (req, res) => {
    logError(new Error(`Route not found: ${req.originalUrl}`), req);
    res.status(404).json({
        status: 'error',
        message: `Route ${req.originalUrl} not found`
    });
});

// Server initialization
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 8000;
    app.listen(PORT, () => {
        console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
}

module.exports = app;