<?php
/**
 * Category Progress - ANGEPASST für lernplattform_progress
 * GET /api/progress/categories.php?schein=SBF-See
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
    
    $sql = "
        SELECT 
            f.kategorie,
            f.unterkategorie,
            COUNT(DISTINCT f.frage_id) as gesamt_fragen,
            COUNT(DISTINCT p.frage_id) as beantwortete_fragen,
            SUM(CASE WHEN p.is_correct = 1 THEN 1 ELSE 0 END) as richtige_antworten
        FROM SBFSee_Ausbildung_Fragen f
        LEFT JOIN (
            SELECT p1.frage_id, p1.is_correct
            FROM lernplattform_progress p1
            INNER JOIN (
                SELECT frage_id, MAX(attempted_at) as last_attempt
                FROM lernplattform_progress
                WHERE user_id = :user_id
                GROUP BY frage_id
            ) p2 ON p1.frage_id = p2.frage_id AND p1.attempted_at = p2.last_attempt
            WHERE p1.user_id = :user_id
        ) p ON f.frage_id = p.frage_id
        WHERE f.status = 1
    ";
    
    $params = ['user_id' => $user['id']];
    
    if ($schein) {
        $sql .= " AND f.schein = :schein";
        $params['schein'] = $schein;
    }
    
    $sql .= "
        GROUP BY f.kategorie, f.unterkategorie
        ORDER BY f.kategorie, f.unterkategorie
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $results = $stmt->fetchAll();
    
    $categoryProgress = [];
    foreach ($results as $row) {
        $gesamtFragen = (int)$row['gesamt_fragen'];
        $beantwortete = (int)$row['beantwortete_fragen'];
        $richtige = (int)$row['richtige_antworten'];
        
        $fortschritt = $gesamtFragen > 0 ? round(($beantwortete / $gesamtFragen) * 100, 1) : 0;
        $erfolgsquote = $beantwortete > 0 ? round(($richtige / $beantwortete) * 100, 1) : 0;
        
        $categoryProgress[] = [
            'kategorie' => $row['kategorie'],
            'unterkategorie' => $row['unterkategorie'],
            'gesamt_fragen' => $gesamtFragen,
            'beantwortete_fragen' => $beantwortete,
            'richtige_antworten' => $richtige,
            'fortschritt' => $fortschritt,
            'erfolgsquote' => $erfolgsquote
        ];
    }
    
    sendJSON($categoryProgress, 200);
    
} catch (PDOException $e) {
    error_log("Category progress error: " . $e->getMessage());
    sendError('Datenbankfehler: ' . $e->getMessage(), 500);
}
