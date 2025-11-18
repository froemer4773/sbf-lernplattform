const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Local Authentication
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authenticate, authController.logout);

// Password Management
router.post('/change-password', authenticate, authController.changePassword);

// Profile
router.get('/me', authenticate, authController.getCurrentUser);
router.put('/profile', authenticate, authController.updateProfile);

// OAuth (Platzhalter)
router.get('/google', authController.googleAuth);
router.get('/google/callback', authController.googleCallback);
router.get('/facebook', authController.facebookAuth);
router.get('/facebook/callback', authController.facebookCallback);

module.exports = router;
