<?php
/**
 * SBF Lernplattform - Configuration (Variante A)
 *
 * - Uses environment variables where possible (recommended)
 * - Does NOT regenerate JWT secret on every request
 * - DO NOT commit this file to VCS (add to .gitignore)
 */

// Error reporting for development. Set to 0 in production.
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Database configuration (adjust or set via env vars)
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_NAME', getenv('DB_NAME') ?: 'd0455d0b');
define('DB_USER', getenv('DB_USER') ?: 'd0455d0b');
define('DB_PASS', getenv('DB_PASS') ?: '2XsHLXrT8tMNBYfiZvrp');
define('DB_CHARSET', getenv('DB_CHARSET') ?: 'utf8mb4');

// JWT configuration - Variante A: prefer environment variable
// In production set JWT_SECRET in the environment (Apache/Nginx/FPM) to a strong secret.
// Example (Apache): SetEnv JWT_SECRET "your-long-secret"
// Fallback value below should be replaced before production if env not used.
define('JWT_SECRET', getenv('JWT_SECRET') ?: 'Wd$gFr%t^U!*oNHL7geT83S5hz@s&!gl');
define('JWT_ALGORITHM', getenv('JWT_ALGORITHM') ?: 'HS256');
define('JWT_EXPIRATION', intval(getenv('JWT_EXPIRATION') ?: 3600 * 24 * 14)); // 14 days

// CORS configuration
define('CORS_ALLOWED_ORIGINS', [
    'http://localhost:4200',
    'https://lernapp.4roemer.de'
]);

// API configuration
define('API_VERSION', 'v1');
define('IMAGE_UPLOAD_DIR', __DIR__ . '/../images/');
define('MAX_IMAGE_SIZE', 5 * 1024 * 1024); // 5 MB

// Security settings
define('PASSWORD_HASH_ALGO', PASSWORD_ARGON2ID);
define('PASSWORD_MIN_LENGTH', 8);

// Timezone
date_default_timezone_set('Europe/Berlin');

/**
 * Database connection helper (singleton)
 */
function getDBConnection() {
    static $pdo = null;

    if ($pdo instanceof PDO) return $pdo;

    $dbHost = DB_HOST;
    $dbName = DB_NAME;
    $dbUser = DB_USER;
    $dbPass = DB_PASS;
    $charset = DB_CHARSET;

    $dsn = "mysql:host={$dbHost};dbname={$dbName};charset={$charset}";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    try {
        $pdo = new PDO($dsn, $dbUser, $dbPass, $options);
        return $pdo;
    } catch (PDOException $e) {
        error_log('Database connection failed: ' . $e->getMessage());
        header('Content-Type: application/json; charset=utf-8');
        http_response_code(500);
        echo json_encode(['error' => 'Database connection failed', 'message' => 'Datenbankverbindung fehlgeschlagen']);
        exit;
    }
}

/**
 * Set CORS headers for API responses
 */
function setCorsHeaders() {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

    if (in_array($origin, CORS_ALLOWED_ORIGINS, true)) {
        header("Access-Control-Allow-Origin: $origin");
    } else {
        // For development allow all origins; restrict in production
        header('Access-Control-Allow-Origin: *');
    }

    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Access-Control-Max-Age: 3600');
    header('Access-Control-Allow-Credentials: true');

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}

/**
 * Send JSON response
 */
function sendJSON($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/**
 * Send error response (JSON)
 */
function sendError($message, $statusCode = 400, $details = null) {
    $response = ['error' => true, 'message' => $message];
    if ($details !== null && error_reporting() !== 0) $response['details'] = $details;
    sendJSON($response, $statusCode);
}

/**
 * Read JSON request body as associative array
 */
function getRequestBody() {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    if (json_last_error() !== JSON_ERROR_NONE) sendError('Invalid JSON in request body', 400);
    return $data ?? [];
}

// Ensure CORS headers are present for every request that includes this file
setCorsHeaders();
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
