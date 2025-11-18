const db = require('../config/database');

/**
 * Submit answer and track progress
 */
exports.submitAnswer = async (req, res) => {
    try {
        const { frage_id, selected_answer, time_taken_seconds } = req.body;
        const user_id = req.user.userId;
        
        // Get correct answer
        const [questions] = await db.query(
            'SELECT korrekte_antwort FROM SBFSee_Ausbildung_Fragen WHERE frage_id = ?',
            [frage_id]
        );
        
        if (questions.length === 0) {
            return res.status(404).json({ error: 'Frage nicht gefunden' });
        }
        
        const is_correct = questions[0].korrekte_antwort === selected_answer;
        
        // Get attempt number
        const [attempts] = await db.query(
            'SELECT MAX(attempt_number) as max_attempt FROM lernplattform_progress WHERE user_id = ? AND frage_id = ?',
            [user_id, frage_id]
        );
        
        const attempt_number = (attempts[0].max_attempt || 0) + 1;
        
        // Save progress
        await db.query(
            `INSERT INTO lernplattform_progress 
             (user_id, frage_id, selected_answer, is_correct, time_taken_seconds, attempt_number)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [user_id, frage_id, selected_answer, is_correct, time_taken_seconds, attempt_number]
        );
        
        res.json({
            success: true,
            is_correct,
            korrekte_antwort: questions[0].korrekte_antwort,
            message: is_correct ? 'Richtig! 🎉' : 'Leider falsch'
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Fehler beim Speichern des Fortschritts' });
    }
};

/**
 * Get user progress statistics
 */
exports.getUserProgress = async (req, res) => {
    try {
        const user_id = req.user.userId;
        const { schein } = req.query;
        
        let query = `
            SELECT 
                COUNT(DISTINCT p.frage_id) as beantwortete_fragen,
                SUM(CASE WHEN p.is_correct = 1 THEN 1 ELSE 0 END) as richtige_antworten,
                COUNT(DISTINCT f.frage_id) as gesamt_fragen,
                ROUND(SUM(CASE WHEN p.is_correct = 1 THEN 1 ELSE 0 END) * 100.0 / 
                      COUNT(DISTINCT p.frage_id), 2) as erfolgsquote
            FROM SBFSee_Ausbildung_Fragen f
            LEFT JOIN lernplattform_progress p ON f.frage_id = p.frage_id AND p.user_id = ?
            WHERE f.status = 1
        `;
        
        const params = [user_id];
        
        if (schein) {
            query += ' AND f.schein = ?';
            params.push(schein);
        }
        
        const [stats] = await db.query(query, params);
        
        res.json(stats[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Fehler beim Abrufen des Fortschritts' });
    }
};

/**
 * Get progress by category
 */
exports.getProgressByCategory = async (req, res) => {
    try {
        const user_id = req.user.userId;
        const { schein } = req.query;
        
        let query = `
            SELECT 
                f.kategorie,
                f.unterkategorie,
                COUNT(DISTINCT f.frage_id) as gesamt_fragen,
                COUNT(DISTINCT p.frage_id) as beantwortete_fragen,
                SUM(CASE WHEN p.is_correct = 1 THEN 1 ELSE 0 END) as richtige_antworten,
                ROUND(COUNT(DISTINCT p.frage_id) * 100.0 / COUNT(DISTINCT f.frage_id), 2) as fortschritt,
                ROUND(SUM(CASE WHEN p.is_correct = 1 THEN 1 ELSE 0 END) * 100.0 / 
                      NULLIF(COUNT(DISTINCT p.frage_id), 0), 2) as erfolgsquote
            FROM SBFSee_Ausbildung_Fragen f
            LEFT JOIN lernplattform_progress p ON f.frage_id = p.frage_id AND p.user_id = ?
            WHERE f.status = 1
        `;
        
        const params = [user_id];
        
        if (schein) {
            query += ' AND f.schein = ?';
            params.push(schein);
        }
        
        query += ' GROUP BY f.kategorie, f.unterkategorie ORDER BY f.kategorie, f.unterkategorie';
        
        const [progress] = await db.query(query, params);
        
        res.json(progress);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Fehler beim Abrufen des Fortschritts' });
    }
};

/**
 * Get wrong answers for review
 */
exports.getWrongAnswers = async (req, res) => {
    try {
        const user_id = req.user.userId;
        const { schein, limit = 50 } = req.query;
        
        let query = `
            SELECT DISTINCT
                f.frage_id,
                f.schein,
                f.kategorie,
                f.unterkategorie,
                f.buchseite,
                f.frage_text,
                f.korrekte_antwort,
                f.image,
                COUNT(p.id) as falsch_count
            FROM SBFSee_Ausbildung_Fragen f
            INNER JOIN lernplattform_progress p ON f.frage_id = p.frage_id
            WHERE p.user_id = ? 
            AND p.is_correct = 0
            AND f.status = 1
        `;
        
        const params = [user_id];
        
        if (schein) {
            query += ' AND f.schein = ?';
            params.push(schein);
        }
        
        query += ` GROUP BY f.frage_id 
                   ORDER BY falsch_count DESC, p.attempted_at DESC 
                   LIMIT ?`;
        params.push(parseInt(limit));
        
        const [wrongQuestions] = await db.query(query, params);
        
        res.json(wrongQuestions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Fehler beim Abrufen der falschen Antworten' });
    }
};

/**
 * Get bookmarked questions
 */
exports.getBookmarks = async (req, res) => {
    try {
        const user_id = req.user.userId;
        
        const [bookmarks] = await db.query(
            `SELECT DISTINCT
                f.frage_id,
                f.schein,
                f.kategorie,
                f.unterkategorie,
                f.buchseite,
                f.frage_text,
                f.korrekte_antwort,
                n.note,
                n.created_at as bookmarked_at
             FROM lernplattform_notes n
             INNER JOIN SBFSee_Ausbildung_Fragen f ON n.frage_id = f.frage_id
             WHERE n.user_id = ? AND n.is_bookmarked = 1
             ORDER BY n.created_at DESC`,
            [user_id]
        );
        
        res.json(bookmarks);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Fehler beim Abrufen der Lesezeichen' });
    }
};

/**
 * Toggle bookmark
 */
exports.toggleBookmark = async (req, res) => {
    try {
        const user_id = req.user.userId;
        const { frage_id } = req.params;
        
        // Check if bookmark exists
        const [existing] = await db.query(
            'SELECT id, is_bookmarked FROM lernplattform_notes WHERE user_id = ? AND frage_id = ?',
            [user_id, frage_id]
        );
        
        if (existing.length > 0) {
            // Toggle bookmark
            const new_state = !existing[0].is_bookmarked;
            await db.query(
                'UPDATE lernplattform_notes SET is_bookmarked = ? WHERE id = ?',
                [new_state, existing[0].id]
            );
            
            res.json({ 
                bookmarked: new_state,
                message: new_state ? 'Lesezeichen gesetzt' : 'Lesezeichen entfernt'
            });
        } else {
            // Create bookmark
            await db.query(
                'INSERT INTO lernplattform_notes (user_id, frage_id, is_bookmarked) VALUES (?, ?, 1)',
                [user_id, frage_id]
            );
            
            res.json({ 
                bookmarked: true,
                message: 'Lesezeichen gesetzt'
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Fehler beim Setzen des Lesezeichens' });
    }
};

/**
 * Add/Update note
 */
exports.saveNote = async (req, res) => {
    try {
        const user_id = req.user.userId;
        const { frage_id, note } = req.body;
        
        // Check if note exists
        const [existing] = await db.query(
            'SELECT id FROM lernplattform_notes WHERE user_id = ? AND frage_id = ?',
            [user_id, frage_id]
        );
        
        if (existing.length > 0) {
            // Update note
            await db.query(
                'UPDATE lernplattform_notes SET note = ? WHERE id = ?',
                [note, existing[0].id]
            );
        } else {
            // Create note
            await db.query(
                'INSERT INTO lernplattform_notes (user_id, frage_id, note) VALUES (?, ?, ?)',
                [user_id, frage_id, note]
            );
        }
        
        res.json({ message: 'Notiz gespeichert' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Fehler beim Speichern der Notiz' });
    }
};

module.exports = exports;
