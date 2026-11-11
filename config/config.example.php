<?php
declare(strict_types=1);

return [
    'google' => [
        'client_id' => 'YOUR_GOOGLE_OAUTH_CLIENT_ID',
        'client_secret' => 'YOUR_GOOGLE_OAUTH_CLIENT_SECRET',
        'redirect_uri' => 'http://127.0.0.1/google_tools/api/auth.php?action=callback',
    ],
    'database' => [
        'host' => '127.0.0.1',
        'port' => 3306,
        'name' => 'gtools_academy',
        'user' => 'root',
        'password' => '',
    ],
];
