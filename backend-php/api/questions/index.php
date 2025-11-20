<?php
/**
 * Questions Endpoint - FINAL für SBFSee_Ausbildung_Fragen
 * GET /api/questions/index.php
 */

require_once '../../config/config.php';
require_once '../../middleware/jwt.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Method not allowed', 405);
}

$user = authenticateUserOptional();
$schein = $_GET['schein'] ?? null;
$kategorie = $_GET['kategorie'] ?? null;
$unterkategorie = $_GET['unterkategorie'] ?? null;

try {
    $pdo = getDBConnection();
    
    $sql = "
        SELECT 
            f.frage_id,
            f.schein,
            f.kategorie,
            f.unterkategorie,
            f.buchseite,
            f.frage_text,
            f.korrekte_antwort,
            CASE WHEN f.image IS NOT NULL THEN 1 ELSE 0 END as has_image
        FROM SBFSee_Ausbildung_Fragen f
        WHERE f.status = 1
    ";
    
    $params = [];
    
    if ($schein) {
        $sql .= " AND f.schein = :schein";
        $params['schein'] = $schein;
    }
    
    if ($kategorie) {
        $sql .= " AND f.kategorie = :kategorie";
        $params['kategorie'] = $kategorie;
    }
    
    if ($unterkategorie) {
        $sql .= " AND f.unterkategorie = :unterkategorie";
        $params['unterkategorie'] = $unterkategorie;
    }
    
    $sql .= " ORDER BY f.frage_id";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $fragen = $stmt->fetchAll();
    
    $fragenMitAntworten = [];
    foreach ($fragen as $frage) {
        // EXAKTE Spaltennamen aus Ihrer Tabelle!
        $stmt = $pdo->prepare("
            SELECT 
                antwort_buchstabe as buchstabe,
                antwort_text as text,
                ist_korrekt
            FROM SBFSee_Ausbildung_Antworten
            WHERE Frage_id = :frage_id
            ORDER BY antwort_buchstabe
        ");
        $stmt->execute(['frage_id' => $frage['frage_id']]);
        $antworten = $stmt->fetchAll();
        
        $frage['antworten'] = $antworten;
        $fragenMitAntworten[] = $frage;
    }
    
    sendJSON($fragenMitAntworten, 200);
    
} catch (PDOException $e) {
    error_log("Questions error: " . $e->getMessage());
    sendError('Datenbankfehler: ' . $e->getMessage(), 500);
}
