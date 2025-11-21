<?php
/**
 * Learning Time Statistics API
 * Returns aggregated learning session durations for authenticated user
 */

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../middleware/jwt.php';

header('Content-Type: application/json; charset=utf-8');

// Authenticate user
$user = authenticateUser();
$userId = $user['id'];

// Get period parameter (day, week, month)
$period = isset($_GET['period']) ? $_GET['period'] : 'week';

try {
    $pdo = getDBConnection();
    
    // Build query based on period
    switch ($period) {
        case 'day':
            // Last 7 days
            $sql = "
                SELECT 
                    DATE(started_at) as period_label,
                    SUM(TIMESTAMPDIFF(SECOND, started_at, ended_at)) as total_seconds,
                    COUNT(*) as session_count
                FROM lernplattform_sessions
                WHERE user_id = :user_id
                  AND ended_at IS NOT NULL
                  AND started_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
                GROUP BY DATE(started_at)
                ORDER BY period_label ASC
            ";
            break;
            
        case 'week':
            // Last 12 weeks
            $sql = "
                SELECT 
                    CONCAT(YEAR(started_at), '-W', LPAD(WEEK(started_at, 1), 2, '0')) as period_label,
                    SUM(TIMESTAMPDIFF(SECOND, started_at, ended_at)) as total_seconds,
                    COUNT(*) as session_count
                FROM lernplattform_sessions
                WHERE user_id = :user_id
                  AND ended_at IS NOT NULL
                  AND started_at >= DATE_SUB(CURDATE(), INTERVAL 12 WEEK)
                GROUP BY YEAR(started_at), WEEK(started_at, 1)
                ORDER BY period_label ASC
            ";
            break;
            
        case 'month':
            // Last 12 months
            $sql = "
                SELECT 
                    DATE_FORMAT(started_at, '%Y-%m') as period_label,
                    SUM(TIMESTAMPDIFF(SECOND, started_at, ended_at)) as total_seconds,
                    COUNT(*) as session_count
                FROM lernplattform_sessions
                WHERE user_id = :user_id
                  AND ended_at IS NOT NULL
                  AND started_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
                GROUP BY DATE_FORMAT(started_at, '%Y-%m')
                ORDER BY period_label ASC
            ";
            break;
            
        default:
            sendError('Invalid period parameter', 400);
    }
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':user_id' => $userId]);
    $results = $stmt->fetchAll();
    
    // Format results: convert seconds to minutes, add formatted labels
    $data = [];
    foreach ($results as $row) {
        $minutes = round($row['total_seconds'] / 60, 1);
        $hours = round($row['total_seconds'] / 3600, 2);
        
        $data[] = [
            'period' => $row['period_label'],
            'total_seconds' => (int)$row['total_seconds'],
            'total_minutes' => $minutes,
            'total_hours' => $hours,
            'session_count' => (int)$row['session_count']
        ];
    }
    
    // Calculate totals
    $totalSeconds = array_sum(array_column($results, 'total_seconds'));
    $totalSessions = array_sum(array_column($results, 'session_count'));
    
    sendJSON([
        'period' => $period,
        'data' => $data,
        'summary' => [
            'total_seconds' => (int)$totalSeconds,
            'total_minutes' => round($totalSeconds / 60, 1),
            'total_hours' => round($totalSeconds / 3600, 2),
            'total_sessions' => (int)$totalSessions
        ]
    ]);
    
} catch (Exception $e) {
    error_log('Learning time stats error: ' . $e->getMessage());
    sendError('Failed to retrieve learning time statistics', 500);
}
