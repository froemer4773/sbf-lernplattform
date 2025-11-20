<?php
/**
 * User Progress - ANGEPASST für lernplattform_progress
 * GET /api/progress/user.php?schein=SBF-See
 */

require_once '../../config/config.php';
require_once '../../middleware/jwt.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Method not allowed', 405);
}

$user = authenticateUser();
$schein = $_GET['schein'] ?? null;

try {
    $pdo = getDBConnection();
    
    // Subquery für letzte Antwort pro Frage
    $sql = "
        SELECT 
            COUNT(DISTINCT p.frage_id) as beantwortete_fragen,
            SUM(CASE WHEN p.is_correct = 1 THEN 1 ELSE 0 END) as richtige_antworten
        FROM lernplattform_progress p
        INNER JOIN (
            SELECT frage_id, MAX(attempted_at) as last_attempt
            FROM lernplattform_progress
            WHERE user_id = :user_id
            GROUP BY frage_id
        ) latest ON p.frage_id = latest.frage_id AND p.attempted_at = latest.last_attempt
        WHERE p.user_id = :user_id
    ";
    
    $params = ['user_id' => $user['id']];
    
    if ($schein) {
        $sql .= " AND EXISTS (
            SELECT 1 FROM SBFSee_Ausbildung_Fragen f 
            WHERE f.frage_id = p.frage_id AND f.schein = :schein
        )";
        $params['schein'] = $schein;
    }
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $progress = $stmt->fetch();
    
    $sqlGesamt = "SELECT COUNT(*) as gesamt FROM SBFSee_Ausbildung_Fragen WHERE status = 1";
    if ($schein) {
        $sqlGesamt .= " AND schein = :schein";
    }
    
    $stmt = $pdo->prepare($sqlGesamt);
    if ($schein) {
        $stmt->execute(['schein' => $schein]);
    } else {
        $stmt->execute();
    }
    $gesamtResult = $stmt->fetch();
    
    $beantwortete = (int)$progress['beantwortete_fragen'];
    $richtige = (int)$progress['richtige_antworten'];
    $gesamt = (int)$gesamtResult['gesamt'];
    
    $erfolgsquote = $beantwortete > 0 ? round(($richtige / $beantwortete) * 100, 1) : 0;
    
    sendJSON([
        'beantwortete_fragen' => $beantwortete,
        'richtige_antworten' => $richtige,
        'gesamt_fragen' => $gesamt,
        'erfolgsquote' => $erfolgsquote
    ], 200);
    
} catch (PDOException $e) {
    error_log("User progress error: " . $e->getMessage());
    sendError('Datenbankfehler: ' . $e->getMessage(), 500);
}
