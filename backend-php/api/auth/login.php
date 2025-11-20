<?php
/**
 * Login Endpoint - ANGEPASST für lernplattform_users
 * POST /api/auth/login.php
 */

require_once '../../config/config.php';
require_once '../../middleware/jwt.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

$data = getRequestBody();

if (empty($data['email']) || empty($data['password'])) {
    sendError('E-Mail und Passwort sind erforderlich', 400);
}

$email = trim($data['email']);
$password = $data['password'];

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    sendError('Ungültige E-Mail-Adresse', 400);
}

try {
    $pdo = getDBConnection();
    
    // User aus lernplattform_users holen
    $stmt = $pdo->prepare("
        SELECT id, email, password_hash, vorname, nachname, role, preferred_schein, 
               created_at, last_login
        FROM lernplattform_users
        WHERE email = :email
    ");
    $stmt->execute(['email' => $email]);
    $user = $stmt->fetch();
    
    if (!$user || !password_verify($password, $user['password_hash'])) {
        sendError('Ungültige Anmeldedaten', 401);
    }
    
    // Last Login aktualisieren
    $stmt = $pdo->prepare("
        UPDATE lernplattform_users 
        SET last_login = NOW() 
        WHERE id = :id
    ");
    $stmt->execute(['id' => $user['id']]);
    
    // JWT Token erstellen
    $token = JWT::encode([
        'user_id' => $user['id'],
        'email' => $user['email'],
        'role' => $user['role']
    ]);
    
    $refreshToken = JWT::encode([
        'user_id' => $user['id'],
        'type' => 'refresh'
    ]);
    
    $userResponse = [
        'id' => (int)$user['id'],
        'email' => $user['email'],
        'vorname' => $user['vorname'],
        'nachname' => $user['nachname'],
        'role' => $user['role'],
        'preferred_schein' => $user['preferred_schein'],
        'created_at' => $user['created_at'],
        'last_login' => $user['last_login']
    ];
    
    sendJSON([
        'message' => 'Login erfolgreich',
        'token' => $token,
        'refreshToken' => $refreshToken,
        'user' => $userResponse
    ], 200);
    
} catch (PDOException $e) {
    error_log("Login error: " . $e->getMessage());
    sendError('Datenbankfehler beim Login', 500);
}
