// Fase 2: API en PHP; si no hay PHP usa el JSON estático
const SOURCES = [['php', 'api/courses.php'], ['json', 'data/courses.json']];
let source = '';
// Etapas de la ruta de aprendizaje (ids de cursos, en orden)
const ROAD = [['drive', 'docs-slides', 'gmail', 'calendar-meet', 'classroom'], ['forms', 'sheets', 'looker-studio', 'scholar-trends'], ['apps-script', 'colab', 'notebooklm']];
// En courses.json los textos son pares [español, inglés]
const I18N = {
  es: {
    nav_courses: 'Cursos', nav_roadmap: 'Ruta de aprendizaje', nav_award: 'Reconocimiento', search: 'Buscar un curso',
    login: 'Iniciar sesión', register: 'Registrarse', register_title: 'Crear cuenta', logout: 'Salir', hi: 'Hola, {name}',
    to_light: 'Tema claro', to_dark: 'Tema oscuro', hero_sub: 'Pensado para maestros y alumnos: aprende las herramientas de Google, incluso las que nadie te enseñó.',
    cta: 'Ver cursos', video_ph: 'Aquí va tu video de bienvenida', sound: 'Sonido', cat_all: 'Todos', cat_pop: 'Populares', cat_rare: 'Poco conocidas',
    lvl_all: 'Todos los niveles', lvl_basico: 'Básico', lvl_intermedio: 'Intermedio', lvl_avanzado: 'Avanzado', count: 'Resultados: {n}',
    empty: 'No hay cursos con esos filtros.', load_error: 'No se pudieron cargar los cursos. Abre el proyecto con un servidor local (mira el README).',
    road_sub: 'Sigue este orden para ir de lo básico a la automatización.', stage1: 'Fundamentos', stage2: 'Datos', stage3: 'Automatización e IA',
    details: 'Ver temario', goal: 'Objetivo', topics: 'Temas', done_btn: 'Marcar como completado', course_video: 'Video guía del curso',
    course_videos: 'Videos del curso', quiz_title: 'Comprueba lo aprendido', quiz_check: 'Revisar respuesta',
    quiz_choose: 'Elige una respuesta antes de continuar.', quiz_correct: '¡Correcto!', quiz_incorrect: 'Aún no. La respuesta correcta es:',
    award_line: 'Reconocimiento de GTools Academy para {name} por completar “{course}” el {date}.', award_note: 'No es una certificación oficial.',
    award_text: 'Al terminar un curso recibes un reconocimiento con tu nombre y la fecha. Es un reconocimiento del proyecto, no una certificación oficial de Google ni de ninguna institución.',
    name_label: 'Tu nombre', google: 'Continuar con Google', auth_note: 'Modo demostración: el inicio de sesión real con Google llega en la Fase 5.',
    close: 'Cerrar', footer: 'Proyecto educativo, sin afiliación con Google.',
    aud_all: 'Para todos', aud_maestros: 'Maestros', aud_alumnos: 'Alumnos', aud_general: 'Público general', for: 'Ideal para',
    open_page: 'Abrir página del curso', get_award: 'Ver o guardar en PDF', src: 'Datos',
    nav_contact: 'Contacto', contact_sub: '¿Tienes dudas o quieres proponer un curso? Escríbenos.', email_label: 'Correo', role_label: 'Soy',
    role_maestro: 'Maestro/a', role_alumno: 'Alumno/a', role_otro: 'Otro', msg_label: 'Mensaje', send: 'Enviar mensaje',
    form_sending: 'Enviando...', form_ok: '¡Gracias! Recibimos tu mensaje.', form_invalid: 'Revisa los campos e inténtalo de nuevo.',
    form_error: 'No se pudo enviar. Inténtalo más tarde.', form_nophp: 'El formulario necesita PHP; en la versión estática no se puede enviar.',
  },
  en: {
    nav_courses: 'Courses', nav_roadmap: 'Learning path', nav_award: 'Recognition', search: 'Search a course',
    login: 'Log in', register: 'Sign up', register_title: 'Create account', logout: 'Log out', hi: 'Hi, {name}',
    to_light: 'Light theme', to_dark: 'Dark theme', hero_sub: 'Made for teachers and students: learn Google tools, even the ones nobody taught you.',
    cta: 'Browse courses', video_ph: 'Your welcome video goes here', sound: 'Sound', cat_all: 'All', cat_pop: 'Popular', cat_rare: 'Lesser-known',
    lvl_all: 'All levels', lvl_basico: 'Beginner', lvl_intermedio: 'Intermediate', lvl_avanzado: 'Advanced', count: 'Results: {n}',
    empty: 'No courses match those filters.', load_error: 'Courses could not be loaded. Open the project with a local server (see README).',
    road_sub: 'Follow this order to go from the basics to automation.', stage1: 'Foundations', stage2: 'Data', stage3: 'Automation and AI',
    details: 'See syllabus', goal: 'Goal', topics: 'Topics', done_btn: 'Mark as completed', course_video: 'Course video guide',
    course_videos: 'Course videos', quiz_title: 'Check what you learned', quiz_check: 'Check answer',
    quiz_choose: 'Choose an answer before continuing.', quiz_correct: 'Correct!', quiz_incorrect: 'Not quite. The correct answer is:',
    award_line: 'GTools Academy recognition for {name} for completing “{course}” on {date}.', award_note: 'Not an official certification.',
    award_text: 'When you finish a course you get a recognition with your name and the date. It is a project recognition, not an official certification from Google or any institution.',
    name_label: 'Your name', google: 'Continue with Google', auth_note: 'Demo mode: real Google sign-in arrives in Phase 5.',
    close: 'Close', footer: 'Educational project, not affiliated with Google.',
    aud_all: 'For everyone', aud_maestros: 'Teachers', aud_alumnos: 'Students', aud_general: 'General public', for: 'Great for',
    open_page: 'Open course page', get_award: 'View or save as PDF', src: 'Data',
    nav_contact: 'Contact', contact_sub: 'Have a question or want to suggest a course? Write to us.', email_label: 'Email', role_label: 'I am',
    role_maestro: 'Teacher', role_alumno: 'Student', role_otro: 'Other', msg_label: 'Message', send: 'Send message',
    form_sending: 'Sending...', form_ok: 'Thank you! We received your message.', form_invalid: 'Please check the fields and try again.',
    form_error: 'Could not send. Please try again later.', form_nophp: 'The form needs PHP; it cannot be sent in the static version.',
  },
};

const $ = (s) => document.querySelector(s);
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin almacenamiento */ } };
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

let courses = [], failed = false, fCat = 'all', fLevel = 'all', fAud = 'all', fQuery = '';
let lang = load('lang', navigator.language?.startsWith('en') ? 'en' : 'es');
let theme = load('theme', 'dark');
let user = load('user', null);
const done = load('done', {}); // { idCurso: fechaISO }

const t = (k, v = {}) => (I18N[lang][k] ?? k).replace(/\{(\w+)\}/g, (_, n) => v[n] ?? '');
const pick = (pair) => pair[lang === 'es' ? 0 : 1];
const fmt = (iso) => new Date(iso).toLocaleDateString(lang);

function applyTheme() {
  document.documentElement.dataset.theme = theme;
  $('#theme').textContent = t(theme === 'dark' ? 'to_light' : 'to_dark');
}

function applyI18n() {
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-ph]').forEach((el) => {
    el.placeholder = t(el.dataset.i18nPh);
    el.setAttribute('aria-label', el.placeholder);
  });
  $('#lang').textContent = lang === 'es' ? 'EN' : 'ES';
  $('#sound').setAttribute('aria-label', t('sound'));
  $('#source').textContent = source ? `${t('src')}: ${source === 'php' ? 'PHP' : 'JSON'}` : '';
  $('#contact-form button').disabled = source !== 'php';
  $('#form-status').textContent = source === 'php' ? '' : t('form_nophp');
  applyTheme(); renderAuth(); render();
}

function matches(c) {
  const text = norm([pick(c.title), pick(c.desc), ...pick(c.topics)].join(' '));
  return (fCat === 'all' || c.category === fCat) && (fLevel === 'all' || c.level === fLevel) && (fAud === 'all' || c.audience.includes(fAud)) && text.includes(norm(fQuery));
}

function card(c) {
  const details = source === 'php'
    ? `<a class="ghost" href="curso.php?id=${encodeURIComponent(c.id)}&amp;lang=${lang}">${t('details')}</a>`
    : `<button class="ghost" data-open="${esc(c.id)}">${t('details')}</button>`;
  return `<article class="card" data-color="${esc(c.color)}">
    <span class="icon" aria-hidden="true">${esc(c.icon)}</span>
    <h3>${esc(pick(c.title))}${done[c.id] ? ' ✓' : ''}</h3>
    <p>${esc(pick(c.desc))}</p>
    <p class="note">${t('for')}: ${c.audience.map((a) => t('aud_' + a)).join(', ')}</p>
    <div class="meta">
      <span class="badge">${t('lvl_' + c.level)}</span><span class="badge">${esc(c.hours)} h</span>
      ${details}
    </div>
  </article>`;
}

function renderRoad() {
  if (!courses.length) return;
  const by = Object.fromEntries(courses.map((c) => [c.id, c]));
  $('#roadmap').innerHTML = ROAD.map((ids, i) => `<li><h3>${t('stage' + (i + 1))}</h3><ol>${ids.map((id) =>
    `<li>${source === 'php'
      ? `<a class="step${done[id] ? ' done' : ''}" href="curso.php?id=${encodeURIComponent(id)}&amp;lang=${lang}">${esc(pick(by[id].title))}</a>`
      : `<button class="step${done[id] ? ' done' : ''}" data-open="${id}">${esc(pick(by[id].title))}</button>`}</li>`).join('')}</ol></li>`).join('');
}

function render() {
  const list = courses.filter(matches);
  $('#courses').innerHTML = failed ? `<p class="empty">${t('load_error')}</p>` : list.map(card).join('');
  $('#count').textContent = failed ? '' : t('count', { n: list.length });
  $('#empty').hidden = failed || list.length > 0;
  $('#awards').innerHTML = courses.filter((c) => done[c.id]).map((c) => `<li>🏅 ${esc(pick(c.title))}, ${fmt(done[c.id])}</li>`).join('');
  renderRoad();
}

function renderAuth() {
  $('#login').textContent = user ? t('hi', { name: user.name }) : t('login');
  $('#register').textContent = user ? t('logout') : t('register');
}

function youtubeEmbedUrl(value) {
  const input = typeof value === 'string' ? value.trim() : '';
  if (/^[\w-]{11}$/.test(input)) return `https://www.youtube-nocookie.com/embed/${input}`;

  let url;
  try {
    url = new URL(input);
  } catch {
    return '';
  }

  const host = url.hostname.toLowerCase();
  const isYouTube = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com'].includes(host);
  const isShortUrl = ['youtu.be', 'www.youtu.be'].includes(host);
  if (!isYouTube && !isShortUrl) return '';

  const id = isShortUrl
    ? url.pathname.split('/').filter(Boolean)[0]
    : url.pathname === '/watch'
      ? url.searchParams.get('v')
      : url.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{11})(?:\/|$)/)?.[1];
  return id && /^[\w-]{11}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : '';
}

function canvaEmbedUrl(value) {
  let url;
  try {
    url = new URL(typeof value === 'string' ? value.trim() : '');
  } catch {
    return '';
  }

  if (!['canva.com', 'www.canva.com'].includes(url.hostname.toLowerCase()) ||
      !/^\/design\/[\w-]+\/[\w-]+\/(?:watch|view)\/?$/.test(url.pathname)) return '';

  return `https://www.canva.com${url.pathname.replace(/\/$/, '')}?embed`;
}

function openAuth(mode) {
  $('#auth-title').textContent = t(mode === 'login' ? 'login' : 'register_title');
  $('#dlg-auth').showModal();
}

function openCourse(id) {
  const c = courses.find((x) => x.id === id);
  if (!c) return;
  const d = done[id];
  const langIdx = lang === 'es' ? 0 : 1;

  const canvaVideos = Array.isArray(c.canvaVideos)
    ? c.canvaVideos.map((item) => ({
      title: Array.isArray(item.title) ? pick(item.title) : t('course_video'),
      url: canvaEmbedUrl(item.url),
    })).filter((item) => item.url)
    : [];
  const embedUrl = canvaVideos[0]?.url || canvaEmbedUrl(c.canva) || youtubeEmbedUrl(c.youtube);
  const videoSelector = canvaVideos.length > 1
    ? `<div class="course-video-list" role="group" aria-label="${t('course_videos')}">
        ${canvaVideos.map((item, index) => `<button type="button" class="chip" data-video-url="${item.url}" aria-pressed="${index === 0}">${esc(item.title)}</button>`).join('')}
      </div>`
    : '';
  const videoPlayer = `
    ${videoSelector}
    <div class="course-video-wrapper">
      ${embedUrl
        ? `<iframe id="course-video-iframe" src="${embedUrl}" title="${esc(pick(c.title))} — ${t('course_video')}" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen></iframe>`
        : `<div class="video-overlay-title">🎬 ${t('course_video')}</div>
          <video controls poster="assets/video/poster_placeholder.jpg" playsinline>
            <source src="${esc(c.video || '')}" type="video/mp4">
            ${lang === 'es' ? 'Tu navegador no soporta la reproducción de video.' : 'Your browser does not support video playback.'}
          </video>`}
    </div>
  `;

  // Mapeo de Objetivos de Aprendizaje
  const outcomesList = c.learning_outcomes && c.learning_outcomes[langIdx]
    ? c.learning_outcomes[langIdx].map(o => `<li>✅ ${esc(o)}</li>`).join('')
    : '';

  // Mapeo del Recorrido / Módulos del Curso
  const topicsList = pick(c.topics).map((x, index) => `
    <div class="module-step">
      <span class="step-num">${index + 1}</span>
      <div class="step-content">${esc(x)}</div>
    </div>
  `).join('');
  const quizList = Array.isArray(c.quiz) ? `
    <section class="course-quiz">
      <h3>🧠 ${t('quiz_title')}</h3>
      ${c.quiz.map((item, index) => `
        <article class="quiz-card" data-quiz-card data-answer="${item.answer}"
          data-feedback="${esc(pick(item.feedback))}"
          data-correct-label="${esc(pick(item.options[item.answer]))}">
          <h4>${esc(pick(item.title))}</h4>
          <p>${esc(pick(item.text))}</p>
          <fieldset>
            <legend>${esc(pick(item.question))}</legend>
            ${item.options.map((option, optionIndex) => `
              <label class="quiz-option">
                <input type="radio" name="quiz-${esc(id)}-${index}" value="${optionIndex}">
                ${esc(pick(option))}
              </label>
            `).join('')}
          </fieldset>
          <button type="button" class="ghost" data-quiz-check>${t('quiz_check')}</button>
          <p class="quiz-feedback note" data-quiz-feedback role="status" aria-live="polite"></p>
        </article>
      `).join('')}
    </section>
  ` : '';

  const page = source === 'php' ? `<p><a href="curso.php?id=${esc(id)}&amp;lang=${lang}">${t('open_page')}</a></p>` : '';
  const pdfAward = d && source === 'php'
    ? `<p><a class="solid" target="_blank" rel="noopener" href="reconocimiento.php?id=${esc(id)}&amp;name=${encodeURIComponent(user?.name ?? '')}&amp;date=${new Date(d).toLocaleDateString('en-CA')}&amp;lang=${lang}">${t('get_award')}</a></p>` : '';

  $('#course-body').innerHTML = `
    <div class="modal-header">
      <h2>${esc(c.icon)} ${esc(pick(c.title))}</h2>
      <span class="badge ${esc(c.level)}">${t('lvl_' + c.level)} • ${esc(c.hours)} hrs</span>
    </div>

    ${videoPlayer}

    <div class="course-detail-section">
      <h3>📌 ${lang === 'es' ? 'Descripción e Introducción' : 'Description & Overview'}</h3>
      <p class="course-description">${esc(pick(c.desc))}</p>

      <p><strong>🎯 ${t('goal')}:</strong> ${esc(pick(c.goal))}</p>

      ${c.requirements ? `<p><strong>📋 ${lang === 'es' ? 'Requisitos previos' : 'Prerequisites'}:</strong> ${esc(c.requirements[langIdx])}</p>` : ''}

      ${outcomesList ? `
        <h3>🎓 ${lang === 'es' ? 'Lo que aprenderás' : 'What you will learn'}</h3>
        <ul class="outcomes-list">${outcomesList}</ul>
      ` : ''}

      <h3>🚀 ${lang === 'es' ? 'Recorrido del Curso (Módulos)' : 'Course Path (Modules)'}</h3>
      <div class="modules-container">${topicsList}</div>
      ${quizList}
    </div>

    ${page}
    
    <div class="modal-actions">
      ${d ? `<div class="award"><p>${esc(t('award_line', { name: user?.name ?? '', course: pick(c.title), date: fmt(d) }))}</p><small>${t('award_note')}</small>${pdfAward}</div>`
          : `<button class="solid" id="finish" data-id="${esc(id)}">▶️ ${lang === 'es' ? 'Iniciar / Completar Recorrido' : 'Start / Complete Path'}</button>`}
      <button class="ghost" id="course-close">${t('close')}</button>
    </div>
  `;

  const dlg = $('#dlg-course');
  if (!dlg.open) dlg.showModal();
}

document.addEventListener('click', (e) => {
  const open = e.target.closest('[data-open]');
  if (open) return openCourse(open.dataset.open);
  const videoButton = e.target.closest('[data-video-url]');
  if (videoButton) {
    const frame = $('#course-video-iframe');
    if (frame) frame.src = videoButton.dataset.videoUrl;
    videoButton.parentElement.querySelectorAll('[data-video-url]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button === videoButton));
    });
  }
  const quizButton = e.target.closest('[data-quiz-check]');
  if (quizButton) {
    const quiz = quizButton.closest('[data-quiz-card]');
    const selected = quiz.querySelector('input[type="radio"]:checked');
    const feedback = quiz.querySelector('[data-quiz-feedback]');
    if (!selected) {
      feedback.textContent = t('quiz_choose');
      feedback.dataset.state = 'error';
      return;
    }
    const correct = Number(selected.value) === Number(quiz.dataset.answer);
    feedback.textContent = correct
      ? `${t('quiz_correct')} ${quiz.dataset.feedback}`
      : `${t('quiz_incorrect')} ${quiz.dataset.correctLabel}. ${quiz.dataset.feedback}`;
    feedback.dataset.state = correct ? 'correct' : 'incorrect';
  }
  if (e.target.id === 'course-close') $('#dlg-course').close();
  if (e.target.id === 'finish') {
    if (!user) { $('#dlg-course').close(); return openAuth('login'); }
    done[e.target.dataset.id] = new Date().toISOString();
    save('done', done);
    openCourse(e.target.dataset.id);
    render();
  }
});

$('#q').addEventListener('input', (e) => { fQuery = e.target.value; render(); if (fQuery) $('#cursos').scrollIntoView(); });
$('#level').addEventListener('change', (e) => { fLevel = e.target.value; render(); });
$('#aud').addEventListener('change', (e) => { fAud = e.target.value; render(); });
document.querySelectorAll('.chip').forEach((b) => b.addEventListener('click', () => {
  fCat = b.dataset.cat;
  document.querySelectorAll('.chip').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  render();
}));

$('#lang').onclick = () => { lang = lang === 'es' ? 'en' : 'es'; save('lang', lang); applyI18n(); };
$('#theme').onclick = () => { theme = theme === 'dark' ? 'light' : 'dark'; save('theme', theme); applyTheme(); };
$('#login').onclick = () => { if (!user) openAuth('login'); };
$('#register').onclick = () => {
  if (user) { user = null; save('user', null); renderAuth(); } else openAuth('register');
};
// Demo: en la Fase 5 se reemplaza por Google Identity Services
$('#auth-form').addEventListener('submit', (e) => {
  if (e.submitter?.value !== 'ok') return;
  user = { name: $('#auth-name').value.trim() };
  save('user', user);
  renderAuth();
});

// Formulario de contacto (necesita PHP: api/contact.php)
$('#contact-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const data = new FormData(form);
  data.set('lang', lang);
  $('#form-status').textContent = t('form_sending');
  try {
    const res = await fetch('api/contact.php', { method: 'POST', body: data });
    if (res.status === 201) form.reset();
    $('#form-status').textContent = t(res.status === 201 ? 'form_ok' : res.status === 422 ? 'form_invalid' : 'form_error');
  } catch (err) {
    $('#form-status').textContent = t('form_error');
  }
});

// Video de bienvenida: muestra el recuadro hasta que el archivo cargue
const video = $('#welcome');
video.addEventListener('loadeddata', () => { $('#arch').classList.add('has-video'); $('#sound').hidden = false; });
$('#sound').onclick = () => { video.muted = !video.muted; $('#sound').textContent = video.muted ? '🔇' : '🔊'; };

(async function init() {
  for (const [kind, url] of SOURCES) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error('Formato inesperado');
      courses = data;
      source = kind;
      break;
    } catch (err) {
      console.warn(`Fuente "${kind}" no disponible:`, err.message);
    }
  }
  failed = !source;
  applyI18n();
})();
