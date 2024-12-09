// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const {
    register,
    login,
    forgotPassword,
    resetPassword
} = require('../controllers/authController');

// Auth routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:resetToken', resetPassword);

module.exports = router;