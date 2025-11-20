<?php
/**
 * SBF Lernplattform - Database Configuration
 * 
 * WICHTIG: Diese Datei NIEMALS in Git committen!
 * Fügen Sie config.php zu .gitignore hinzu!
 */

// Fehlerberichterstattung für Entwicklung
// Für Production auf 0 setzen!
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Datenbank-Konfiguration
define('DB_HOST', 'localhost');  // all-inkl: meist 'localhost' oder 'mysqlXX.all-inkl.com'
define('DB_NAME', 'ihr_datenbankname');  // TODO: Anpassen!
define('DB_USER', 'ihr_username');       // TODO: Anpassen!
define('DB_PASS', 'ihr_passwort');       // TODO: Anpassen!
define('DB_CHARSET', 'utf8mb4');

// JWT Secret Key - UNBEDINGT ÄNDERN!
define('JWT_SECRET', 'IHR_SEHR_LANGES_ZUFÄLLIGES_SECRET_HIER_' . bin2hex(random_bytes(32)));
define('JWT_ALGORITHM', 'HS256');
define('JWT_EXPIRATION', 3600 * 24 * 14); // 14 Tage

// CORS Configuration
define('CORS_ALLOWED_ORIGINS', [
    'http://localhost:4200',  // Development
    'https://ihre-domain.all-inkl.com'  // Production - TODO: Anpassen!
]);

// API Configuration
define('API_VERSION', 'v1');
define('IMAGE_UPLOAD_DIR', __DIR__ . '/../images/');
define('MAX_IMAGE_SIZE', 5 * 1024 * 1024); // 5 MB

// Security Settings
define('PASSWORD_HASH_ALGO', PASSWORD_ARGON2ID);
define('PASSWORD_MIN_LENGTH', 8);

// Timezone
date_default_timezone_set('Europe/Berlin');

/**
 * Datenbankverbindung herstellen
 */
function getDBConnection() {
    static $pdo = null;
    
    if ($pdo === null) {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ];
            
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            error_log("Database connection failed: " . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                'error' => 'Database connection failed',
                'message' => 'Datenbankverbindung fehlgeschlagen'
            ]);
            exit;
        }
    }
    
    return $pdo;
}

/**
 * CORS Header setzen
 */
function setCorsHeaders() {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    
    if (in_array($origin, CORS_ALLOWED_ORIGINS)) {
        header("Access-Control-Allow-Origin: $origin");
    } else {
        // Für Entwicklung: Erlaube alle Origins
        // WICHTIG: Für Production entfernen oder auf spezifische Domain beschränken!
        header("Access-Control-Allow-Origin: *");
    }
    
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization");
    header("Access-Control-Max-Age: 3600");
    header("Access-Control-Allow-Credentials: true");
    
    // Handle OPTIONS request
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}

/**
 * JSON Response senden
 */
function sendJSON($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/**
 * Error Response senden
 */
function sendError($message, $statusCode = 400, $details = null) {
    $response = [
        'error' => true,
        'message' => $message
    ];
    
    if ($details !== null && error_reporting() !== 0) {
        $response['details'] = $details;
    }
    
    sendJSON($response, $statusCode);
}

/**
 * Request Body als JSON lesen
 */
function getRequestBody() {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        sendError('Invalid JSON in request body', 400);
    }
    
    return $data ?? [];
}

// CORS Headers bei jedem Request setzen
setCorsHeaders();
