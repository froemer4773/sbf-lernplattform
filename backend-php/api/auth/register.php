<?php
/**
 * Register Endpoint - ANGEPASST für lernplattform_users
 * POST /api/auth/register.php
 */

require_once '../../config/config.php';
require_once '../../middleware/jwt.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

$data = getRequestBody();

$requiredFields = ['email', 'password', 'vorname', 'nachname', 'preferred_schein'];
foreach ($requiredFields as $field) {
    if (empty($data[$field])) {
        sendError("Feld '$field' ist erforderlich", 400);
    }
}

$email = trim($data['email']);
$password = $data['password'];
$vorname = trim($data['vorname']);
$nachname = trim($data['nachname']);
$preferred_schein = $data['preferred_schein'];

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    sendError('Ungültige E-Mail-Adresse', 400);
}

if (strlen($password) < PASSWORD_MIN_LENGTH) {
    sendError('Passwort muss mindestens ' . PASSWORD_MIN_LENGTH . ' Zeichen lang sein', 400);
}

if (!preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/', $password)) {
    sendError('Passwort muss mindestens einen Großbuchstaben, einen Kleinbuchstaben und eine Zahl enthalten', 400);
}

$validScheine = ['SBF-See', 'SBF-Binnen'];
if (!in_array($preferred_schein, $validScheine)) {
    sendError('Ungültiger Führerschein-Typ', 400);
}

try {
    $pdo = getDBConnection();
    
    // Prüfe ob E-Mail existiert
    $stmt = $pdo->prepare("SELECT id FROM lernplattform_users WHERE email = :email");
    $stmt->execute(['email' => $email]);
    
    if ($stmt->fetch()) {
        sendError('Diese E-Mail-Adresse ist bereits registriert', 409);
    }
    
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
    
    // User erstellen in lernplattform_users
    $stmt = $pdo->prepare("
        INSERT INTO lernplattform_users (
            email, 
            password_hash, 
            vorname, 
            nachname, 
            preferred_schein,
            role,
            is_approved,
            created_at
        ) VALUES (
            :email,
            :password_hash,
            :vorname,
            :nachname,
            :preferred_schein,
            'MITGLIED',
            1,
            NOW()
        )
    ");
    
    $stmt->execute([
        'email' => $email,
        'password_hash' => $passwordHash,
        'vorname' => $vorname,
        'nachname' => $nachname,
        'preferred_schein' => $preferred_schein
    ]);
    
    $userId = $pdo->lastInsertId();
    
    $token = JWT::encode([
        'user_id' => $userId,
        'email' => $email,
        'role' => 'MITGLIED'
    ]);
    
    $refreshToken = JWT::encode([
        'user_id' => $userId,
        'type' => 'refresh'
    ]);
    
    $userResponse = [
        'id' => (int)$userId,
        'email' => $email,
        'vorname' => $vorname,
        'nachname' => $nachname,
        'role' => 'MITGLIED',
        'preferred_schein' => $preferred_schein,
        'created_at' => date('Y-m-d H:i:s')
    ];
    
    sendJSON([
        'message' => 'Registrierung erfolgreich',
        'token' => $token,
        'refreshToken' => $refreshToken,
        'user' => $userResponse
    ], 201);
    
} catch (PDOException $e) {
    error_log("Registration error: " . $e->getMessage());
    sendError('Datenbankfehler bei der Registrierung', 500);
}
