<?php
/**
 * Licenses Endpoint - Angepasst
 * GET /api/licenses/index.php
 */

require_once '../../config/config.php';

// Nur GET erlaubt
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Method not allowed', 405);
}

try {
    $pdo = getDBConnection();
    
    // Verfügbare Scheine aus Fragen-Tabelle holen
    $stmt = $pdo->query("
        SELECT DISTINCT schein as name
        FROM SBFSee_Ausbildung_Fragen
        WHERE status = 1
        ORDER BY schein
    ");
    $licenses = $stmt->fetchAll();
    
    sendJSON($licenses, 200);
    
} catch (PDOException $e) {
    error_log("Licenses error: " . $e->getMessage());
    sendError('Datenbankfehler: ' . $e->getMessage(), 500);
}
