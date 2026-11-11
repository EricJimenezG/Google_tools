<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/app.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/data.php';

start_app_session();
$user = require_authenticated_user();
$method = $_SERVER['REQUEST_METHOD'] ?? '';
if (!in_array($method, ['GET', 'POST', 'DELETE'], true)) {
    header('Allow: GET, POST, DELETE');
    json_response(405, ['error' => 'method_not_allowed']);
}

try {
    $pdo = database();
    if ($method === 'GET') {
        $statement = $pdo->prepare(
            'SELECT course_id FROM course_enrollments WHERE user_id = :user_id'
        );
        $statement->execute(['user_id' => $user['id']]);
        json_response(200, ['enrolled' => array_column($statement->fetchAll(), 'course_id')]);
    }

    require_csrf_token();
    $body = read_json_body();
    $courseId = $body['course_id'] ?? null;
    if (!is_string($courseId) || !preg_match('/^[a-z0-9-]{1,100}$/', $courseId)) {
        json_response(422, ['error' => 'invalid_course_id']);
    }
    if (find_course($courseId) === null) {
        json_response(404, ['error' => 'course_not_found']);
    }

    if ($method === 'DELETE') {
        $pdo->beginTransaction();
        $statement = $pdo->prepare(
            'SELECT 1 FROM course_enrollments
             WHERE user_id = :user_id AND course_id = :course_id
             FOR UPDATE'
        );
        $statement->execute(['user_id' => $user['id'], 'course_id' => $courseId]);
        if ($statement->fetchColumn() === false) {
            $pdo->rollBack();
            json_response(404, ['error' => 'enrollment_not_found']);
        }

        $statement = $pdo->prepare(
            'SELECT 1 FROM course_progress WHERE user_id = :user_id AND course_id = :course_id'
        );
        $statement->execute(['user_id' => $user['id'], 'course_id' => $courseId]);
        if ($statement->fetchColumn() !== false) {
            $pdo->rollBack();
            json_response(409, ['error' => 'course_already_completed']);
        }

        $statement = $pdo->prepare(
            'DELETE FROM course_enrollments WHERE user_id = :user_id AND course_id = :course_id'
        );
        $statement->execute(['user_id' => $user['id'], 'course_id' => $courseId]);
        $pdo->commit();
        json_response(200, ['course_id' => $courseId, 'enrolled' => false]);
    }

    $statement = $pdo->prepare(
        'INSERT INTO course_enrollments (user_id, course_id)
         VALUES (:user_id, :course_id)
         ON DUPLICATE KEY UPDATE enrolled_at = course_enrollments.enrolled_at'
    );
    $statement->execute(['user_id' => $user['id'], 'course_id' => $courseId]);

    json_response(201, ['course_id' => $courseId, 'enrolled' => true]);
} catch (PDOException | RuntimeException $error) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('Course enrollment request failed: ' . $error->getMessage());
    json_response(500, ['error' => 'enrollment_unavailable']);
}
