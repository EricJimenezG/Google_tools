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
    if ($method === 'GET') {
        $courseId = $_GET['course_id'] ?? null;
    } else {
        require_csrf_token();
        $body = read_json_body();
        $courseId = $body['course_id'] ?? null;
    }

    if (!is_string($courseId) || !preg_match('/^[a-z0-9-]{1,100}$/', $courseId)) {
        json_response(422, ['error' => 'invalid_course_id']);
    }
    $course = find_course($courseId);
    if ($course === null) {
        json_response(404, ['error' => 'course_not_found']);
    }
    $moduleCount = count(course_video_modules($course, 'es', 'Course video'));
    if ($moduleCount === 0) {
        json_response(422, ['error' => 'course_has_no_videos']);
    }

    $moduleIndex = null;
    if ($method === 'POST') {
        $moduleIndex = $body['module_index'] ?? null;
        if (!is_int($moduleIndex) || $moduleIndex < 0 || $moduleIndex >= $moduleCount) {
            json_response(422, ['error' => 'invalid_module_index']);
        }
    }

    $pdo = database();
    if ($method === 'POST') {
        $pdo->beginTransaction();
    }
    $enrollment = $pdo->prepare(
        'SELECT 1 FROM course_enrollments
         WHERE user_id = :user_id AND course_id = :course_id' .
            ($method === 'POST' ? ' FOR UPDATE' : '')
    );
    $enrollment->execute(['user_id' => $user['id'], 'course_id' => $courseId]);
    if ($enrollment->fetchColumn() === false) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        json_response(403, ['error' => 'course_enrollment_required']);
    }

    $statement = $pdo->prepare(
        'SELECT module_index FROM course_video_progress
         WHERE user_id = :user_id AND course_id = :course_id
         ORDER BY module_index'
    );
    $statement->execute(['user_id' => $user['id'], 'course_id' => $courseId]);
    $completed = array_map('intval', array_column($statement->fetchAll(), 'module_index'));

    if ($method === 'POST' && !in_array($moduleIndex, $completed, true)) {
        if ($moduleIndex !== count($completed)) {
            $pdo->rollBack();
            json_response(409, ['error' => 'videos_must_be_completed_in_order']);
        }
        $insert = $pdo->prepare(
            'INSERT INTO course_video_progress (user_id, course_id, module_index)
             VALUES (:user_id, :course_id, :module_index)'
        );
        $insert->execute([
            'user_id' => $user['id'],
            'course_id' => $courseId,
            'module_index' => $moduleIndex,
        ]);
        $completed[] = $moduleIndex;
    }

    if ($pdo->inTransaction()) {
        $pdo->commit();
    }
    json_response(200, [
        'course_id' => $courseId,
        'completed' => $completed,
        'total' => $moduleCount,
        'videos_completed' => count($completed) === $moduleCount,
    ]);
} catch (PDOException | RuntimeException $error) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('Course video progress request failed: ' . $error->getMessage());
    json_response(500, ['error' => 'video_progress_unavailable']);
}
