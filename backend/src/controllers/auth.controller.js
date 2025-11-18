const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { generateToken, generateRefreshToken } = require('../utils/jwt');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/email.service');

/**
 * Register new user - angepasst für lernplattform_users
 */
exports.register = async (req, res) => {
    try {
        const { email, password, vorname, nachname, preferred_schein } = req.body;
        
        // Check if user exists
        const [existingUsers] = await db.query(
            'SELECT id FROM lernplattform_users WHERE email = ?',
            [email]
        );
        
        if (existingUsers.length > 0) {
            return res.status(409).json({
                error: 'Ein Benutzer mit dieser E-Mail existiert bereits'
            });
        }
        
        // Hash password
        const password_hash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 10);
        
        // Create user
        const [result] = await db.query(
            `INSERT INTO lernplattform_users 
            (email, password_hash, vorname, nachname, preferred_schein, role, is_approved) 
            VALUES (?, ?, ?, ?, ?, 'MITGLIED', 1)`,
            [email, password_hash, vorname, nachname, preferred_schein || 'SBF-See']
        );
        
        const userId = result.insertId;
        
        res.status(201).json({
            message: 'Registrierung erfolgreich!',
            userId,
            email
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            error: 'Registrierung fehlgeschlagen'
        });
    }
};

/**
 * Login user - angepasst für lernplattform_users
 */
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user
        const [users] = await db.query(
            `SELECT id, email, password_hash, vorname, nachname, role, 
                    preferred_schein, is_approved 
             FROM lernplattform_users WHERE email = ?`,
            [email]
        );
        
        if (users.length === 0) {
            return res.status(401).json({
                error: 'Ungültige E-Mail oder Passwort'
            });
        }
        
        const user = users[0];
        
        // Check if approved
        if (!user.is_approved) {
            return res.status(403).json({
                error: 'Dein Account wurde noch nicht freigeschaltet'
            });
        }
        
        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({
                error: 'Ungültige E-Mail oder Passwort'
            });
        }
        
        // Update last login
        await db.query(
            'UPDATE lernplattform_users SET last_login = NOW() WHERE id = ?',
            [user.id]
        );
        
        // Generate tokens
        const token = generateToken({
            userId: user.id,
            email: user.email,
            role: user.role
        });
        
        const refreshToken = generateRefreshToken({
            userId: user.id
        });
        
        res.json({
            message: 'Login erfolgreich',
            token,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                vorname: user.vorname,
                nachname: user.nachname,
                role: user.role,
                preferred_schein: user.preferred_schein
            }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            error: 'Login fehlgeschlagen'
        });
    }
};

/**
 * Get current user
 */
exports.getCurrentUser = async (req, res) => {
    try {
        const userId = req.user.userId;
        
        const [users] = await db.query(
            `SELECT id, email, vorname, nachname, role, preferred_schein, 
                    created_at, last_login 
             FROM lernplattform_users WHERE id = ?`,
            [userId]
        );
        
        if (users.length === 0) {
            return res.status(404).json({
                error: 'Benutzer nicht gefunden'
            });
        }
        
        res.json(users[0]);
        
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({
            error: 'Fehler beim Abrufen der Benutzerdaten'
        });
    }
};

/**
 * Change password
 */
exports.changePassword = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { current_password, new_password } = req.body;
        
        // Get user
        const [users] = await db.query(
            'SELECT password_hash FROM lernplattform_users WHERE id = ?',
            [userId]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ error: 'Benutzer nicht gefunden' });
        }
        
        // Verify current password
        const isValid = await bcrypt.compare(current_password, users[0].password_hash);
        if (!isValid) {
            return res.status(401).json({ error: 'Aktuelles Passwort ist falsch' });
        }
        
        // Hash new password
        const new_hash = await bcrypt.hash(new_password, 10);
        
        // Update password
        await db.query(
            'UPDATE lernplattform_users SET password_hash = ? WHERE id = ?',
            [new_hash, userId]
        );
        
        res.json({ message: 'Passwort erfolgreich geändert' });
        
    } catch (error) {
        res.status(500).json({ error: 'Fehler beim Ändern des Passworts' });
    }
};

/**
 * Update profile
 */
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { vorname, nachname, preferred_schein } = req.body;
        
        await db.query(
            'UPDATE lernplattform_users SET vorname = ?, nachname = ?, preferred_schein = ? WHERE id = ?',
            [vorname, nachname, preferred_schein, userId]
        );
        
        res.json({ message: 'Profil aktualisiert' });
        
    } catch (error) {
        res.status(500).json({ error: 'Fehler beim Aktualisieren des Profils' });
    }
};

/**
 * Logout
 */
exports.logout = (req, res) => {
    res.json({
        message: 'Logout erfolgreich'
    });
};

// OAuth Placeholders (werden später implementiert)
exports.googleAuth = (req, res) => {
    res.status(501).json({ message: 'Google OAuth wird bald implementiert' });
};

exports.googleCallback = (req, res) => {
    res.status(501).json({ message: 'Google OAuth Callback' });
};

exports.facebookAuth = (req, res) => {
    res.status(501).json({ message: 'Facebook OAuth wird bald implementiert' });
};

exports.facebookCallback = (req, res) => {
    res.status(501).json({ message: 'Facebook OAuth Callback' });
};
