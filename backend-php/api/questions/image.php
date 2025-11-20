<?php
/**
 * Question Image Endpoint - Angepasst für BLOB Bilder
 * GET /api/questions/image.php?id=123
 */

require_once '../../config/config.php';

// Nur GET erlaubt
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    exit;
}

$frageId = $_GET['id'] ?? null;

if (!$frageId || !is_numeric($frageId)) {
    http_response_code(400);
    exit;
}

try {
    $pdo = getDBConnection();
    
    // Bild aus DB holen (BLOB)
    $stmt = $pdo->prepare("
        SELECT image
        FROM SBFSee_Ausbildung_Fragen
        WHERE frage_id = :id AND status = 1
    ");
    $stmt->execute(['id' => $frageId]);
    $result = $stmt->fetch();
    
    if (!$result || empty($result['image'])) {
        http_response_code(404);
        exit;
    }
    
    $imageData = $result['image'];
    
    // MIME Type aus den ersten Bytes ermitteln
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mimeType = $finfo->buffer($imageData);
    
    // Fallback auf JPEG wenn nicht erkannt
    if (!$mimeType || !str_starts_with($mimeType, 'image/')) {
        $mimeType = 'image/jpeg';
    }
    
    // Cache Headers setzen (1 Jahr)
    header('Cache-Control: public, max-age=31536000');
    header('Expires: ' . gmdate('D, d M Y H:i:s', time() + 31536000) . ' GMT');
    
    // Content-Type setzen
    header('Content-Type: ' . $mimeType);
    header('Content-Length: ' . strlen($imageData));
    
    // Bild ausgeben
    echo $imageData;
    
} catch (PDOException $e) {
    error_log("Image error: " . $e->getMessage());
    http_response_code(500);
}
