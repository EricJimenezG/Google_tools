<?php
declare(strict_types=1);

//Lee data/courses.json y devuelve la lista de cursos.
function load_courses(): array
{
    $raw = @file_get_contents(__DIR__ . '/../data/courses.json');
    $data = $raw === false ? null : json_decode($raw, true);
    if (!is_array($data)) {
        throw new RuntimeException('No se pudo leer data/courses.json');
    }
    return $data;
}

function find_course(string $id): ?array
{
    foreach (load_courses() as $course) {
        if ($course['id'] === $id) {
            return $course;
        }
    }
    return null;
}

function course_has_assessment(array $course): bool
{
    return isset($course['quiz']) && is_array($course['quiz']) && count($course['quiz']) > 0;
}

function canva_embed_url(string $value): ?string
{
    $url = parse_url(trim($value));
    if (!is_array($url) || !in_array(strtolower($url['host'] ?? ''), ['canva.com', 'www.canva.com'], true)) {
        return null;
    }

    $path = $url['path'] ?? '';
    if (!preg_match('~^/design/[\w-]+/[\w-]+/(?:watch|view)/?$~', $path)) {
        return null;
    }

    return 'https://www.canva.com' . rtrim($path, '/') . '?embed';
}

function youtube_embed_url(string $value): ?string
{
    $url = parse_url(trim($value));
    if (!is_array($url)) {
        return null;
    }

    $host = strtolower($url['host'] ?? '');
    $path = $url['path'] ?? '';
    $videoId = null;
    if (in_array($host, ['youtu.be', 'www.youtu.be'], true)) {
        $videoId = trim($path, '/');
    } elseif (in_array($host, ['youtube.com', 'www.youtube.com', 'm.youtube.com'], true)) {
        if ($path === '/watch') {
            parse_str($url['query'] ?? '', $query);
            $videoId = $query['v'] ?? null;
        } elseif (preg_match('~^/(?:embed|shorts|live)/([\w-]{11})$~', $path, $matches)) {
            $videoId = $matches[1];
        }
    }

    return is_string($videoId) && preg_match('/^[\w-]{11}$/', $videoId)
        ? 'https://www.youtube-nocookie.com/embed/' . $videoId
        : null;
}

function course_video_modules(array $course, string $language, string $fallbackTitle): array
{
    $languageIndex = $language === 'en' ? 1 : 0;
    $modules = [];
    if (isset($course['canvaVideos']) && is_array($course['canvaVideos'])) {
        foreach ($course['canvaVideos'] as $video) {
            if (!is_array($video) || !is_string($video['url'] ?? null)) {
                continue;
            }
            $embedUrl = canva_embed_url($video['url']);
            if ($embedUrl === null) {
                continue;
            }
            $title = $video['title'][$languageIndex] ?? $video['title'][0] ?? $fallbackTitle;
            $modules[] = ['title' => (string) $title, 'url' => $embedUrl, 'type' => 'embed'];
        }
    }
    if ($modules) {
        return $modules;
    }

    if (!empty($course['youtube'])) {
        $embedUrl = youtube_embed_url((string) $course['youtube']);
        if ($embedUrl !== null) {
            return [[
                'title' => $course['title'][$languageIndex] ?? $fallbackTitle,
                'url' => $embedUrl,
                'type' => 'embed',
            ]];
        }
    }
    if (!empty($course['video'])) {
        return [[
            'title' => $course['title'][$languageIndex] ?? $fallbackTitle,
            'url' => (string) $course['video'],
            'type' => 'video',
        ]];
    }
    return [];
}

//Parámetro GET como texto (ignora arrays como ?x[]=1).
function param(string $key): string
{
    $value = $_GET[$key] ?? '';
    return is_string($value) ? $value : '';
}

function current_lang(): string
{
    return param('lang') === 'en' ? 'en' : 'es';
}

//Escapa texto para HTML (evita XSS).
function h(string $text): string
{
    return htmlspecialchars($text, ENT_QUOTES, 'UTF-8');
}
