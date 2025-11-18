const { verifyToken, extractToken } = require('../utils/jwt');

/**
 * Authenticate middleware
 * Verifies JWT token and attaches user to request
 */
exports.authenticate = (req, res, next) => {
    try {
        const token = extractToken(req);
        
        if (!token) {
            return res.status(401).json({
                error: 'Kein Token gefunden. Bitte anmelden.'
            });
        }
        
        const decoded = verifyToken(token);
        req.user = decoded;
        next();
        
    } catch (error) {
        return res.status(401).json({
            error: 'Ungültiger oder abgelaufener Token'
        });
    }
};

/**
 * Optional authentication
 * Attaches user if token is valid, but doesn't fail if missing
 */
exports.optionalAuth = (req, res, next) => {
    try {
        const token = extractToken(req);
        
        if (token) {
            const decoded = verifyToken(token);
            req.user = decoded;
        }
        
        next();
    } catch (error) {
        // Invalid token, but we don't fail
        next();
    }
};
