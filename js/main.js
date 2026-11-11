// Fase 2: API en PHP; si no hay PHP usa el JSON estático
const SOURCES = [['php', 'api/courses.php'], ['json', 'data/courses.json']];
let source = '';
// Etapas de la ruta de aprendizaje (ids de cursos, en orden)
const ROAD = [['drive', 'docs-slides', 'gmail', 'calendar-meet', 'classroom'], ['forms', 'sheets', 'looker-studio', 'scholar-trends'], ['apps-script', 'colab', 'notebooklm']];
// En courses.json los textos son pares [español, inglés]
const I18N = {
  es: {
    nav_courses: 'Cursos', nav_roadmap: 'Ruta de aprendizaje', nav_award: 'Reconocimiento', search: 'Buscar un curso',
    login: 'Iniciar sesión', register: 'Registrarse', register_title: 'Crear cuenta', logout: 'Cerrar sesión', account_menu: 'Abrir menú de cuenta',
    language: 'Idioma', spanish: 'Español', english: 'Inglés', theme: 'Tema', dark: 'Oscuro', light: 'Claro',
    manage_profile: 'Administrar tu cuenta', hero_sub: 'Pensado para maestros y alumnos: aprende las herramientas de Google, incluso las que nadie te enseñó.',
    cta: 'Ver cursos', video_ph: 'Aquí va tu video de bienvenida', cat_all: 'Todos', cat_pop: 'Populares', cat_rare: 'Poco conocidas',
    lvl_all: 'Todos los niveles', lvl_basico: 'Básico', lvl_intermedio: 'Intermedio', lvl_avanzado: 'Avanzado', count: 'Resultados: {n}',
    empty: 'No hay cursos con esos filtros.', load_error: 'No se pudieron cargar los cursos. Abre el proyecto con un servidor local (mira el README).',
    road_sub: 'Sigue este orden para ir de lo básico a la automatización.', stage1: 'Fundamentos', stage2: 'Datos', stage3: 'Automatización e IA',
    details: 'Detalles curso', continue_course: 'Continuar curso', goal: 'Objetivo', topics: 'Temas', done_btn: 'Marcar como completado', course_video: 'Video guía del curso',
    course_videos: 'Videos del curso', quiz_title: 'Comprueba lo aprendido', quiz_check: 'Revisar respuesta',
    quiz_choose: 'Elige una respuesta antes de continuar.', quiz_correct: '¡Correcto!', quiz_incorrect: 'Aún no. La respuesta correcta es:',
    award_line: 'Reconocimiento de GTools Academy para {name} por completar “{course}” el {date}.', award_note: 'No es una certificación oficial.',
    award_text: 'Al terminar un curso recibes un reconocimiento con tu nombre y la fecha. Es un reconocimiento del proyecto, no una certificación oficial de Google ni de ninguna institución.',
    name_label: 'Tu nombre', google: 'Continuar con Google', auth_note: 'Google verificará tu cuenta y tu progreso quedará asociado a ella.',
    auth_unavailable: 'No se pudo consultar la sesión. Comprueba que Apache y PHP estén activos.',
    auth_setup_error: 'El acceso con Google aún no está configurado. Revisa config/config.php y la configuración OAuth.',
    auth_cancelled: 'Se canceló el inicio de sesión con Google.', auth_failed: 'No se pudo completar el inicio de sesión. Inténtalo de nuevo.',
    auth_not_registered: 'Debes primero realizar tu registro con una cuenta de Google.',
    auth_notice_title: 'Registro requerido',
    progress_error: 'No se pudo guardar el progreso. Comprueba la conexión e inténtalo otra vez.',
    logout_error: 'No se pudo cerrar la sesión. Inténtalo otra vez.',
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
    login: 'Log in', register: 'Sign up', register_title: 'Create account', logout: 'Sign out', account_menu: 'Open account menu',
    language: 'Language', spanish: 'Spanish', english: 'English', theme: 'Theme', dark: 'Dark', light: 'Light',
    manage_profile: 'Manage your account', hero_sub: 'Made for teachers and students: learn Google tools, even the ones nobody taught you.',
    cta: 'Browse courses', video_ph: 'Your welcome video goes here', cat_all: 'All', cat_pop: 'Popular', cat_rare: 'Lesser-known',
    lvl_all: 'All levels', lvl_basico: 'Beginner', lvl_intermedio: 'Intermediate', lvl_avanzado: 'Advanced', count: 'Results: {n}',
    empty: 'No courses match those filters.', load_error: 'Courses could not be loaded. Open the project with a local server (see README).',
    road_sub: 'Follow this order to go from the basics to automation.', stage1: 'Foundations', stage2: 'Data', stage3: 'Automation and AI',
    details: 'Course details', continue_course: 'Continue course', goal: 'Goal', topics: 'Topics', done_btn: 'Mark as completed', course_video: 'Course video guide',
    course_videos: 'Course videos', quiz_title: 'Check what you learned', quiz_check: 'Check answer',
    quiz_choose: 'Choose an answer before continuing.', quiz_correct: 'Correct!', quiz_incorrect: 'Not quite. The correct answer is:',
    award_line: 'GTools Academy recognition for {name} for completing “{course}” on {date}.', award_note: 'Not an official certification.',
    award_text: 'When you finish a course you get a recognition with your name and the date. It is a project recognition, not an official certification from Google or any institution.',
    name_label: 'Your name', google: 'Continue with Google', auth_note: 'Google will verify your account and save your progress to it.',
    auth_unavailable: 'Could not check the session. Make sure Apache and PHP are running.',
    auth_setup_error: 'Google sign-in is not configured yet. Check config/config.php and OAuth settings.',
    auth_cancelled: 'Google sign-in was cancelled.', auth_failed: 'Could not complete sign-in. Please try again.',
    auth_not_registered: 'You must register with a Google account first.',
    auth_notice_title: 'Registration required',
    progress_error: 'Could not save your progress. Check the connection and try again.',
    logout_error: 'Could not sign out. Please try again.',
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
let user = null;
let csrfToken = '';
let authError = '';
const done = {};
const enrolled = new Set();

const t = (k, v = {}) => (I18N[lang][k] ?? k).replace(/\{(\w+)\}/g, (_, n) => v[n] ?? '');
const pick = (pair) => pair[lang === 'es' ? 0 : 1];
const fmt = (iso) => new Date(iso).toLocaleDateString(lang);

function applyTheme() {
  document.documentElement.dataset.theme = theme;
}

function renderAuthStatus() {
  const status = $('#account-status');
  const isNotice = authError === 'auth_not_registered';
  status.hidden = !authError || isNotice;
  status.textContent = authError && !isNotice ? t(authError) : '';
  $('#auth-status').textContent = authError && !isNotice ? t(authError) : '';
}

function applyI18n() {
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-ph]').forEach((el) => {
    el.placeholder = t(el.dataset.i18nPh);
    el.setAttribute('aria-label', el.placeholder);
  });
  $('#guest-language').value = lang;
  $('#guest-language').setAttribute('aria-label', t('language'));
  $('#guest-theme').value = theme;
  $('#guest-theme').setAttribute('aria-label', t('theme'));
  $('#source').textContent = source ? `${t('src')}: ${source === 'php' ? 'PHP' : 'JSON'}` : '';
  $('#contact-form button').disabled = source !== 'php';
  $('#form-status').textContent = source === 'php' ? '' : t('form_nophp');
  applyTheme(); renderAuth(); renderAuthStatus(); render();
}

function matches(c) {
  const text = norm([pick(c.title), pick(c.desc), ...pick(c.topics)].join(' '));
  return (fCat === 'all' || c.category === fCat) && (fLevel === 'all' || c.level === fLevel) && (fAud === 'all' || c.audience.includes(fAud)) && text.includes(norm(fQuery));
}

function card(c) {
  const courseAction = enrolled.has(c.id) ? t('continue_course') : t('details');
  const details = source === 'php'
    ? `<a class="ghost" href="curso.php?id=${encodeURIComponent(c.id)}&amp;lang=${lang}">${courseAction}</a>`
    : `<button class="ghost" data-open="${esc(c.id)}">${courseAction}</button>`;
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
  $('#roadmap').innerHTML = ROAD.map((ids, i) => {
    const availableIds = ids.filter((id) => by[id]);
    if (!availableIds.length) return '';
    return `<li><h3>${t('stage' + (i + 1))}</h3><ol>${availableIds.map((id) =>
    `<li>${source === 'php'
      ? `<a class="step${done[id] ? ' done' : ''}" href="curso.php?id=${encodeURIComponent(id)}&amp;lang=${lang}">${esc(pick(by[id].title))}</a>`
      : `<button class="step${done[id] ? ' done' : ''}" data-open="${id}">${esc(pick(by[id].title))}</button>`}</li>`).join('')}</ol></li>`;
  }).join('');
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
  const signedIn = Boolean(user);
  $('#login').hidden = signedIn;
  $('#register').hidden = signedIn;
  $('#guest-preferences').hidden = signedIn;
  $('#account-area').hidden = !signedIn;
  $('#login').textContent = t('login');
  $('#register').textContent = t('register');
  if (!signedIn) {
    closeAccountMenu();
    return;
  }

  $('#account-name').textContent = user.name;
  $('#account-email').textContent = user.email;
  const initial = [...(user.name || user.email || '?')][0].toLocaleUpperCase();
  for (const [imageSelector, initialSelector] of [
    ['#account-avatar', '#account-initials'],
    ['#account-menu-avatar', '#account-menu-initials'],
  ]) {
    const image = $(imageSelector);
    const fallback = $(initialSelector);
    const picture = safeProfilePicture(user.picture);
    image.hidden = !picture;
    fallback.hidden = Boolean(picture);
    fallback.textContent = initial;
    if (picture) image.src = picture;
    else image.removeAttribute('src');
  }
}

function safeProfilePicture(value) {
  if (typeof value !== 'string') return '';
  try {
    const picture = new URL(value);
    return picture.protocol === 'https:' &&
      (picture.hostname === 'googleusercontent.com' || picture.hostname.endsWith('.googleusercontent.com'))
      ? picture.href
      : '';
  } catch {
    return '';
  }
}

function closeAccountMenu() {
  const trigger = $('#account-trigger');
  const menu = $('#account-menu');
  if (!trigger || !menu) return;
  menu.hidden = true;
  trigger.setAttribute('aria-expanded', 'false');
}

function openAuth(mode) {
  const dialog = $('#dlg-auth');
  dialog.classList.remove('auth-notice');
  $('#google-login').hidden = false;
  document.querySelector('[data-i18n="auth_note"]').hidden = false;
  $('#auth-status').classList.remove('auth-alert-message');
  $('#auth-title').textContent = t(mode === 'login' ? 'login' : 'register_title');
  $('#google-login').href = `api/auth.php?action=login&mode=${mode === 'register' ? 'register' : 'login'}`;
  renderAuthStatus();
  dialog.showModal();
}

function openAuthNotice(messageKey) {
  const dialog = $('#dlg-auth');
  authError = '';
  $('#account-status').hidden = true;
  $('#auth-title').textContent = t('auth_notice_title');
  $('#google-login').hidden = true;
  document.querySelector('[data-i18n="auth_note"]').hidden = true;
  $('#auth-status').textContent = t(messageKey);
  $('#auth-status').classList.add('auth-alert-message');
  dialog.classList.add('auth-notice');
  dialog.showModal();
}

function openCourse(id) {
  const c = courses.find((x) => x.id === id);
  if (!c) return;
  const langIdx = lang === 'es' ? 0 : 1;
  const requirements = c.requirements?.[langIdx];
  const page = source === 'php'
    ? `<a class="solid" href="curso.php?id=${encodeURIComponent(id)}&amp;lang=${lang}">${t('details')}</a>`
    : '';

  $('#course-body').innerHTML = `
    <div class="modal-header">
      <h2>${esc(c.icon)} ${esc(pick(c.title))}</h2>
      <span class="badge ${esc(c.level)}">${t('lvl_' + c.level)} • ${esc(c.hours)} hrs</span>
    </div>
    <div class="course-detail-section">
      <h3>📌 ${lang === 'es' ? 'Descripción e Introducción' : 'Description & Overview'}</h3>
      <p class="course-description">${esc(pick(c.desc))}</p>
      <p><strong>🎯 ${t('goal')}:</strong> ${esc(pick(c.goal))}</p>
      ${requirements ? `<p><strong>📋 ${lang === 'es' ? 'Requisitos previos' : 'Prerequisites'}:</strong> ${esc(requirements)}</p>` : ''}
    </div>
    <div class="modal-actions">
      ${page}
      <button class="ghost" id="course-close">${t('close')}</button>
    </div>
  `;

  const dlg = $('#dlg-course');
  if (!dlg.open) dlg.showModal();
}

document.addEventListener('click', (e) => {
  const open = e.target.closest('[data-open]');
  if (open) return openCourse(open.dataset.open);
  if (e.target.id === 'course-close') $('#dlg-course').close();
});

$('#q').addEventListener('input', (e) => { fQuery = e.target.value; render(); if (fQuery) $('#cursos').scrollIntoView(); });
$('#level').addEventListener('change', (e) => { fLevel = e.target.value; render(); });
$('#aud').addEventListener('change', (e) => { fAud = e.target.value; render(); });
document.querySelectorAll('.chip').forEach((b) => b.addEventListener('click', () => {
  fCat = b.dataset.cat;
  document.querySelectorAll('.chip').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  render();
}));

$('#login').onclick = () => { if (!user) openAuth('login'); };
$('#register').onclick = () => {
  openAuth('register');
};
$('#guest-language').addEventListener('change', (event) => {
  if (user) return;
  lang = event.target.value;
  save('lang', lang);
  applyI18n();
});
$('#guest-theme').addEventListener('change', (event) => {
  if (user) return;
  theme = event.target.value;
  save('theme', theme);
  applyI18n();
});
$('#auth-close').addEventListener('click', () => $('#dlg-auth').close());
$('#dlg-auth').addEventListener('close', () => {
  $('#dlg-auth').classList.remove('auth-notice');
  $('#google-login').hidden = false;
  document.querySelector('[data-i18n="auth_note"]').hidden = false;
  $('#auth-status').classList.remove('auth-alert-message');
  $('#auth-status').textContent = '';
});
$('#account-trigger').addEventListener('click', () => {
  const menu = $('#account-menu');
  const expanded = $('#account-trigger').getAttribute('aria-expanded') === 'true';
  menu.hidden = expanded;
  $('#account-trigger').setAttribute('aria-expanded', String(!expanded));
});
$('#account-signout').addEventListener('click', signOut);
document.addEventListener('click', (event) => {
  if (!event.target.closest('#account-area')) closeAccountMenu();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeAccountMenu();
});

async function signOut() {
  try {
    const response = await fetch('api/auth.php?action=logout', {
      method: 'POST',
      headers: { 'X-CSRF-Token': csrfToken },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    user = null;
    csrfToken = '';
    Object.keys(done).forEach((courseId) => delete done[courseId]);
    authError = '';
    save('authChanged', Date.now());
    renderAuth(); renderAuthStatus();
    render();
  } catch (error) {
    console.error('Could not sign out:', error);
    authError = 'logout_error';
    openAuth('login');
  }
}

async function loadAuthState() {
  const response = await fetch('api/auth.php?action=session', { cache: 'no-store' });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const session = await response.json();
  user = session.user;
  csrfToken = session.csrfToken;
  if (user) {
    const preferencesResponse = await fetch('api/preferences.php', { cache: 'no-store' });
    if (!preferencesResponse.ok) throw new Error(`Preferences HTTP ${preferencesResponse.status}`);
    const preferences = await preferencesResponse.json();
    if (!['es', 'en'].includes(preferences.language) || !['dark', 'light'].includes(preferences.theme)) {
      throw new Error('Invalid account preferences');
    }
    lang = preferences.language;
    theme = preferences.theme;
    save('lang', lang);
    save('theme', theme);

    const progressResponse = await fetch('api/progress.php', { cache: 'no-store' });
    if (!progressResponse.ok) throw new Error(`Progress HTTP ${progressResponse.status}`);
    const progress = await progressResponse.json();
    Object.assign(done, progress.done);
    const enrollmentResponse = await fetch('api/enrollment.php', { cache: 'no-store' });
    if (!enrollmentResponse.ok) throw new Error(`Enrollment HTTP ${enrollmentResponse.status}`);
    const enrollment = await enrollmentResponse.json();
    if (!Array.isArray(enrollment.enrolled) || !enrollment.enrolled.every((courseId) => typeof courseId === 'string')) {
      throw new Error('Invalid enrollment response');
    }
    enrolled.clear();
    enrollment.enrolled.forEach((courseId) => enrolled.add(courseId));
  } else {
    Object.keys(done).forEach((courseId) => delete done[courseId]);
    enrolled.clear();
  }
}

window.addEventListener('storage', (event) => {
  if (event.key === 'lang' && event.newValue) {
    try {
      const newLanguage = JSON.parse(event.newValue);
      if (['es', 'en'].includes(newLanguage)) {
        lang = newLanguage;
        applyI18n();
      }
    } catch (error) {
      console.error('Could not read the changed language preference:', error);
    }
  }
  if (event.key === 'theme' && event.newValue) {
    try {
      const newTheme = JSON.parse(event.newValue);
      if (['dark', 'light'].includes(newTheme)) {
        theme = newTheme;
        applyTheme();
      }
    } catch (error) {
      console.error('Could not read the changed theme preference:', error);
    }
  }
  if (event.key === 'authChanged') {
    loadAuthState()
      .then(() => { renderAuth(); render(); })
      .catch((error) => console.error('Could not refresh account session:', error));
  }
  if (event.key === 'enrollmentChanged') {
    loadAuthState()
      .then(() => { renderAuth(); render(); })
      .catch((error) => console.error('Could not refresh course enrollments:', error));
  }
});

window.addEventListener('pageshow', (event) => {
  if (!event.persisted) return;
  loadAuthState()
    .then(() => { renderAuth(); render(); })
    .catch((error) => console.error('Could not refresh course enrollments:', error));
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
video.addEventListener('loadeddata', () => { $('#arch').classList.add('has-video'); });

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
  try {
    await loadAuthState();
  } catch (err) {
    console.warn('Could not load the account session:', err.message);
    authError = 'auth_unavailable';
  }
  const authResult = new URLSearchParams(location.search).get('auth');
  if (authResult) {
    authError = authResult === 'cancelled' ? 'auth_cancelled'
      : authResult === 'not_registered' ? 'auth_not_registered'
        : authResult === 'success' ? ''
          : 'auth_failed';
    history.replaceState(null, '', location.pathname + location.hash);
  }
  failed = !source;
  applyI18n();
  if (authResult === 'not_registered') openAuthNotice('auth_not_registered');
})();
