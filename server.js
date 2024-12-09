const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const blogRoutes = require('./routes/blogRoutes');

const app = express();

// Connect to database
connectDB();

// Middleware
app.use(express.json());
app.use(cors({
    origin: process.env.FRONTEND_URL || '*', // Replace with your frontend URL
    credentials: true
}));

// Set timeout for all routes
app.use((req, res, next) => {
    res.setTimeout(30000, () => {
        res.status(504).send('Request Timeout');
    });
    next();
});

// Health check route
app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/blog', blogRoutes);

// Test route
app.get('/test', (req, res) => {
    res.json({ message: 'Backend is working!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        status: 'error',
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
});

// Handle 404 routes
app.use('*', (req, res) => {
    res.status(404).json({
        status: 'error',
        message: 'Route not found'
    });
});

// For local development
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 8000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

// Export for Vercel
module.exports = app;