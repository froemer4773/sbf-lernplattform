const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progress.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Progress tracking
router.post('/submit', authenticate, progressController.submitAnswer);
router.get('/user', authenticate, progressController.getUserProgress);
router.get('/categories', authenticate, progressController.getProgressByCategory);
router.get('/wrong', authenticate, progressController.getWrongAnswers);

// Bookmarks & Notes
router.get('/bookmarks', authenticate, progressController.getBookmarks);
router.post('/bookmarks/:frage_id', authenticate, progressController.toggleBookmark);
router.post('/notes', authenticate, progressController.saveNote);

module.exports = router;
