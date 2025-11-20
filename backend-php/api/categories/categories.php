<?php
/**
 * Categories Endpoint - Angepasst
 * GET /api/categories/categories.php?schein=SBF-See
 */

require_once '../../config/config.php';
require_once '../../middleware/jwt.php';

// Nur GET erlaubt
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Method not allowed', 405);
}

$schein = $_GET['schein'] ?? null;

if (!$schein) {
    sendError('Schein Parameter erforderlich', 400);
}

try {
    $pdo = getDBConnection();
    
    // Kategorien mit Unterkategorien und Fragenzahl laden
    $stmt = $pdo->prepare("
        SELECT 
            kategorie,
            unterkategorie,
            COUNT(*) as fragen_anzahl
        FROM SBFSee_Ausbildung_Fragen
        WHERE schein = :schein AND status = 1
        GROUP BY kategorie, unterkategorie
        ORDER BY kategorie, unterkategorie
    ");
    $stmt->execute(['schein' => $schein]);
    $results = $stmt->fetchAll();
    
    // Gruppieren nach Kategorie
    $categories = [];
    $categoryMap = [];
    
    foreach ($results as $row) {
        $kategorie = $row['kategorie'];
        $unterkategorie = $row['unterkategorie'];
        $fragenAnzahl = (int)$row['fragen_anzahl'];
        
        // Kategorie initialisieren falls noch nicht vorhanden
        if (!isset($categoryMap[$kategorie])) {
            $categoryMap[$kategorie] = [
                'kategorie' => $kategorie,
                'unterkategorien' => []
            ];
        }
        
        // Unterkategorie hinzufügen
        if (!empty($unterkategorie)) {
            $categoryMap[$kategorie]['unterkategorien'][] = [
                'name' => $unterkategorie,
                'fragen_anzahl' => $fragenAnzahl
            ];
        }
    }
    
    // Array aus Map erstellen
    $categories = array_values($categoryMap);
    
    sendJSON($categories, 200);
    
} catch (PDOException $e) {
    error_log("Categories error: " . $e->getMessage());
    sendError('Datenbankfehler: ' . $e->getMessage(), 500);
}
