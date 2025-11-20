<?php
/**
 * Progress Submit - ANGEPASST für lernplattform_progress
 * POST /api/progress/submit.php
 */

require_once '../../config/config.php';
require_once '../../middleware/jwt.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

$user = authenticateUser();
$data = getRequestBody();

if (!isset($data['frage_id']) || !isset($data['selected_answer'])) {
    sendError('frage_id und selected_answer sind erforderlich', 400);
}

$frageId = (int)$data['frage_id'];
$selectedAnswer = strtolower($data['selected_answer']);
$timeTakenSeconds = (int)($data['time_taken_seconds'] ?? 0);

try {
    $pdo = getDBConnection();
    
    $stmt = $pdo->prepare("
        SELECT korrekte_antwort, schein, kategorie, unterkategorie
        FROM SBFSee_Ausbildung_Fragen
        WHERE frage_id = :frage_id AND status = 1
    ");
    $stmt->execute(['frage_id' => $frageId]);
    $frage = $stmt->fetch();
    
    if (!$frage) {
        sendError('Frage nicht gefunden', 404);
    }
    
    $korrekteAntwort = strtolower($frage['korrekte_antwort']);
    $isCorrect = ($selectedAnswer === $korrekteAntwort);
    
    // Anzahl Versuche für diese Frage ermitteln
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as attempts 
        FROM lernplattform_progress 
        WHERE user_id = :user_id AND frage_id = :frage_id
    ");
    $stmt->execute([
        'user_id' => $user['id'],
        'frage_id' => $frageId
    ]);
    $result = $stmt->fetch();
    $attemptNumber = ((int)$result['attempts']) + 1;
    
    // In lernplattform_progress speichern
    $stmt = $pdo->prepare("
        INSERT INTO lernplattform_progress (
            user_id, frage_id, selected_answer, is_correct, 
            time_taken_seconds, attempt_number, attempted_at
        ) VALUES (
            :user_id, :frage_id, :selected_answer, :is_correct,
            :time_taken_seconds, :attempt_number, NOW()
        )
    ");
    
    $stmt->execute([
        'user_id' => $user['id'],
        'frage_id' => $frageId,
        'selected_answer' => $selectedAnswer,
        'is_correct' => $isCorrect ? 1 : 0,
        'time_taken_seconds' => $timeTakenSeconds,
        'attempt_number' => $attemptNumber
    ]);
    
    sendJSON([
        'success' => true,
        'is_correct' => $isCorrect,
        'korrekte_antwort' => $frage['korrekte_antwort'],
        'message' => $isCorrect ? 'Richtig!' : 'Leider falsch!'
    ], 200);
    
} catch (PDOException $e) {
    error_log("Progress submit error: " . $e->getMessage());
    sendError('Datenbankfehler: ' . $e->getMessage(), 500);
}
