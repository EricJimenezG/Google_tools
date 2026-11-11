<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/app.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/data.php';

start_app_session();
$user = require_authenticated_user();
$method = $_SERVER['REQUEST_METHOD'] ?? '';
if (!in_array($method, ['GET', 'POST'], true)) {
    header('Allow: GET, POST');
    json_response(405, ['error' => 'method_not_allowed']);
}

try {
    $courseId = null;
    if ($method === 'POST') {
        require_csrf_token();
        $body = read_json_body();
        $courseId = $body['course_id'] ?? null;
        if (!is_string($courseId) || !preg_match('/^[a-z0-9-]{1,100}$/', $courseId) ||
            ($body['completed'] ?? null) !== true) {
            json_response(422, ['error' => 'invalid_progress']);
        }
        if (find_course($courseId) === null) {
            json_response(404, ['error' => 'course_not_found']);
        }
    }

    $pdo = database();
    if ($method === 'GET') {
        $statement = $pdo->prepare(
            'SELECT course_id, completed_at FROM course_progress WHERE user_id = :user_id'
        );
        $statement->execute(['user_id' => $user['id']]);
        $done = [];
        foreach ($statement->fetchAll() as $row) {
            $done[$row['course_id']] = str_replace(' ', 'T', $row['completed_at']) . 'Z';
        }
        json_response(200, ['done' => $done]);
    }

    $statement = $pdo->prepare(
        'INSERT INTO course_progress (user_id, course_id, completed_at)
         VALUES (:user_id, :course_id, UTC_TIMESTAMP())
         ON DUPLICATE KEY UPDATE completed_at = course_progress.completed_at'
    );
    $statement->execute(['user_id' => $user['id'], 'course_id' => $courseId]);

    $statement = $pdo->prepare(
        'SELECT completed_at FROM course_progress WHERE user_id = :user_id AND course_id = :course_id'
    );
    $statement->execute(['user_id' => $user['id'], 'course_id' => $courseId]);
    $completedAt = $statement->fetchColumn();
    if (!is_string($completedAt)) {
        throw new RuntimeException('No se pudo recuperar el progreso guardado.');
    }
    json_response(200, [
        'course_id' => $courseId,
        'completed_at' => str_replace(' ', 'T', $completedAt) . 'Z',
    ]);
} catch (PDOException | RuntimeException $error) {
    error_log('Course progress request failed: ' . $error->getMessage());
    json_response(500, ['error' => 'progress_unavailable']);
}
