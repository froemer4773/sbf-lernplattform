const express = require('express');
const router = express.Router();
const questionController = require('../controllers/question.controller');
const { authenticate } = require('../middleware/auth.middleware');

// License & Categories
router.get('/licenses', authenticate, questionController.getLicenses);
router.get('/categories/:schein', authenticate, questionController.getCategories);

// Questions
router.get('/questions', authenticate, questionController.getQuestionsByCategory);
router.get('/questions/:frage_id', authenticate, questionController.getQuestion);
router.get('/questions/:frage_id/image', authenticate, questionController.getQuestionImage);
router.get('/questions/random', authenticate, questionController.getRandomQuestions);

module.exports = router;
