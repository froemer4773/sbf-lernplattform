const { body, validationResult } = require('express-validator');

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validierungsfehler',
            details: errors.array()
        });
    }
    next();
};

/**
 * Registration validation
 */
exports.validateRegistration = [
    body('email')
        .isEmail()
        .withMessage('Ungültige E-Mail-Adresse')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Passwort muss mindestens 8 Zeichen lang sein')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Passwort muss Groß- und Kleinbuchstaben sowie Zahlen enthalten'),
    body('first_name')
        .trim()
        .notEmpty()
        .withMessage('Vorname ist erforderlich')
        .isLength({ max: 100 })
        .withMessage('Vorname ist zu lang'),
    body('last_name')
        .trim()
        .notEmpty()
        .withMessage('Nachname ist erforderlich')
        .isLength({ max: 100 })
        .withMessage('Nachname ist zu lang'),
    handleValidationErrors
];

/**
 * Login validation
 */
exports.validateLogin = [
    body('email')
        .isEmail()
        .withMessage('Ungültige E-Mail-Adresse')
        .normalizeEmail(),
    body('password')
        .notEmpty()
        .withMessage('Passwort ist erforderlich'),
    handleValidationErrors
];

/**
 * Progress submission validation
 */
exports.validateProgress = [
    body('question_id')
        .isInt({ min: 1 })
        .withMessage('Ungültige Fragen-ID'),
    body('answer_id')
        .isInt({ min: 1 })
        .withMessage('Ungültige Antwort-ID'),
    body('mode')
        .isIn(['chapter', 'exam', 'repeat', 'random'])
        .withMessage('Ungültiger Modus'),
    handleValidationErrors
];
