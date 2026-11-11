<?php
// Página de un curso renderizada en el servidor: curso.php?id=forms&lang=es
declare(strict_types=1);
require __DIR__ . '/includes/data.php';
require_once __DIR__ . '/includes/app.php';
require_once __DIR__ . '/includes/db.php';

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

$lang = current_lang();
$i = $lang === 'en' ? 1 : 0;
$other = $i ? 'es' : 'en';
$course = find_course(param('id'));
if ($course === null) {
    http_response_code(404);
}
$user = null;
$isEnrolled = false;
start_app_session();
header('Cache-Control: private, no-store');
$user = authenticated_user();
if ($course !== null && $user !== null) {
    try {
        $statement = database()->prepare(
            'SELECT 1 FROM course_enrollments WHERE user_id = :user_id AND course_id = :course_id'
        );
        $statement->execute(['user_id' => $user['id'], 'course_id' => $course['id']]);
        $isEnrolled = $statement->fetchColumn() !== false;
    } catch (PDOException | RuntimeException $error) {
        error_log('Could not check course enrollment: ' . $error->getMessage());
        http_response_code(500);
        exit('No se pudo verificar la inscripción al curso. Inténtalo más tarde.');
    }
}

$ui = [
    'back' => ['Volver a los cursos', 'Back to courses'],
    'goal' => ['Objetivo', 'Goal'],
    'topics' => ['Material del curso', 'Course material'],
    'for' => ['Ideal para', 'Great for'],
    'hours' => ['horas', 'hours'],
    'none' => ['Curso no encontrado.', 'Course not found.'],
    'videos' => ['Videos del curso', 'Course videos'],
    'step' => ['Paso', 'Step'],
    'of' => ['de', 'of'],
    'previous' => ['Anterior', 'Previous'],
    'next' => ['Siguiente', 'Next'],
    'video_fallback' => ['Tu navegador no soporta la reproducción de video.', 'Your browser does not support video playback.'],
    'outcomes' => ['Al terminar podrás', 'By the end, you will be able to'],
    'requirements' => ['Antes de comenzar', 'Before you begin'],
    'quiz' => ['Comprueba lo aprendido', 'Check what you learned'],
    'check' => ['Revisar respuesta', 'Check answer'],
    'choose' => ['Elige una respuesta antes de continuar.', 'Choose an answer before continuing.'],
    'correct' => ['¡Correcto!', 'Correct!'],
    'incorrect' => ['Aún no. La respuesta correcta es:', 'Not quite. The correct answer is:'],
    'answer' => ['Respuesta correcta', 'Correct answer'],
    'progress' => ['Tu progreso', 'Your progress'],
    'login_to_save' => ['Inicia sesión con Google para guardar tu progreso', 'Sign in with Google to save your progress'],
    'mark_complete' => ['Marcar curso como completado', 'Mark course as completed'],
    'completed' => ['Curso completado', 'Course completed'],
    'saving' => ['Guardando progreso...', 'Saving progress...'],
    'progress_error' => ['No se pudo cargar o guardar el progreso. Inténtalo de nuevo.', 'Could not load or save progress. Please try again.'],
    'enroll_heading' => ['Inscripción al curso', 'Course enrollment'],
    'enroll_intro' => ['Regístrate para acceder a los videos, actividades y progreso del curso.', 'Enroll to access the course videos, activities, and progress.'],
    'enroll_action' => ['Registrarme a curso', 'Enroll in course'],
    'enroll_saving' => ['Registrando tu inscripción...', 'Enrolling you...'],
    'enroll_error' => ['No se pudo registrar tu inscripción. Inténtalo de nuevo.', 'Could not enroll you. Please try again.'],
];
$levels = ['basico' => ['Básico', 'Beginner'], 'intermedio' => ['Intermedio', 'Intermediate'], 'avanzado' => ['Avanzado', 'Advanced']];
$audiences = ['maestros' => ['Maestros', 'Teachers'], 'alumnos' => ['Alumnos', 'Students'], 'general' => ['Público general', 'General public']];

$videoModules = [];
if ($course !== null && isset($course['canvaVideos']) && is_array($course['canvaVideos'])) {
    foreach ($course['canvaVideos'] as $video) {
        if (!is_array($video) || !is_string($video['url'] ?? null)) {
            continue;
        }
        $embedUrl = canva_embed_url($video['url']);
        if ($embedUrl === null) {
            continue;
        }
        $title = $video['title'][$i] ?? $video['title'][0] ?? $ui['videos'][$i];
        $videoModules[] = ['title' => (string) $title, 'url' => $embedUrl, 'type' => 'embed'];
    }
}
if ($course !== null && !$videoModules && !empty($course['youtube'])) {
    $embedUrl = youtube_embed_url((string) $course['youtube']);
    if ($embedUrl !== null) {
        $videoModules[] = [
            'title' => $course['title'][$i],
            'url' => $embedUrl,
            'type' => 'embed',
        ];
    }
}
if ($course !== null && !$videoModules && !empty($course['video'])) {
    $videoModules[] = [
        'title' => $course['title'][$i],
        'url' => (string) $course['video'],
        'type' => 'video',
    ];
}
?>
<!DOCTYPE html>
<html lang="<?= $lang ?>" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title><?= $course ? h($course['title'][$i]) . ' | ' : '' ?>GTools Academy</title>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@600;700&family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="css/styles.css">
  <script>try { document.documentElement.dataset.theme = JSON.parse(localStorage.getItem('theme')) || 'dark'; } catch (e) {}</script>
  <script src="js/course.js" defer></script>
</head>
<body>
<header class="course-navbar">
  <div class="container d-flex flex-wrap align-items-center gap-3 py-3">
    <a class="brand" href="index.html">GTools Academy</a>
    <nav class="ms-auto d-flex align-items-center gap-2" aria-label="Course navigation">
      <a class="btn btn-outline-light btn-sm" href="index.html#cursos"><?= h($ui['back'][$i]) ?></a>
      <?php if ($course): ?><a class="btn btn-light btn-sm" href="?id=<?= h($course['id']) ?>&amp;lang=<?= $other ?>"><?= strtoupper($other) ?></a><?php endif; ?>
    </nav>
  </div>
</header>
<main class="container course-main py-4 py-lg-5">
<?php if ($course === null): ?>
  <p class="empty"><?= h($ui['none'][$i]) ?></p>
<?php else: ?>
  <article class="course-page">
    <header class="course-intro card border-0 shadow-sm mb-4">
      <div class="card-body p-4 p-md-5">
        <div class="d-flex flex-wrap align-items-start gap-3">
          <span class="course-icon rounded-4 p-3" aria-hidden="true"><?= h($course['icon']) ?></span>
          <div class="flex-grow-1">
            <div class="d-flex flex-wrap gap-2 mb-2">
              <span class="badge rounded-pill text-bg-primary"><?= h($levels[$course['level']][$i]) ?></span>
              <span class="badge rounded-pill course-badge"><?= (int) $course['hours'] ?> <?= h($ui['hours'][$i]) ?></span>
            </div>
            <h1 class="display-5 fw-bold"><?= h($course['title'][$i]) ?></h1>
            <p class="lead course-lead mb-0"><?= h($course['desc'][$i]) ?></p>
          </div>
        </div>
      </div>
    </header>

    <section class="course-goal card border-0 shadow-sm mb-4">
      <div class="card-body p-4">
        <div class="row g-4">
          <div class="col-lg-8">
            <span class="section-kicker"><?= h($ui['goal'][$i]) ?></span>
            <h2 class="h4 mt-2"><?= h($ui['goal'][$i]) ?></h2>
            <p class="mb-0"><?= h($course['goal'][$i]) ?></p>
          </div>
          <?php if (!empty($course['requirements'][$i])): ?>
            <div class="col-lg-4 course-prerequisite">
              <h3 class="h6"><?= h($ui['requirements'][$i]) ?></h3>
              <p class="mb-0"><?= h($course['requirements'][$i]) ?></p>
            </div>
          <?php endif; ?>
        </div>
      </div>
    </section>

    <?php if (!$isEnrolled): ?>
      <section class="course-enrollment card border-0 shadow-sm mb-4" data-course-enrollment
        data-course-id="<?= h($course['id']) ?>"
        data-login-url="api/auth.php?action=login&amp;mode=register&amp;course_id=<?= rawurlencode($course['id']) ?>&amp;enroll_course_id=<?= rawurlencode($course['id']) ?>&amp;lang=<?= h($lang) ?>">
        <div class="card-body p-4">
          <h2 class="h4"><?= h($ui['enroll_heading'][$i]) ?></h2>
          <p class="note"><?= h($ui['enroll_intro'][$i]) ?></p>
          <p class="note" data-enrollment-status role="status" aria-live="polite"></p>
          <?php if ($user !== null): ?>
            <button type="button" class="btn btn-primary" data-course-enroll
              data-label-enroll="<?= h($ui['enroll_action'][$i]) ?>"
              data-label-saving="<?= h($ui['enroll_saving'][$i]) ?>"
              data-label-error="<?= h($ui['enroll_error'][$i]) ?>"><?= h($ui['enroll_action'][$i]) ?></button>
          <?php else: ?>
            <a class="btn btn-primary" href="api/auth.php?action=login&amp;mode=register&amp;course_id=<?= rawurlencode($course['id']) ?>&amp;enroll_course_id=<?= rawurlencode($course['id']) ?>&amp;lang=<?= h($lang) ?>"><?= h($ui['enroll_action'][$i]) ?></a>
          <?php endif; ?>
        </div>
      </section>
    <?php else: ?>
    <?php if ($videoModules): ?>
      <section class="course-journey card border-0 shadow-sm mb-4" aria-labelledby="course-videos-title">
        <div class="card-body p-4 p-lg-5">
          <div class="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
            <div>
              <span class="section-kicker"><?= h($ui['step'][$i]) ?> 1 <?= h($ui['of'][$i]) ?> <?= count($videoModules) ?></span>
              <h2 class="h3 mt-2 mb-0" id="course-videos-title"><?= h($ui['videos'][$i]) ?></h2>
            </div>
          </div>
          <div class="journey-progress progress mb-4" role="progressbar" aria-label="<?= h($ui['videos'][$i]) ?>" aria-valuemin="1" aria-valuemax="<?= count($videoModules) ?>" aria-valuenow="1">
            <div class="progress-bar" data-module-progress style="width: <?= 100 / count($videoModules) ?>%"></div>
          </div>
          <div class="journey-layout">
          <nav class="journey-steps" aria-label="<?= h($ui['videos'][$i]) ?>">
            <?php foreach ($videoModules as $index => $module): ?>
              <button type="button" class="journey-step card w-100 text-start" data-module-index="<?= $index ?>" data-module-url="<?= h($module['url']) ?>" data-module-type="<?= h($module['type']) ?>" data-module-title="<?= h($module['title']) ?>" aria-current="<?= $index === 0 ? 'step' : 'false' ?>">
                <span class="step-num badge rounded-circle"><?= $index + 1 ?></span>
                <span class="journey-step-title"><?= h($module['title']) ?></span>
                <span class="journey-step-status"><?= $i === 0 ? 'Ver módulo' : 'Watch module' ?></span>
              </button>
            <?php endforeach; ?>
          </nav>
          <div class="journey-content">
            <p class="journey-counter" data-module-counter><?= h($ui['step'][$i]) ?> 1 <?= h($ui['of'][$i]) ?> <?= count($videoModules) ?></p>
            <h3 class="h4 mb-3" data-module-heading><?= h($videoModules[0]['title']) ?></h3>
            <div class="course-video-wrapper ratio ratio-16x9">
              <?php if ($videoModules[0]['type'] === 'embed'): ?>
                <iframe data-course-frame src="<?= h($videoModules[0]['url']) ?>" title="<?= h($videoModules[0]['title']) ?>" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen></iframe>
              <?php else: ?>
                <video data-course-video controls playsinline>
                  <source src="<?= h($videoModules[0]['url']) ?>" type="video/mp4">
                  <?= h($ui['video_fallback'][$i]) ?>
                </video>
              <?php endif; ?>
            </div>
            <div class="journey-controls">
              <button type="button" class="btn btn-outline-secondary" data-module-previous disabled><?= h($ui['previous'][$i]) ?></button>
              <button type="button" class="btn btn-primary" data-module-next <?= count($videoModules) < 2 ? 'hidden' : '' ?>><?= h($ui['next'][$i]) ?></button>
            </div>
          </div>
        </div>
        </div>
      </section>
    <?php endif; ?>

    <?php if (!empty($course['learning_outcomes'][$i])): ?>
      <section class="course-outcomes card border-0 shadow-sm mb-4">
        <div class="card-body p-4">
        <span class="section-kicker"><?= h($ui['outcomes'][$i]) ?></span>
        <h2 class="h4 mt-2"><?= h($ui['outcomes'][$i]) ?></h2>
        <ul class="outcomes-list">
          <?php foreach ($course['learning_outcomes'][$i] as $outcome): ?><li><?= h($outcome) ?></li><?php endforeach; ?>
        </ul>
        </div>
      </section>
    <?php endif; ?>

    <section class="course-material card border-0 shadow-sm mb-4">
      <div class="card-body p-4 p-lg-5">
      <span class="section-kicker"><?= h($ui['topics'][$i]) ?></span>
      <h2 class="h3 mt-2"><?= h($ui['topics'][$i]) ?></h2>
      <div class="modules-container">
        <?php foreach ($course['topics'][$i] as $index => $topic): ?>
          <?php $topicParts = preg_split('/\s+-\s+/', $topic, 2); ?>
          <details class="module-step card">
            <summary><span class="step-num badge rounded-circle"><?= $index + 1 ?></span><span class="step-content"><?= h($topicParts[0]) ?></span></summary>
            <p><?= h($topicParts[1] ?? ($i === 0 ? 'Prueba este tema en tu cuenta y anota cómo lo aplicarías.' : 'Try this topic in your account and note how you would apply it.')) ?></p>
          </details>
        <?php endforeach; ?>
      </div>
      </div>
    </section>

    <?php if (!empty($course['quiz']) && is_array($course['quiz'])): ?>
      <section class="course-quiz card border-0 shadow-sm mb-4">
        <div class="card-body p-4 p-lg-5">
        <span class="section-kicker"><?= h($ui['quiz'][$i]) ?></span>
        <h2 class="h3 mt-2 mb-4">🧠 <?= h($ui['quiz'][$i]) ?></h2>
        <div class="row g-3">
        <?php foreach ($course['quiz'] as $index => $question): ?>
          <article class="quiz-card card col-12 col-md-6 col-lg-4" data-quiz-card data-answer="<?= (int) $question['answer'] ?>">
            <div class="card-body">
            <h3 class="h5"><?= h($question['title'][$i]) ?></h3>
            <p><?= h($question['text'][$i]) ?></p>
            <fieldset>
              <legend><?= h($question['question'][$i]) ?></legend>
              <?php foreach ($question['options'] as $optionIndex => $option): ?>
                <label class="quiz-option">
                  <input type="radio" name="quiz-<?= h($course['id']) ?>-<?= $index ?>" value="<?= $optionIndex ?>">
                  <?= h($option[$i]) ?>
                </label>
              <?php endforeach; ?>
            </fieldset>
            <button type="button" class="btn btn-outline-primary" data-quiz-check><?= h($ui['check'][$i]) ?></button>
            <p class="quiz-feedback note" data-feedback data-choose="<?= h($ui['choose'][$i]) ?>" data-correct="<?= h($ui['correct'][$i]) ?>" data-incorrect="<?= h($ui['incorrect'][$i]) ?>" data-answer-label="<?= h($ui['answer'][$i]) ?>" data-explanation="<?= h($question['feedback'][$i]) ?>" data-correct-option="<?= h($question['options'][$question['answer']][$i]) ?>" role="status" aria-live="polite"></p>
            </div>
          </article>
        <?php endforeach; ?>
        </div>
        </div>
      </section>
    <?php endif; ?>
    <?php endif; ?>

    <section class="course-for card border-0 shadow-sm">
      <div class="card-body p-4">
        <h2 class="h5"><?= h($ui['for'][$i]) ?></h2>
        <p class="meta mb-0"><?php foreach ($course['audience'] as $a): ?><span class="badge rounded-pill course-badge"><?= h($audiences[$a][$i]) ?></span><?php endforeach; ?></p>
      </div>
    </section>

    <?php if ($isEnrolled): ?>
    <section class="course-progress card border-0 shadow-sm mt-4" data-course-progress
      data-course-id="<?= h($course['id']) ?>"
      data-login-url="api/auth.php?action=login&amp;course_id=<?= rawurlencode($course['id']) ?>&amp;lang=<?= h($lang) ?>">
      <div class="card-body p-4">
        <h2 class="h5"><?= h($ui['progress'][$i]) ?></h2>
        <p class="note" data-progress-status role="status" aria-live="polite"></p>
        <button type="button" class="btn btn-primary" data-course-complete disabled
          data-label-login="<?= h($ui['login_to_save'][$i]) ?>"
          data-label-complete="<?= h($ui['mark_complete'][$i]) ?>"
          data-label-completed="<?= h($ui['completed'][$i]) ?>"
          data-label-saving="<?= h($ui['saving'][$i]) ?>"
          data-label-error="<?= h($ui['progress_error'][$i]) ?>"><?= h($ui['saving'][$i]) ?></button>
      </div>
    </section>
    <?php endif; ?>
  </article>
<?php endif; ?>
</main>
</body>
</html>
