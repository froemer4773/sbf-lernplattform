const db = require('../config/database');

/**
 * Get unique license types (Scheine)
 */
exports.getLicenses = async (req, res) => {
    try {
        const [licenses] = await db.query(
            `SELECT DISTINCT schein as name
             FROM SBFSee_Ausbildung_Fragen
             ORDER BY schein`
        );
        
        res.json(licenses);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Fehler beim Abrufen der Führerscheine' });
    }
};

/**
 * Get categories for a license
 */
exports.getCategories = async (req, res) => {
    try {
        const { schein } = req.params;
        
        const [categories] = await db.query(
            `SELECT DISTINCT kategorie, unterkategorie,
                    COUNT(*) as fragen_anzahl
             FROM SBFSee_Ausbildung_Fragen
             WHERE schein = ? AND status = 1
             GROUP BY kategorie, unterkategorie
             ORDER BY kategorie, unterkategorie`,
            [schein]
        );
        
        // Group by kategorie
        const grouped = {};
        categories.forEach(cat => {
            if (!grouped[cat.kategorie]) {
                grouped[cat.kategorie] = {
                    kategorie: cat.kategorie,
                    unterkategorien: []
                };
            }
            grouped[cat.kategorie].unterkategorien.push({
                name: cat.unterkategorie,
                fragen_anzahl: cat.fragen_anzahl
            });
        });
        
        res.json(Object.values(grouped));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Fehler beim Abrufen der Kategorien' });
    }
};

/**
 * Get questions by category
 */
exports.getQuestionsByCategory = async (req, res) => {
    try {
        const { schein, kategorie, unterkategorie } = req.query;
        
        let query = `
            SELECT f.frage_id, f.schein, f.kategorie, f.unterkategorie,
                   f.buchseite, f.frage_text, f.korrekte_antwort, f.image,
                   a.antwort_buchstabe, a.antwort_text, a.ist_korrekt
            FROM SBFSee_Ausbildung_Fragen f
            LEFT JOIN SBFSee_Ausbildung_Antworten a ON f.frage_id = a.Frage_id
            WHERE f.status = 1
        `;
        
        const params = [];
        
        if (schein) {
            query += ' AND f.schein = ?';
            params.push(schein);
        }
        
        if (kategorie) {
            query += ' AND f.kategorie = ?';
            params.push(kategorie);
        }
        
        if (unterkategorie) {
            query += ' AND f.unterkategorie = ?';
            params.push(unterkategorie);
        }
        
        query += ' ORDER BY f.frage_id, a.antwort_buchstabe';
        
        const [rows] = await db.query(query, params);
        
        // Group answers by question
        const questionsMap = {};
        rows.forEach(row => {
            if (!questionsMap[row.frage_id]) {
                questionsMap[row.frage_id] = {
                    frage_id: row.frage_id,
                    schein: row.schein,
                    kategorie: row.kategorie,
                    unterkategorie: row.unterkategorie,
                    buchseite: row.buchseite,
                    frage_text: row.frage_text,
                    korrekte_antwort: row.korrekte_antwort,
                    has_image: !!row.image,
                    antworten: []
                };
            }
            if (row.antwort_buchstabe) {
                questionsMap[row.frage_id].antworten.push({
                    buchstabe: row.antwort_buchstabe,
                    text: row.antwort_text,
                    ist_korrekt: row.ist_korrekt
                });
            }
        });
        
        res.json(Object.values(questionsMap));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Fehler beim Abrufen der Fragen' });
    }
};

/**
 * Get single question with image
 */
exports.getQuestion = async (req, res) => {
    try {
        const { frage_id } = req.params;
        
        const [questions] = await db.query(
            `SELECT f.frage_id, f.schein, f.kategorie, f.unterkategorie,
                    f.buchseite, f.frage_text, f.korrekte_antwort, f.image,
                    a.antwort_buchstabe, a.antwort_text, a.ist_korrekt
             FROM SBFSee_Ausbildung_Fragen f
             LEFT JOIN SBFSee_Ausbildung_Antworten a ON f.frage_id = a.Frage_id
             WHERE f.frage_id = ? AND f.status = 1
             ORDER BY a.antwort_buchstabe`,
            [frage_id]
        );
        
        if (questions.length === 0) {
            return res.status(404).json({ error: 'Frage nicht gefunden' });
        }
        
        const question = {
            frage_id: questions[0].frage_id,
            schein: questions[0].schein,
            kategorie: questions[0].kategorie,
            unterkategorie: questions[0].unterkategorie,
            buchseite: questions[0].buchseite,
            frage_text: questions[0].frage_text,
            korrekte_antwort: questions[0].korrekte_antwort,
            has_image: !!questions[0].image,
            antworten: []
        };
        
        questions.forEach(row => {
            if (row.antwort_buchstabe) {
                question.antworten.push({
                    buchstabe: row.antwort_buchstabe,
                    text: row.antwort_text,
                    ist_korrekt: row.ist_korrekt
                });
            }
        });
        
        res.json(question);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Fehler beim Abrufen der Frage' });
    }
};

/**
 * Get question image as PNG
 */
exports.getQuestionImage = async (req, res) => {
    try {
        const { frage_id } = req.params;
        
        const [questions] = await db.query(
            'SELECT image FROM SBFSee_Ausbildung_Fragen WHERE frage_id = ?',
            [frage_id]
        );
        
        if (questions.length === 0 || !questions[0].image) {
            return res.status(404).json({ error: 'Bild nicht gefunden' });
        }
        
        // Send image as PNG
        res.set('Content-Type', 'image/png');
        res.send(questions[0].image);
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Fehler beim Abrufen des Bildes' });
    }
};

/**
 * Get random questions for practice
 */
exports.getRandomQuestions = async (req, res) => {
    try {
        const { schein, limit = 20 } = req.query;
        
        let query = `
            SELECT f.frage_id, f.schein, f.kategorie, f.unterkategorie,
                   f.buchseite, f.frage_text, f.korrekte_antwort, f.image,
                   a.antwort_buchstabe, a.antwort_text, a.ist_korrekt
            FROM SBFSee_Ausbildung_Fragen f
            LEFT JOIN SBFSee_Ausbildung_Antworten a ON f.frage_id = a.Frage_id
            WHERE f.status = 1
        `;
        
        if (schein) {
            query += ' AND f.schein = ?';
        }
        
        query += ` ORDER BY RAND() LIMIT ${parseInt(limit) * 4}`;
        
        const [rows] = await db.query(query, schein ? [schein] : []);
        
        // Group answers
        const questionsMap = {};
        rows.forEach(row => {
            if (!questionsMap[row.frage_id]) {
                questionsMap[row.frage_id] = {
                    frage_id: row.frage_id,
                    schein: row.schein,
                    kategorie: row.kategorie,
                    unterkategorie: row.unterkategorie,
                    buchseite: row.buchseite,
                    frage_text: row.frage_text,
                    korrekte_antwort: row.korrekte_antwort,
                    has_image: !!row.image,
                    antworten: []
                };
            }
            if (row.antwort_buchstabe) {
                questionsMap[row.frage_id].antworten.push({
                    buchstabe: row.antwort_buchstabe,
                    text: row.antwort_text,
                    ist_korrekt: row.ist_korrekt
                });
            }
        });
        
        // Limit to requested number
        const questions = Object.values(questionsMap).slice(0, parseInt(limit));
        
        res.json(questions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Fehler beim Abrufen der Fragen' });
    }
};

module.exports = exports;
