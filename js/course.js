const moduleButtons = [...document.querySelectorAll('[data-module-index]')];
const frame = document.querySelector('[data-course-frame]');
const video = document.querySelector('[data-course-video]');
const videoWrapper = document.querySelector('.course-video-wrapper');
const moduleTitle = document.querySelector('[data-module-heading]');
const moduleCounter = document.querySelector('[data-module-counter]');
const moduleProgress = document.querySelector('.journey-progress');
const progressBar = document.querySelector('[data-module-progress]');
const previousButton = document.querySelector('[data-module-previous]');
const nextButton = document.querySelector('[data-module-next]');
const enrollmentSection = document.querySelector('[data-course-enrollment]');
const enrollmentButton = enrollmentSection?.querySelector('[data-course-enroll]');

if (enrollmentSection && enrollmentButton) {
  const enrollmentStatus = enrollmentSection.querySelector('[data-enrollment-status]');
  const labels = enrollmentButton.dataset;

  enrollmentButton.addEventListener('click', async () => {
    enrollmentButton.disabled = true;
    enrollmentButton.textContent = labels.labelSaving;
    enrollmentStatus.textContent = '';
    try {
      const sessionResponse = await fetch('api/auth.php?action=session', { cache: 'no-store' });
      if (!sessionResponse.ok) throw new Error(`Session HTTP ${sessionResponse.status}`);
      const session = await sessionResponse.json();
      if (!session.user) {
        window.location.assign(enrollmentSection.dataset.loginUrl);
        return;
      }

      const response = await fetch('api/enrollment.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': session.csrfToken },
        body: JSON.stringify({ course_id: enrollmentSection.dataset.courseId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`);
      localStorage.setItem('enrollmentChanged', String(Date.now()));
      window.location.reload();
    } catch (error) {
      console.error('Could not enroll in course:', error);
      enrollmentStatus.textContent = labels.labelError;
      enrollmentButton.disabled = false;
      enrollmentButton.textContent = labels.labelEnroll;
    }
  });
}

const unenrollButton = document.querySelector('[data-course-unenroll]');

if (unenrollButton) {
  const status = document.querySelector('[data-unenroll-status]');
  const labels = unenrollButton.dataset;

  unenrollButton.addEventListener('click', async () => {
    if (!window.confirm(labels.labelConfirm)) return;
    unenrollButton.disabled = true;
    unenrollButton.textContent = labels.labelSaving;
    status.textContent = '';
    try {
      const sessionResponse = await fetch('api/auth.php?action=session', { cache: 'no-store' });
      if (!sessionResponse.ok) throw new Error(`Session HTTP ${sessionResponse.status}`);
      const session = await sessionResponse.json();
      if (!session.user) throw new Error('authentication_required');

      const response = await fetch('api/enrollment.php', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': session.csrfToken },
        body: JSON.stringify({ course_id: unenrollButton.dataset.courseId }),
      });
      const result = await response.json();
      if (!response.ok) {
        if (result.error === 'course_already_completed') {
          throw new Error('course_already_completed');
        }
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      localStorage.setItem('enrollmentChanged', String(Date.now()));
      window.location.reload();
    } catch (error) {
      console.error('Could not unenroll from course:', error);
      status.textContent = error.message === 'course_already_completed'
        ? labels.labelCompleted
        : labels.labelError;
      unenrollButton.disabled = false;
      unenrollButton.textContent = labels.labelUnenroll;
    }
  });
}

function selectModule(index) {
  const button = moduleButtons[index];
  if (!button) return;

  const isEmbedded = button.dataset.moduleType === 'embed';
  if (isEmbedded && frame) {
    frame.src = button.dataset.moduleUrl;
    frame.title = button.dataset.moduleTitle;
  } else if (!isEmbedded && video) {
    video.querySelector('source').src = button.dataset.moduleUrl;
    video.load();
  }

  if (moduleTitle) moduleTitle.textContent = button.dataset.moduleTitle;
  if (moduleCounter) {
    const [step, , of] = moduleCounter.textContent.split(' ');
    moduleCounter.textContent = `${step} ${index + 1} ${of} ${moduleButtons.length}`;
  }
  if (moduleProgress) moduleProgress.setAttribute('aria-valuenow', String(index + 1));
  if (progressBar) progressBar.style.width = `${((index + 1) / moduleButtons.length) * 100}%`;
  moduleButtons.forEach((item, buttonIndex) => {
    item.setAttribute('aria-current', buttonIndex === index ? 'step' : 'false');
  });
  if (previousButton) previousButton.disabled = index === 0;
  if (nextButton) nextButton.hidden = index === moduleButtons.length - 1;
  if (videoWrapper) videoWrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

moduleButtons.forEach((button, index) => {
  button.addEventListener('click', () => selectModule(index));
});

previousButton?.addEventListener('click', () => {
  const current = moduleButtons.findIndex((button) => button.getAttribute('aria-current') === 'step');
  selectModule(current - 1);
});

nextButton?.addEventListener('click', () => {
  const current = moduleButtons.findIndex((button) => button.getAttribute('aria-current') === 'step');
  selectModule(current + 1);
});

document.querySelectorAll('[data-quiz-check]').forEach((button) => {
  button.addEventListener('click', () => {
    const card = button.closest('[data-quiz-card]');
    const selected = card.querySelector('input[type="radio"]:checked');
    const feedback = card.querySelector('[data-feedback]');
    if (!selected) {
      feedback.textContent = feedback.dataset.choose;
      feedback.dataset.state = 'error';
      return;
    }

    const correct = Number(selected.value) === Number(card.dataset.answer);
    feedback.textContent = correct
      ? `${feedback.dataset.correct} ${feedback.dataset.explanation}`
      : `${feedback.dataset.incorrect} ${feedback.dataset.correctOption}. ${feedback.dataset.explanation}`;
    feedback.dataset.state = correct ? 'correct' : 'incorrect';
  });
});

window.addEventListener('storage', (event) => {
  if (event.key === 'theme' && event.newValue) {
    try {
      const theme = JSON.parse(event.newValue);
      if (['dark', 'light'].includes(theme)) document.documentElement.dataset.theme = theme;
    } catch (error) {
      console.error('Could not read the changed theme preference:', error);
    }
  }
  if (event.key === 'lang' && event.newValue) {
    try {
      const lang = JSON.parse(event.newValue);
      if (['es', 'en'].includes(lang)) {
        const url = new URL(window.location.href);
        url.searchParams.set('lang', lang);
        window.location.assign(url.href);
      }
    } catch (error) {
      console.error('Could not read the changed language preference:', error);
    }
  }
});

const progressSection = document.querySelector('[data-course-progress]');
const completionButton = document.querySelector('[data-course-complete]');

if (progressSection && completionButton) {
  const progressStatus = progressSection.querySelector('[data-progress-status]');
  const labels = completionButton.dataset;
  let csrfToken = '';
  let completed = false;

  async function loadProgress() {
    try {
      const sessionResponse = await fetch('api/auth.php?action=session', { cache: 'no-store' });
      if (!sessionResponse.ok) throw new Error(`Session HTTP ${sessionResponse.status}`);
      const session = await sessionResponse.json();
      csrfToken = session.csrfToken;
      if (!session.user) {
        completionButton.textContent = labels.labelLogin;
        completionButton.disabled = false;
        return;
      }

      const progressResponse = await fetch('api/progress.php', { cache: 'no-store' });
      if (!progressResponse.ok) throw new Error(`Progress HTTP ${progressResponse.status}`);
      const progress = await progressResponse.json();
      completed = Object.prototype.hasOwnProperty.call(progress.done, progressSection.dataset.courseId);
      completionButton.textContent = completed ? labels.labelCompleted : labels.labelComplete;
      completionButton.disabled = completed;
    } catch (error) {
      console.error('Could not load course progress:', error);
      progressStatus.textContent = labels.labelError;
      completionButton.disabled = true;
    }
  }

  completionButton.addEventListener('click', async () => {
    if (completed) return;
    if (!csrfToken) {
      window.location.assign(progressSection.dataset.loginUrl);
      return;
    }

    completionButton.disabled = true;
    completionButton.textContent = labels.labelSaving;
    progressStatus.textContent = '';
    try {
      const response = await fetch('api/progress.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify({ course_id: progressSection.dataset.courseId, completed: true }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`);
      completed = true;
      completionButton.textContent = labels.labelCompleted;
    } catch (error) {
      console.error('Could not save course progress:', error);
      progressStatus.textContent = labels.labelError;
      completionButton.disabled = false;
      completionButton.textContent = labels.labelComplete;
    }
  });

  loadProgress();
}
