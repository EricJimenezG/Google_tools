<?php
declare(strict_types=1);

require_once __DIR__ . '/app.php';

function database(): PDO
{
    $config = app_config()['database'] ?? null;
    if (!is_array($config)) {
        throw new RuntimeException('La configuración de MySQL no está completa.');
    }

    foreach (['host', 'port', 'name', 'user', 'password'] as $key) {
        if (!array_key_exists($key, $config) || !is_scalar($config[$key])) {
            throw new RuntimeException('La configuración de MySQL no está completa.');
        }
    }

    $dsn = sprintf(
        'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
        (string) $config['host'],
        (int) $config['port'],
        (string) $config['name']
    );

    return new PDO($dsn, (string) $config['user'], (string) $config['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
}
