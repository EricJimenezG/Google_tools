<?php
declare(strict_types=1);

function app_config(): array
{
    static $config = null;
    if ($config !== null) {
        return $config;
    }

    $path = __DIR__ . '/../config/config.php';
    if (!is_file($path)) {
        throw new RuntimeException('Falta crear config/config.php a partir de config/config.example.php.');
    }

    $loaded = require $path;
    if (!is_array($loaded)) {
        throw new RuntimeException('La configuración de la aplicación no es válida.');
    }

    $config = $loaded;
    return $config;
}

function start_app_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
}

function json_response(int $status, array $body): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

function read_json_body(): ?array
{
    $body = json_decode((string) file_get_contents('php://input'), true);
    return is_array($body) ? $body : null;
}

function require_csrf_token(): void
{
    $provided = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    $expected = $_SESSION['csrf_token'] ?? '';
    if (!is_string($provided) || !is_string($expected) || $expected === '' || !hash_equals($expected, $provided)) {
        json_response(403, ['error' => 'csrf_failed']);
    }
}

function authenticated_user(): ?array
{
    $user = $_SESSION['user'] ?? null;
    return is_array($user) ? $user : null;
}

function require_authenticated_user(): array
{
    $user = authenticated_user();
    if ($user === null) {
        json_response(401, ['error' => 'authentication_required']);
    }
    return $user;
}
