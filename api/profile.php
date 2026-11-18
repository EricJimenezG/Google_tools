<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/app.php';
require_once __DIR__ . '/../includes/db.php';

function valid_profile_name(mixed $value, int $maxLength): ?string
{
    if (!is_string($value)) {
        return null;
    }

    $name = trim($value);
    $length = preg_match_all('/./us', $name);
    if ($name === '' || $length === false || $length > $maxLength ||
        preg_match('/\p{Cc}/u', $name) !== 0) {
        return null;
    }

    return $name;
}

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
    $firstName = valid_profile_name($body['firstName'] ?? null, 255);
    $lastName = valid_profile_name($body['lastName'] ?? null, 255);
    if ($firstName === null || $lastName === null) {
        json_response(422, ['error' => 'invalid_profile_names']);
    }
}

try {
    $pdo = database();
    if ($method === 'POST') {
        $statement = $pdo->prepare(
            'UPDATE users
             SET first_name = :first_name, last_name = :last_name
             WHERE id = :user_id'
        );
        $statement->execute([
            'first_name' => $firstName,
            'last_name' => $lastName,
            'user_id' => $user['id'],
        ]);
    }

    $statement = $pdo->prepare(
        'SELECT first_name, last_name FROM users WHERE id = :user_id'
    );
    $statement->execute(['user_id' => $user['id']]);
    $profile = $statement->fetch();
    if (!is_array($profile)) {
        json_response(404, ['error' => 'user_not_found']);
    }

    json_response(200, [
        'firstName' => $profile['first_name'],
        'lastName' => $profile['last_name'],
    ]);
} catch (PDOException | RuntimeException $error) {
    error_log('Account profile request failed: ' . $error->getMessage());
    json_response(500, ['error' => 'profile_unavailable']);
}
