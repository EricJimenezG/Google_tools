<?php
// Página de un curso renderizada en el servidor: curso.php?id=forms&lang=es
declare(strict_types=1);
require __DIR__ . '/includes/data.php';
require_once __DIR__ . '/includes/app.php';
require_once __DIR__ . '/includes/db.php';

$lang = current_lang();
$i = $lang === 'en' ? 1 : 0;
$other = $i ? 'es' : 'en';
$course = find_course(param('id'));
if ($course === null) {
    http_response_code(404);
}
$user = null;
$isEnrolled = false;
$isCompleted = false;
start_app_session();
header('Cache-Control: private, no-store');
$user = authenticated_user();
if ($course !== null && $user !== null) {
    try {
        $pdo = database();
        $statement = $pdo->prepare(
            'SELECT 1 FROM course_enrollments WHERE user_id = :user_id AND course_id = :course_id'
        );
        $statement->execute(['user_id' => $user['id'], 'course_id' => $course['id']]);
        $isEnrolled = $statement->fetchColumn() !== false;
        $statement = $pdo->prepare(
            'SELECT 1 FROM course_progress WHERE user_id = :user_id AND course_id = :course_id'
        );
        $statement->execute(['user_id' => $user['id'], 'course_id' => $course['id']]);
        $isCompleted = $statement->fetchColumn() !== false;
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
    'start_videos' => ['Ver videos del curso', 'Watch course videos'],
    'review_videos' => ['Revisar videos', 'Review videos'],
    'video_stage_intro' => ['Completa cada video para desbloquear la evaluación del curso.', 'Complete each video to unlock the course assessment.'],
    'video_review_intro' => ['Ya completaste los videos. Puedes volver a reproducirlos aquí.', 'You completed the videos. You can play them again here.'],
    'video_done_action' => ['Marcar video como visto y continuar', 'Mark video as watched and continue'],
    'video_saving' => ['Guardando avance...', 'Saving progress...'],
    'video_progress_error' => ['No se pudo guardar el avance del video. Inténtalo de nuevo.', 'Could not save video progress. Please try again.'],
    'videos_finished' => ['¡Terminaste todos los videos!', 'You finished all the videos!'],
    'videos_unavailable' => ['Este curso aún no tiene videos configurados.', 'This course does not have any videos configured yet.'],
    'assessment' => ['Evaluación', 'Assessment'],
    'start_assessment' => ['Presentar evaluación', 'Take the assessment'],
    'review_assessment' => ['Revisar evaluación', 'Review assessment'],
    'assessment_locked' => ['Completa todos los videos para desbloquear la evaluación.', 'Complete all videos to unlock the assessment.'],
    'assessment_unavailable' => ['Este curso aún no tiene evaluación configurada.', 'This course does not have an assessment configured yet.'],
    'assessment_progress' => ['Pregunta {current} de {total}', 'Question {current} of {total}'],
    'question_weight' => ['Valor: {weight}% de la evaluación', 'Value: {weight}% of the assessment'],
    'previous_question' => ['Pregunta anterior', 'Previous question'],
    'next_question' => ['Siguiente pregunta', 'Next question'],
    'show_result' => ['Ver resultado', 'See results'],
    'assessment_choose' => ['Selecciona una respuesta antes de continuar.', 'Select an answer before continuing.'],
    'assessment_saving' => ['Calificando evaluación...', 'Submitting assessment...'],
    'assessment_error' => ['No se pudo calificar la evaluación. Verifica tu conexión e inténtalo de nuevo.', 'Could not submit the assessment. Check your connection and try again.'],
    'assessment_passed' => ['¡Aprobaste la evaluación y completaste el curso!', 'You passed the assessment and completed the course!'],
    'assessment_failed' => ['Aún no aprobaste la evaluación. Revisa la retroalimentación e inténtalo de nuevo.', 'You did not pass this assessment yet. Review the feedback and try again.'],
    'assessment_score' => ['Resultado: {percentage}% ({correct} de {total} respuestas correctas)', 'Score: {percentage}% ({correct} of {total} correct answers)'],
    'assessment_required' => ['Se requieren al menos {required} respuestas correctas para aprobar.', 'At least {required} correct answers are required to pass.'],
    'assessment_review_title' => ['Resumen de evaluación', 'Assessment review'],
    'your_answer' => ['Tu respuesta', 'Your answer'],
    'correct_answer' => ['Respuesta correcta', 'Correct answer'],
    'question_correct' => ['Correcta', 'Correct'],
    'question_incorrect' => ['Incorrecta', 'Incorrect'],
    'assessment_retry' => ['Intentar de nuevo', 'Try again'],
    'assessment_completed' => ['Este curso ya está completado. Puedes revisar tus respuestas y el material cuando quieras.', 'This course is complete. You can review your answers and course material anytime.'],
    'view_recognition' => ['Ver reconocimiento del curso', 'View course recognition'],
    'back_to_course' => ['Volver al curso', 'Back to course'],
    'video_step' => ['Video {current} de {total}', 'Video {current} of {total}'],
    'step' => ['Paso', 'Step'],
    'of' => ['de', 'of'],
    'previous' => ['Anterior', 'Previous'],
    'next' => ['Siguiente', 'Next'],
    'video_fallback' => ['Tu navegador no soporta la reproducción de video.', 'Your browser does not support video playback.'],
    'outcomes' => ['Al terminar podrás', 'By the end, you will be able to'],
    'requirements' => ['Antes de comenzar', 'Before you begin'],
    'quiz' => ['Comprueba lo aprendido', 'Check what you learned'],
    'progress' => ['Tu progreso', 'Your progress'],
    'completed' => ['Curso completado', 'Course completed'],
    'in_progress' => ['Curso en progreso. Aprueba la evaluación para completarlo.', 'Course in progress. Pass the assessment to complete it.'],
    'progress_error' => ['No se pudo cargar el progreso. Inténtalo de nuevo.', 'Could not load progress. Please try again.'],
    'enroll_heading' => ['Inscripción al curso', 'Course enrollment'],
    'enroll_intro' => ['Regístrate para acceder a los videos, actividades y progreso del curso.', 'Enroll to access the course videos, activities, and progress.'],
    'enroll_action' => ['Registrarme a curso', 'Enroll in course'],
    'enroll_saving' => ['Registrando tu inscripción...', 'Enrolling you...'],
    'enroll_error' => ['No se pudo registrar tu inscripción. Inténtalo de nuevo.', 'Could not enroll you. Please try again.'],
    'unenroll_action' => ['Darme de baja del curso', 'Unenroll from course'],
    'unenroll_confirm' => ['¿Quieres darte de baja de este curso?', 'Are you sure you want to unenroll from this course?'],
    'unenroll_saving' => ['Cancelando inscripción...', 'Unenrolling...'],
    'unenroll_error' => ['No se pudo cancelar la inscripción. Inténtalo de nuevo.', 'Could not unenroll from the course. Please try again.'],
    'unenroll_completed' => ['No puedes darte de baja de un curso completado.', 'You cannot unenroll from a completed course.'],
];
$levels = ['basico' => ['Básico', 'Beginner'], 'intermedio' => ['Intermedio', 'Intermediate'], 'avanzado' => ['Avanzado', 'Advanced']];
$audiences = ['maestros' => ['Maestros', 'Teachers'], 'alumnos' => ['Alumnos', 'Students'], 'general' => ['Público general', 'General public']];

$videoModules = [];
if ($course !== null) {
    $videoModules = course_video_modules($course, $lang, $ui['videos'][$i]);
}
$stage = param('stage');
if (!in_array($stage, ['videos', 'assessment'], true)) {
    $stage = 'overview';
}
if (!$isEnrolled) {
    $stage = 'overview';
}
$completedVideoIndexes = [];
$videosCompleted = count($videoModules) === 0;
if ($isEnrolled && $course !== null && $videoModules) {
    try {
        $statement = $pdo->prepare(
            'SELECT module_index FROM course_video_progress WHERE user_id = :user_id AND course_id = :course_id'
        );
        $statement->execute(['user_id' => $user['id'], 'course_id' => $course['id']]);
        $completedVideoIndexes = array_map('intval', array_column($statement->fetchAll(), 'module_index'));
        $nextVideoIndex = 0;
        while (
            $nextVideoIndex < count($videoModules) &&
            in_array($nextVideoIndex, $completedVideoIndexes, true)
        ) {
            $nextVideoIndex++;
        }
        $videosCompleted = $nextVideoIndex >= count($videoModules);
    } catch (PDOException | RuntimeException $error) {
        error_log('Could not check course video progress: ' . $error->getMessage());
        http_response_code(500);
        exit('No se pudo verificar el progreso de los videos. Ejecuta las migraciones de la base de datos e inténtalo más tarde.');
    }
}
$nextVideoIndex = 0;
while (
    $nextVideoIndex < count($videoModules) &&
    in_array($nextVideoIndex, $completedVideoIndexes, true)
) {
    $nextVideoIndex++;
}
$completedVideoCount = count(array_unique($completedVideoIndexes));
$hasAssessment = $course !== null && course_has_assessment($course);
$assessmentResult = null;
if ($isEnrolled && $hasAssessment) {
    try {
        $statement = $pdo->prepare(
            'SELECT review_json FROM course_assessment_results
             WHERE user_id = :user_id AND course_id = :course_id'
        );
        $statement->execute(['user_id' => $user['id'], 'course_id' => $course['id']]);
        $reviewJson = $statement->fetchColumn();
        if (is_string($reviewJson)) {
            $assessmentResult = json_decode($reviewJson, true);
            if (!is_array($assessmentResult) || !is_array($assessmentResult['questions'] ?? null)) {
                throw new RuntimeException('El resultado guardado de la evaluación no es válido.');
            }
        }
    } catch (PDOException | RuntimeException $error) {
        error_log('Could not load course assessment review: ' . $error->getMessage());
        http_response_code(500);
        exit('No se pudo cargar el resultado de la evaluación. Ejecuta las migraciones de la base de datos e inténtalo más tarde.');
    }
}
if ($hasAssessment) {
    $isCompleted = $assessmentResult !== null;
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
  <link rel="stylesheet" href="css/styles.css?v=course-theme-2">
  <script>try { document.documentElement.dataset.theme = JSON.parse(localStorage.getItem('theme')) || 'dark'; } catch (e) {}</script>
  <script src="js/course.js?v=<?= (int) filemtime(__DIR__ . '/js/course.js') ?>" defer></script>
</head>
<body>
<header class="course-navbar">
  <div class="container d-flex flex-wrap align-items-center gap-3 py-3">
    <a class="brand" href="index.html">GTools Academy</a>
    <nav class="ms-auto d-flex align-items-center gap-2" aria-label="Course navigation">
      <a class="btn btn-outline-light btn-sm" href="index.html#cursos"><?= h($ui['back'][$i]) ?></a>
      <?php if ($course): ?><a class="btn btn-light btn-sm" href="?id=<?= h($course['id']) ?><?= $stage !== 'overview' ? '&amp;stage=' . rawurlencode($stage) : '' ?>&amp;lang=<?= $other ?>"><?= strtoupper($other) ?></a><?php endif; ?>
    </nav>
  </div>
</header>
<main class="container course-main py-4 py-lg-5">
<?php if ($course === null): ?>
  <p class="empty"><?= h($ui['none'][$i]) ?></p>
<?php else: ?>
  <article class="course-page">
    <?php if ($stage === 'overview'): ?>
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

    <?php else: ?>
      <header class="course-stage-intro card border-0 shadow-sm mb-4">
        <div class="card-body">
          <a class="btn btn-outline-secondary btn-sm" href="curso.php?id=<?= rawurlencode($course['id']) ?>&amp;lang=<?= h($lang) ?>"><?= h($ui['back_to_course'][$i]) ?></a>
          <h1 class="h2 mt-3 mb-0"><?= h($course['title'][$i]) ?></h1>
          <p class="note mt-2 mb-0"><?= h($stage === 'videos'
              ? ($videosCompleted ? $ui['video_review_intro'][$i] : $ui['video_stage_intro'][$i])
              : $ui['assessment'][$i]) ?></p>
        </div>
      </header>
    <?php endif; ?>

    <?php if ($stage === 'overview'): ?>
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
    <?php endif; ?>

    <?php if ($stage === 'overview'): ?>
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

    <?php endif; ?>

    <?php if ($stage === 'overview'): ?>
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
    <?php endif; ?>

    <?php if ($stage === 'overview' && !$isEnrolled): ?>
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
    <?php elseif ($stage === 'overview' && $isEnrolled): ?>
      <section class="course-access card border-0 shadow-sm mb-4">
        <div class="card-body">
          <span class="section-kicker"><?= h($ui['progress'][$i]) ?></span>
          <h2 class="h3 mt-2"><?= h($ui['topics'][$i]) ?></h2>
          <div class="course-access-actions">
            <?php if ($videoModules): ?>
              <a class="btn btn-primary" href="curso.php?id=<?= rawurlencode($course['id']) ?>&amp;stage=videos&amp;lang=<?= h($lang) ?>"><?= h(($videosCompleted ? $ui['review_videos'] : $ui['start_videos'])[$i]) ?></a>
              <?php
                $videoStatus = $videosCompleted
                    ? $ui['videos_finished'][$i]
                    : str_replace(
                        ['{current}', '{total}'],
                        [(string) min($completedVideoCount + 1, count($videoModules)), (string) count($videoModules)],
                        $ui['video_step'][$i]
                    );
              ?>
              <p class="course-access-status note mb-0"><?= h($videoStatus) ?></p>
            <?php endif; ?>
            <?php if ($hasAssessment && $videosCompleted): ?>
              <a class="btn btn-outline-primary" href="curso.php?id=<?= rawurlencode($course['id']) ?>&amp;stage=assessment&amp;lang=<?= h($lang) ?>"><?= h(($assessmentResult ? $ui['review_assessment'] : $ui['start_assessment'])[$i]) ?></a>
              <?php if ($assessmentResult): ?>
                <a class="btn btn-primary" href="reconocimiento.php?id=<?= rawurlencode($course['id']) ?>&amp;lang=<?= h($lang) ?>"><?= h($ui['view_recognition'][$i]) ?></a>
              <?php endif; ?>
            <?php elseif ($hasAssessment): ?>
              <p class="course-access-status note mb-0"><?= h($ui['assessment_locked'][$i]) ?></p>
            <?php else: ?>
              <p class="course-access-status note mb-0"><?= h($ui['assessment_unavailable'][$i]) ?></p>
            <?php endif; ?>
          </div>
        </div>
      </section>
    <?php elseif ($stage === 'videos'): ?>
      <section class="course-journey course-video-stage card border-0 shadow-sm mb-4" aria-labelledby="course-videos-title">
        <div class="card-body p-4 p-lg-5">
          <h2 class="h3" id="course-videos-title"><?= h($ui['videos'][$i]) ?></h2>
          <?php if (!$videoModules): ?>
            <p class="note"><?= h($ui['videos_unavailable'][$i]) ?></p>
          <?php elseif ($videosCompleted): ?>
            <h3 class="h4 mt-4"><?= h($ui['videos_finished'][$i]) ?></h3>
            <div class="course-video-review-list">
              <?php foreach ($videoModules as $module): ?>
                <article class="course-video-review-item">
                  <h4 class="h5"><?= h($module['title']) ?></h4>
                  <div class="course-video-wrapper course-video-stage-player ratio ratio-16x9">
                    <?php if ($module['type'] === 'embed'): ?>
                      <iframe src="<?= h($module['url']) ?>" title="<?= h($module['title']) ?>" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen></iframe>
                    <?php else: ?>
                      <video controls playsinline>
                        <source src="<?= h($module['url']) ?>" type="video/mp4">
                        <?= h($ui['video_fallback'][$i]) ?>
                      </video>
                    <?php endif; ?>
                  </div>
                </article>
              <?php endforeach; ?>
            </div>
            <?php if ($hasAssessment): ?>
              <a class="btn btn-primary mt-2" href="curso.php?id=<?= rawurlencode($course['id']) ?>&amp;stage=assessment&amp;lang=<?= h($lang) ?>"><?= h(($assessmentResult ? $ui['review_assessment'] : $ui['start_assessment'])[$i]) ?></a>
            <?php endif; ?>
          <?php else: ?>
            <?php $currentModule = $videoModules[$nextVideoIndex]; ?>
            <p class="journey-counter"><?= h(str_replace(
                ['{current}', '{total}'],
                [(string) ($nextVideoIndex + 1), (string) count($videoModules)],
                $ui['video_step'][$i]
            )) ?></p>
            <div class="journey-progress progress mb-4" role="progressbar" aria-label="<?= h($ui['videos'][$i]) ?>" aria-valuemin="0" aria-valuemax="<?= count($videoModules) ?>" aria-valuenow="<?= $nextVideoIndex ?>">
              <div class="progress-bar" style="width: <?= ($nextVideoIndex / count($videoModules)) * 100 ?>%"></div>
            </div>
            <h3 class="h4 mb-3"><?= h($currentModule['title']) ?></h3>
            <div class="course-video-wrapper course-video-stage-player ratio ratio-16x9">
              <?php if ($currentModule['type'] === 'embed'): ?>
                <iframe src="<?= h($currentModule['url']) ?>" title="<?= h($currentModule['title']) ?>" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen></iframe>
              <?php else: ?>
                <video data-course-video controls playsinline>
                  <source src="<?= h($currentModule['url']) ?>" type="video/mp4">
                  <?= h($ui['video_fallback'][$i]) ?>
                </video>
              <?php endif; ?>
            </div>
            <p class="note" data-video-progress-status role="status" aria-live="polite"></p>
            <button type="button" class="btn btn-primary" data-complete-video
              data-course-id="<?= h($course['id']) ?>"
              data-module-index="<?= $nextVideoIndex ?>"
              data-next-url="curso.php?id=<?= rawurlencode($course['id']) ?>&amp;stage=videos&amp;lang=<?= h($lang) ?>"
              data-assessment-url="<?= $hasAssessment ? 'curso.php?id=' . rawurlencode($course['id']) . '&amp;stage=assessment&amp;lang=' . h($lang) : '' ?>"
              data-overview-url="curso.php?id=<?= rawurlencode($course['id']) ?>&amp;lang=<?= h($lang) ?>"
              data-label-next="<?= h($ui['video_done_action'][$i]) ?>"
              data-label-saving="<?= h($ui['video_saving'][$i]) ?>"
              data-label-error="<?= h($ui['video_progress_error'][$i]) ?>"
              <?= $currentModule['type'] === 'video' ? 'disabled' : '' ?>><?= h($ui['video_done_action'][$i]) ?></button>
          <?php endif; ?>
        </div>
      </section>
    <?php elseif ($stage === 'assessment'): ?>
      <?php if (!$videosCompleted): ?>
        <section class="course-access course-assessment-locked card border-0 shadow-sm mb-4">
          <div class="card-body">
            <h2 class="h4"><?= h($ui['assessment_locked'][$i]) ?></h2>
            <a class="btn btn-primary" href="curso.php?id=<?= rawurlencode($course['id']) ?>&amp;stage=videos&amp;lang=<?= h($lang) ?>"><?= h($ui['start_videos'][$i]) ?></a>
          </div>
        </section>
      <?php elseif (!$hasAssessment): ?>
        <section class="course-access card border-0 shadow-sm mb-4">
          <div class="card-body"><p class="note mb-0"><?= h($ui['assessment_unavailable'][$i]) ?></p></div>
        </section>
      <?php else: ?>
      <section class="course-quiz course-assessment-stage card border-0 shadow-sm mb-4"
        data-course-assessment
        data-course-id="<?= h($course['id']) ?>"
        data-lang="<?= h($lang) ?>"
        data-recognition-url="reconocimiento.php?id=<?= rawurlencode($course['id']) ?>&amp;lang=<?= h($lang) ?>"
        data-label-progress="<?= h($ui['assessment_progress'][$i]) ?>"
        data-label-weight="<?= h($ui['question_weight'][$i]) ?>"
        data-label-next="<?= h($ui['next_question'][$i]) ?>"
        data-label-submit="<?= h($ui['show_result'][$i]) ?>"
        data-label-choose="<?= h($ui['assessment_choose'][$i]) ?>"
        data-label-saving="<?= h($ui['assessment_saving'][$i]) ?>"
        data-label-error="<?= h($ui['assessment_error'][$i]) ?>"
        data-label-passed="<?= h($ui['assessment_passed'][$i]) ?>"
        data-label-failed="<?= h($ui['assessment_failed'][$i]) ?>"
        data-label-score="<?= h($ui['assessment_score'][$i]) ?>"
        data-label-required="<?= h($ui['assessment_required'][$i]) ?>"
        data-label-review-title="<?= h($ui['assessment_review_title'][$i]) ?>"
        data-label-your-answer="<?= h($ui['your_answer'][$i]) ?>"
        data-label-correct-answer="<?= h($ui['correct_answer'][$i]) ?>"
        data-label-correct="<?= h($ui['question_correct'][$i]) ?>"
        data-label-incorrect="<?= h($ui['question_incorrect'][$i]) ?>"
        data-label-retry="<?= h($ui['assessment_retry'][$i]) ?>"
        data-label-completed="<?= h($ui['assessment_completed'][$i]) ?>">
        <div class="card-body p-4 p-lg-5">
          <span class="section-kicker"><?= h($ui['quiz'][$i]) ?></span>
          <h2 class="h3 mt-2 mb-4">🧠 <?= h($ui['quiz'][$i]) ?></h2>
          <div data-assessment-form <?= $assessmentResult ? 'hidden' : '' ?>>
            <p class="assessment-counter" data-assessment-counter aria-live="polite"></p>
            <div class="journey-progress progress mb-4" role="progressbar" aria-label="<?= h($ui['quiz'][$i]) ?>" aria-valuemin="0" aria-valuemax="<?= count($course['quiz']) ?>" aria-valuenow="1">
              <div class="progress-bar" data-assessment-progress-bar></div>
            </div>
            <form data-assessment-questions novalidate>
              <?php foreach ($course['quiz'] as $index => $question): ?>
                <article class="quiz-card card" data-assessment-question data-question-index="<?= $index ?>" <?= $index > 0 ? 'hidden' : '' ?>>
                  <div class="card-body">
                    <div class="assessment-question-meta">
                      <span class="section-kicker"><?= h($question['title'][$i]) ?></span>
                      <span class="assessment-weight"><?= h(str_replace(
                          '{weight}',
                          number_format(
                              $index === count($course['quiz']) - 1
                                  ? 100 - ((floor(10000 / count($course['quiz'])) / 100) * (count($course['quiz']) - 1))
                                  : floor(10000 / count($course['quiz'])) / 100,
                              2,
                              '.',
                              ''
                          ),
                          $ui['question_weight'][$i]
                      )) ?></span>
                    </div>
                    <p class="assessment-context"><?= h($question['text'][$i]) ?></p>
                    <fieldset>
                      <legend><?= h($question['question'][$i]) ?></legend>
                      <?php foreach ($question['options'] as $optionIndex => $option): ?>
                        <label class="quiz-option">
                          <input type="radio" name="assessment-<?= h($course['id']) ?>-<?= $index ?>" value="<?= $optionIndex ?>">
                          <?= h($option[$i]) ?>
                        </label>
                      <?php endforeach; ?>
                    </fieldset>
                  </div>
                </article>
              <?php endforeach; ?>
              <p class="assessment-status note" data-assessment-status role="status" aria-live="polite"></p>
              <div class="assessment-controls">
                <button type="button" class="btn btn-outline-primary" data-assessment-previous disabled><?= h($ui['previous_question'][$i]) ?></button>
                <button type="button" class="btn btn-primary" data-assessment-next><?= h($ui['next_question'][$i]) ?></button>
                <button type="button" class="btn btn-primary" data-assessment-submit hidden><?= h($ui['show_result'][$i]) ?></button>
              </div>
            </form>
          </div>
          <div class="assessment-result" data-assessment-result hidden></div>
          <a class="btn btn-primary" data-assessment-recognition-link
            href="reconocimiento.php?id=<?= rawurlencode($course['id']) ?>&amp;lang=<?= h($lang) ?>"
            <?= $assessmentResult ? '' : 'hidden' ?>><?= h($ui['view_recognition'][$i]) ?></a>
          <?php if ($assessmentResult): ?>
            <?php
              $assessmentResultJson = json_encode(
                  $assessmentResult,
                  JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT
              );
            ?>
            <div data-assessment-initial-result data-review="<?= h($assessmentResultJson === false ? '' : $assessmentResultJson) ?>" hidden></div>
          <?php endif; ?>
        </div>
      </section>
      <?php endif; ?>
    <?php endif; ?>

    <?php if ($stage === 'overview'): ?>
    <section class="course-for card border-0 shadow-sm">
      <div class="card-body p-4">
        <h2 class="h5"><?= h($ui['for'][$i]) ?></h2>
        <p class="meta mb-0"><?php foreach ($course['audience'] as $a): ?><span class="badge rounded-pill course-badge"><?= h($audiences[$a][$i]) ?></span><?php endforeach; ?></p>
      </div>
    </section>

    <?php if ($stage === 'overview' && $isEnrolled): ?>
    <section class="course-progress card border-0 shadow-sm mt-4" data-course-progress
      data-course-id="<?= h($course['id']) ?>"
      data-label-completed="<?= h($ui['completed'][$i]) ?>"
      data-label-in-progress="<?= h($ui['in_progress'][$i]) ?>"
      data-label-error="<?= h($ui['progress_error'][$i]) ?>">
      <div class="card-body p-4">
        <h2 class="h5"><?= h($ui['progress'][$i]) ?></h2>
        <p class="note" data-progress-status role="status" aria-live="polite"></p>
        <div class="course-progress-actions">
          <?php if (!$isCompleted): ?>
            <button type="button" class="btn btn-outline-danger" data-course-unenroll
              data-course-id="<?= h($course['id']) ?>"
              data-label-unenroll="<?= h($ui['unenroll_action'][$i]) ?>"
              data-label-confirm="<?= h($ui['unenroll_confirm'][$i]) ?>"
              data-label-saving="<?= h($ui['unenroll_saving'][$i]) ?>"
              data-label-error="<?= h($ui['unenroll_error'][$i]) ?>"
              data-label-completed="<?= h($ui['unenroll_completed'][$i]) ?>"><?= h($ui['unenroll_action'][$i]) ?></button>
          <?php endif; ?>
        </div>
        <?php if (!$isCompleted): ?>
          <span class="note d-block mt-2" data-unenroll-status role="status" aria-live="polite"></span>
        <?php endif; ?>
      </div>
    </section>
    <?php endif; ?>
    <?php endif; ?>
  </article>
<?php endif; ?>
</main>
</body>
</html>
