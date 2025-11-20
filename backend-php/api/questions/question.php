<?php
/**
 * Single Question Endpoint - FINAL
 * GET /api/questions/question.php?id=123
 */

require_once '../../config/config.php';
require_once '../../middleware/jwt.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Method not allowed', 405);
}

$frageId = $_GET['id'] ?? null;

if (!$frageId || !is_numeric($frageId)) {
    sendError('Ungültige Frage-ID', 400);
}

try {
    $pdo = getDBConnection();
    
    $stmt = $pdo->prepare("
        SELECT 
            frage_id,
            schein,
            kategorie,
            unterkategorie,
            buchseite,
            frage_text,
            korrekte_antwort,
            CASE WHEN image IS NOT NULL THEN 1 ELSE 0 END as has_image
        FROM SBFSee_Ausbildung_Fragen
        WHERE frage_id = :id AND status = 1
    ");
    $stmt->execute(['id' => $frageId]);
    $frage = $stmt->fetch();
    
    if (!$frage) {
        sendError('Frage nicht gefunden', 404);
    }
    
    $stmt = $pdo->prepare("
        SELECT 
            antwort_buchstabe as buchstabe,
            antwort_text as text,
            ist_korrekt
        FROM SBFSee_Ausbildung_Antworten
        WHERE Frage_id = :frage_id
        ORDER BY antwort_buchstabe
    ");
    $stmt->execute(['frage_id' => $frageId]);
    $antworten = $stmt->fetchAll();
    
    $frage['antworten'] = $antworten;
    
    sendJSON($frage, 200);
    
} catch (PDOException $e) {
    error_log("Question error: " . $e->getMessage());
    sendError('Datenbankfehler: ' . $e->getMessage(), 500);
}
