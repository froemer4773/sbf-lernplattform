<?php
/**
 * JWT Helper - ANGEPASST für lernplattform_users
 */

class JWT {
    
    public static function encode($payload, $secret = null) {
        if ($secret === null) {
            $secret = JWT_SECRET;
        }
        
        $header = [
            'typ' => 'JWT',
            'alg' => JWT_ALGORITHM
        ];
        
        $payload['iat'] = time();
        $payload['exp'] = time() + JWT_EXPIRATION;
        
        $headerEncoded = self::base64UrlEncode(json_encode($header));
        $payloadEncoded = self::base64UrlEncode(json_encode($payload));
        
        $signature = hash_hmac('sha256', "$headerEncoded.$payloadEncoded", $secret, true);
        $signatureEncoded = self::base64UrlEncode($signature);
        
        return "$headerEncoded.$payloadEncoded.$signatureEncoded";
    }
    
    public static function decode($token, $secret = null) {
        if ($secret === null) {
            $secret = JWT_SECRET;
        }
        
        $parts = explode('.', $token);
        
        if (count($parts) !== 3) {
            throw new Exception('Invalid token format');
        }
        
        list($headerEncoded, $payloadEncoded, $signatureEncoded) = $parts;
        
        $signature = self::base64UrlDecode($signatureEncoded);
        $expectedSignature = hash_hmac('sha256', "$headerEncoded.$payloadEncoded", $secret, true);
        
        if (!hash_equals($signature, $expectedSignature)) {
            throw new Exception('Invalid signature');
        }
        
        $payload = json_decode(self::base64UrlDecode($payloadEncoded), true);
        
        if ($payload === null) {
            throw new Exception('Invalid payload');
        }
        
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            throw new Exception('Token expired');
        }
        
        return $payload;
    }
    
    private static function base64UrlEncode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
    
    private static function base64UrlDecode($data) {
        return base64_decode(strtr($data, '-_', '+/'));
    }
}

function getBearerToken() {
    $headers = getallheaders();
    
    if (!isset($headers['Authorization'])) {
        return null;
    }
    
    $matches = [];
    if (preg_match('/Bearer\s+(.*)$/i', $headers['Authorization'], $matches)) {
        return $matches[1];
    }
    
    return null;
}

function authenticateUser() {
    $token = getBearerToken();
    
    if (!$token) {
        sendError('Unauthorized - No token provided', 401);
    }
    
    try {
        $payload = JWT::decode($token);
        
        if (!isset($payload['user_id'])) {
            sendError('Unauthorized - Invalid token payload', 401);
        }
        
        // User aus lernplattform_users laden
        $pdo = getDBConnection();
        $stmt = $pdo->prepare("
            SELECT id, email, vorname, nachname, role, preferred_schein, created_at, last_login
            FROM lernplattform_users
            WHERE id = :id
        ");
        $stmt->execute(['id' => $payload['user_id']]);
        $user = $stmt->fetch();
        
        if (!$user) {
            sendError('Unauthorized - User not found', 401);
        }
        
        return $user;
        
    } catch (Exception $e) {
        sendError('Unauthorized - ' . $e->getMessage(), 401);
    }
}

function authenticateUserOptional() {
    $token = getBearerToken();
    
    if (!$token) {
        return null;
    }
    
    try {
        $payload = JWT::decode($token);
        
        if (!isset($payload['user_id'])) {
            return null;
        }
        
        $pdo = getDBConnection();
        $stmt = $pdo->prepare("
            SELECT id, email, vorname, nachname, role, preferred_schein
            FROM lernplattform_users
            WHERE id = :id
        ");
        $stmt->execute(['id' => $payload['user_id']]);
        $user = $stmt->fetch();
        
        return $user ?: null;
        
    } catch (Exception $e) {
        return null;
    }
}
