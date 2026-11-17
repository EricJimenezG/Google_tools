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
    $answers = null;
    $language = null;
    if ($method === 'POST') {
        require_csrf_token();
        $body = read_json_body();
        $courseId = $body['course_id'] ?? null;
        $answers = $body['answers'] ?? null;
        $language = $body['lang'] ?? null;
        if (!is_string($courseId) || !preg_match('/^[a-z0-9-]{1,100}$/', $courseId) ||
            !is_array($answers) || !is_string($language) || !in_array($language, ['es', 'en'], true)) {
            json_response(422, ['error' => 'invalid_assessment']);
        }
        if (find_course($courseId) === null) {
            json_response(404, ['error' => 'course_not_found']);
        }
    }

    $pdo = database();
    if ($method === 'GET') {
        $done = [];
        $statement = $pdo->prepare(
            'SELECT course_id FROM course_assessment_results WHERE user_id = :user_id'
        );
        $statement->execute(['user_id' => $user['id']]);
        $assessedCourses = array_fill_keys(array_column($statement->fetchAll(), 'course_id'), true);
        $statement = $pdo->prepare(
            'SELECT course_id, completed_at FROM course_progress WHERE user_id = :user_id'
        );
        $statement->execute(['user_id' => $user['id']]);
        foreach ($statement->fetchAll() as $row) {
            $course = find_course((string) $row['course_id']);
            if ($course !== null && course_has_assessment($course) &&
                !isset($assessedCourses[$row['course_id']])) {
                continue;
            }
            $done[$row['course_id']] = str_replace(' ', 'T', $row['completed_at']) . 'Z';
        }
        json_response(200, ['done' => $done]);
    }

    $course = find_course($courseId);
    $questions = $course['quiz'] ?? null;
    if (!is_array($questions) || !$questions) {
        json_response(422, ['error' => 'assessment_unavailable']);
    }
    if (count($answers) !== count($questions)) {
        json_response(422, ['error' => 'invalid_assessment_answers']);
    }

    $reviewQuestions = [];
    $correctCount = 0;
    $baseWeight = floor(10000 / count($questions)) / 100;
    foreach ($questions as $index => $question) {
        $selectedIndex = $answers[$index] ?? null;
        $options = $question['options'] ?? null;
        if (!is_int($selectedIndex) || !is_array($options) || !array_key_exists($selectedIndex, $options)) {
            json_response(422, ['error' => 'invalid_assessment_answers']);
        }
        $correctIndex = $question['answer'] ?? null;
        if (!is_int($correctIndex) || !array_key_exists($correctIndex, $options)) {
            throw new RuntimeException('La evaluación contiene una respuesta correcta inválida.');
        }
        $isCorrect = $selectedIndex === $correctIndex;
        if ($isCorrect) {
            $correctCount++;
        }
        $languageIndex = $language === 'en' ? 1 : 0;
        $reviewQuestions[] = [
            'title' => (string) ($question['title'][$languageIndex] ?? ''),
            'text' => (string) ($question['text'][$languageIndex] ?? ''),
            'question' => (string) ($question['question'][$languageIndex] ?? ''),
            'selected_answer' => (string) ($options[$selectedIndex][$languageIndex] ?? ''),
            'correct_answer' => (string) ($options[$correctIndex][$languageIndex] ?? ''),
            'is_correct' => $isCorrect,
            'feedback' => (string) ($question['feedback'][$languageIndex] ?? ''),
            'weight_percentage' => $index === count($questions) - 1
                ? round(100 - ($baseWeight * (count($questions) - 1)), 2)
                : $baseWeight,
        ];
    }

    $totalQuestions = count($questions);
    $requiredCorrect = intdiv($totalQuestions, 2) + 1;
    $percentage = round(($correctCount / $totalQuestions) * 100, 2);
    $passed = $correctCount >= $requiredCorrect;
    $review = [
        'correct_count' => $correctCount,
        'total_questions' => $totalQuestions,
        'required_correct' => $requiredCorrect,
        'percentage' => $percentage,
        'passed' => $passed,
        'questions' => $reviewQuestions,
    ];

    $pdo->beginTransaction();
    $enrollment = $pdo->prepare(
        'SELECT 1 FROM course_enrollments
         WHERE user_id = :user_id AND course_id = :course_id
         FOR UPDATE'
    );
    $enrollment->execute(['user_id' => $user['id'], 'course_id' => $courseId]);
    if ($enrollment->fetchColumn() === false) {
        $pdo->rollBack();
        json_response(403, ['error' => 'course_enrollment_required']);
    }

    $videoModules = course_video_modules($course, $language, 'Course video');
    if ($videoModules) {
        $statement = $pdo->prepare(
            'SELECT module_index FROM course_video_progress
             WHERE user_id = :user_id AND course_id = :course_id
             ORDER BY module_index'
        );
        $statement->execute(['user_id' => $user['id'], 'course_id' => $courseId]);
        $completedModules = array_map('intval', array_column($statement->fetchAll(), 'module_index'));
        if (count($completedModules) !== count($videoModules)) {
            $pdo->rollBack();
            json_response(403, ['error' => 'course_videos_incomplete']);
        }
        foreach (array_keys($videoModules) as $moduleIndex) {
            if (($completedModules[$moduleIndex] ?? null) !== $moduleIndex) {
                $pdo->rollBack();
                json_response(403, ['error' => 'course_videos_incomplete']);
            }
        }
    }

    if ($passed) {
        $reviewJson = json_encode($review, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if (!is_string($reviewJson)) {
            throw new RuntimeException('No se pudo serializar el resultado de la evaluación.');
        }
        $statement = $pdo->prepare(
            'INSERT INTO course_assessment_results
               (user_id, course_id, review_json, correct_count, total_questions, percentage, passed_at)
             VALUES (:user_id, :course_id, :review_json, :correct_count, :total_questions, :percentage, UTC_TIMESTAMP())
             ON DUPLICATE KEY UPDATE
               review_json = VALUES(review_json),
               correct_count = VALUES(correct_count),
               total_questions = VALUES(total_questions),
               percentage = VALUES(percentage),
               passed_at = VALUES(passed_at)'
        );
        $statement->execute([
            'user_id' => $user['id'],
            'course_id' => $courseId,
            'review_json' => $reviewJson,
            'correct_count' => $correctCount,
            'total_questions' => $totalQuestions,
            'percentage' => $percentage,
        ]);
        $statement = $pdo->prepare(
            'INSERT INTO course_progress (user_id, course_id, completed_at)
             VALUES (:user_id, :course_id, UTC_TIMESTAMP())
             ON DUPLICATE KEY UPDATE completed_at = course_progress.completed_at'
        );
        $statement->execute(['user_id' => $user['id'], 'course_id' => $courseId]);
    }
    $pdo->commit();
    json_response(200, [
        'course_id' => $courseId,
        'assessment' => $review,
        'completed' => $passed,
    ]);
} catch (PDOException | RuntimeException $error) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('Course progress request failed: ' . $error->getMessage());
    json_response(500, ['error' => 'progress_unavailable']);
}
