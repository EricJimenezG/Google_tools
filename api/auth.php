<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/app.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/data.php';

start_app_session();
$action = $_GET['action'] ?? '';

function redirect_after_auth(string $result): void
{
    if ($result === 'success') {
        $courseId = $_SESSION['auth_return_course'] ?? '';
        $lang = $_SESSION['auth_return_lang'] ?? 'es';
        unset($_SESSION['auth_return_course'], $_SESSION['auth_return_lang']);
        if (is_string($courseId) && $courseId !== '' && in_array($lang, ['es', 'en'], true)) {
            header('Location: ../curso.php?id=' . rawurlencode($courseId) . '&lang=' . $lang, true, 303);
            exit;
        }
    } else {
        unset($_SESSION['auth_return_course'], $_SESSION['auth_return_lang']);
    }
    header('Location: ../index.html?auth=' . rawurlencode($result), true, 303);
    exit;
}

function google_config(): array
{
    $google = app_config()['google'] ?? null;
    if (!is_array($google)) {
        throw new RuntimeException('Falta configurar las credenciales de Google OAuth.');
    }

    foreach (['client_id', 'client_secret', 'redirect_uri'] as $key) {
        if (!isset($google[$key]) || !is_string($google[$key]) || $google[$key] === '' || str_starts_with($google[$key], 'YOUR_')) {
            throw new RuntimeException('Falta configurar las credenciales de Google OAuth.');
        }
    }

    $redirect = parse_url($google['redirect_uri']);
    $localHosts = ['localhost', '127.0.0.1', '::1'];
    $isLocalHttp = is_array($redirect)
        && ($redirect['scheme'] ?? '') === 'http'
        && in_array(strtolower($redirect['host'] ?? ''), $localHosts, true);
    if (!is_array($redirect) || (($redirect['scheme'] ?? '') !== 'https' && !$isLocalHttp)) {
        throw new RuntimeException('La URL de retorno de Google debe usar HTTPS, excepto en localhost.');
    }

    return $google;
}

function google_json_request(string $url, array $headers, ?string $postBody = null): array
{
    $curl = curl_init($url);
    if ($curl === false) {
        throw new RuntimeException('No se pudo iniciar la conexión segura con Google.');
    }

    $options = [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
        CURLOPT_HTTPHEADER => $headers,
    ];
    if ($postBody !== null) {
        $options[CURLOPT_POST] = true;
        $options[CURLOPT_POSTFIELDS] = $postBody;
    }
    curl_setopt_array($curl, $options);
    $response = curl_exec($curl);
    $status = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
    $error = curl_error($curl);
    curl_close($curl);

    if (!is_string($response) || $status < 200 || $status >= 300) {
        error_log('Google OAuth request failed with HTTP status ' . $status . ($error !== '' ? ': ' . $error : ''));
        throw new RuntimeException('La verificación con Google no se completó.');
    }

    $decoded = json_decode($response, true);
    if (!is_array($decoded)) {
        throw new RuntimeException('Google devolvió una respuesta inválida.');
    }
    return $decoded;
}

function base64url_encode(string $value): string
{
    return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
}

if ($action === 'session' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    json_response(200, [
        'user' => authenticated_user(),
        'csrfToken' => $_SESSION['csrf_token'],
    ]);
}

if ($action === 'login' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $google = google_config();
    } catch (RuntimeException $error) {
        http_response_code(503);
        header('Content-Type: text/plain; charset=utf-8');
        echo $error->getMessage();
        exit;
    }

    $state = bin2hex(random_bytes(32));
    $verifier = base64url_encode(random_bytes(32));
    $_SESSION['oauth_state'] = $state;
    $_SESSION['oauth_code_verifier'] = $verifier;
    $courseId = $_GET['course_id'] ?? '';
    $lang = $_GET['lang'] ?? 'es';
    if (is_string($courseId) && $courseId !== '' && in_array($lang, ['es', 'en'], true) &&
        find_course($courseId) !== null) {
        $_SESSION['auth_return_course'] = $courseId;
        $_SESSION['auth_return_lang'] = $lang;
    } else {
        unset($_SESSION['auth_return_course'], $_SESSION['auth_return_lang']);
    }

    $authorizationUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' . http_build_query([
        'client_id' => $google['client_id'],
        'redirect_uri' => $google['redirect_uri'],
        'response_type' => 'code',
        'scope' => 'openid email profile',
        'state' => $state,
        'code_challenge' => base64url_encode(hash('sha256', $verifier, true)),
        'code_challenge_method' => 'S256',
        'prompt' => 'select_account',
    ], '', '&', PHP_QUERY_RFC3986);
    header('Location: ' . $authorizationUrl, true, 302);
    exit;
}

if ($action === 'callback' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    $state = $_GET['state'] ?? '';
    $expectedState = $_SESSION['oauth_state'] ?? '';
    $verifier = $_SESSION['oauth_code_verifier'] ?? '';
    unset($_SESSION['oauth_state'], $_SESSION['oauth_code_verifier']);

    if (!is_string($state) || !is_string($expectedState) || $expectedState === '' || !hash_equals($expectedState, $state)) {
        redirect_after_auth('error');
    }
    if (isset($_GET['error'])) {
        redirect_after_auth('cancelled');
    }

    $code = $_GET['code'] ?? '';
    if (!is_string($code) || $code === '' || !is_string($verifier) || $verifier === '') {
        redirect_after_auth('error');
    }

    try {
        $google = google_config();
        $token = google_json_request(
            'https://oauth2.googleapis.com/token',
            ['Content-Type: application/x-www-form-urlencoded'],
            http_build_query([
                'code' => $code,
                'client_id' => $google['client_id'],
                'client_secret' => $google['client_secret'],
                'redirect_uri' => $google['redirect_uri'],
                'grant_type' => 'authorization_code',
                'code_verifier' => $verifier,
            ], '', '&', PHP_QUERY_RFC3986)
        );
        $accessToken = $token['access_token'] ?? '';
        if (!is_string($accessToken) || $accessToken === '') {
            throw new RuntimeException('Google no devolvió un token de acceso.');
        }

        $profile = google_json_request(
            'https://www.googleapis.com/oauth2/v2/userinfo',
            ['Authorization: Bearer ' . $accessToken]
        );
        $googleSub = $profile['id'] ?? '';
        $email = $profile['email'] ?? '';
        $name = $profile['name'] ?? '';
        $picture = $profile['picture'] ?? null;
        if (!is_string($googleSub) || $googleSub === '' ||
            !is_string($email) || !filter_var($email, FILTER_VALIDATE_EMAIL) ||
            ($profile['verified_email'] ?? false) !== true) {
            throw new RuntimeException('Google no devolvió una cuenta verificada.');
        }
        if (!is_string($name) || $name === '') {
            $name = $email;
        }
        if (strlen($googleSub) > 255 || strlen($email) > 320 || strlen($name) > 255 ||
            (is_string($picture) && strlen($picture) > 2048)) {
            throw new RuntimeException('El perfil de Google excede los límites permitidos.');
        }

        $pdo = database();
        $statement = $pdo->prepare(
            'INSERT INTO users (google_sub, email, display_name, picture_url)
             VALUES (:google_sub, :email, :display_name, :picture_url)
             ON DUPLICATE KEY UPDATE
               email = VALUES(email),
               display_name = VALUES(display_name),
               picture_url = VALUES(picture_url),
               updated_at = CURRENT_TIMESTAMP'
        );
        $statement->execute([
            'google_sub' => $googleSub,
            'email' => $email,
            'display_name' => $name,
            'picture_url' => is_string($picture) ? $picture : null,
        ]);
        $statement = $pdo->prepare('SELECT id FROM users WHERE google_sub = :google_sub');
        $statement->execute(['google_sub' => $googleSub]);
        $userId = $statement->fetchColumn();
        if ($userId === false) {
            throw new RuntimeException('No se pudo recuperar el usuario.');
        }

        session_regenerate_id(true);
        $_SESSION['user'] = [
            'id' => (int) $userId,
            'name' => $name,
            'email' => $email,
            'picture' => is_string($picture) ? $picture : null,
        ];
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        redirect_after_auth('success');
    } catch (RuntimeException | PDOException $error) {
        error_log('Google sign-in failed: ' . $error->getMessage());
        redirect_after_auth('error');
    }
}

if ($action === 'logout' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    require_csrf_token();
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', [
            'expires' => time() - 42000,
            'path' => $params['path'],
            'domain' => $params['domain'],
            'secure' => $params['secure'],
            'httponly' => $params['httponly'],
            'samesite' => $params['samesite'] ?? 'Lax',
        ]);
    }
    session_destroy();
    json_response(200, ['ok' => true]);
}

header('Allow: GET, POST');
json_response(405, ['error' => 'method_not_allowed']);
