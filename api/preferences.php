<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/app.php';
require_once __DIR__ . '/../includes/db.php';

start_app_session();
$user = require_authenticated_user();
$method = $_SERVER['REQUEST_METHOD'] ?? '';
if (!in_array($method, ['GET', 'POST'], true)) {
    header('Allow: GET, POST');
    json_response(405, ['error' => 'method_not_allowed']);
}

if ($method === 'POST') {
    require_csrf_token();
    $body = read_json_body();
    $language = $body['language'] ?? null;
    $theme = $body['theme'] ?? null;
    if (!in_array($language, ['es', 'en'], true) || !in_array($theme, ['dark', 'light'], true)) {
        json_response(422, ['error' => 'invalid_preferences']);
    }
}

try {
    $pdo = database();
    if ($method === 'POST') {
        $statement = $pdo->prepare(
            'UPDATE users
             SET preferred_language = :language, preferred_theme = :theme
             WHERE id = :user_id'
        );
        $statement->execute([
            'language' => $language,
            'theme' => $theme,
            'user_id' => $user['id'],
        ]);
    }

    $statement = $pdo->prepare(
        'SELECT preferred_language, preferred_theme FROM users WHERE id = :user_id'
    );
    $statement->execute(['user_id' => $user['id']]);
    $preferences = $statement->fetch();
    if (!is_array($preferences)) {
        json_response(404, ['error' => 'user_not_found']);
    }

    json_response(200, [
        'language' => $preferences['preferred_language'],
        'theme' => $preferences['preferred_theme'],
    ]);
} catch (PDOException | RuntimeException $error) {
    error_log('Account preferences request failed: ' . $error->getMessage());
    json_response(500, ['error' => 'preferences_unavailable']);
}
