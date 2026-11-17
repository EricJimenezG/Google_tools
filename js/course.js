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

const courseVideo = document.querySelector('[data-course-video]');
const completeVideoButton = document.querySelector('[data-complete-video]');

if (courseVideo && completeVideoButton) {
  courseVideo.addEventListener('ended', () => {
    completeVideoButton.disabled = false;
  });
}

if (completeVideoButton) {
  const status = document.querySelector('[data-video-progress-status]');
  const labels = completeVideoButton.dataset;

  completeVideoButton.addEventListener('click', async () => {
    completeVideoButton.disabled = true;
    completeVideoButton.textContent = labels.labelSaving;
    status.textContent = '';
    try {
      const sessionResponse = await fetch('api/auth.php?action=session', { cache: 'no-store' });
      if (!sessionResponse.ok) throw new Error(`Session HTTP ${sessionResponse.status}`);
      const session = await sessionResponse.json();
      if (!session.user) throw new Error('authentication_required');

      const response = await fetch('api/video-progress.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': session.csrfToken },
        body: JSON.stringify({
          course_id: labels.courseId,
          module_index: Number(labels.moduleIndex),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`);

      const destination = result.videos_completed
        ? labels.assessmentUrl || labels.overviewUrl
        : labels.nextUrl;
      window.location.assign(destination);
    } catch (error) {
      console.error('Could not save watched course video:', error);
      status.textContent = labels.labelError;
      completeVideoButton.disabled = false;
      completeVideoButton.textContent = labels.labelNext;
    }
  });
}

const assessmentSection = document.querySelector('[data-course-assessment]');

if (assessmentSection) {
  const formArea = assessmentSection.querySelector('[data-assessment-form]');
  const cards = [...assessmentSection.querySelectorAll('[data-assessment-question]')];
  const counter = assessmentSection.querySelector('[data-assessment-counter]');
  const progressBar = assessmentSection.querySelector('[data-assessment-progress-bar]');
  const progressTrack = progressBar.closest('[role="progressbar"]');
  const status = assessmentSection.querySelector('[data-assessment-status]');
  const previousButton = assessmentSection.querySelector('[data-assessment-previous]');
  const nextButton = assessmentSection.querySelector('[data-assessment-next]');
  const submitButton = assessmentSection.querySelector('[data-assessment-submit]');
  const resultElement = assessmentSection.querySelector('[data-assessment-result]');
  const recognitionLink = assessmentSection.querySelector('[data-assessment-recognition-link]');
  const labels = assessmentSection.dataset;
  let currentQuestion = 0;
  let submitting = false;

  function formatLabel(template, values) {
    return template.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? '');
  }

  function setQuestion(index) {
    currentQuestion = index;
    cards.forEach((card, cardIndex) => {
      card.hidden = cardIndex !== currentQuestion;
    });
    counter.textContent = formatLabel(labels.labelProgress, {
      current: currentQuestion + 1,
      total: cards.length,
    });
    progressBar.style.width = `${((currentQuestion + 1) / cards.length) * 100}%`;
    progressTrack.setAttribute('aria-valuenow', String(currentQuestion + 1));
    previousButton.disabled = currentQuestion === 0;
    nextButton.hidden = currentQuestion === cards.length - 1;
    submitButton.hidden = currentQuestion !== cards.length - 1;
    status.textContent = '';
  }

  function getSelectedAnswer(card) {
    const selected = card.querySelector('input[type="radio"]:checked');
    return selected ? Number(selected.value) : null;
  }

  function createTextElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    element.textContent = text;
    return element;
  }

  function renderAssessmentResult(result) {
    const percentage = Number(result.percentage).toFixed(2).replace(/\.?0+$/, '');
    resultElement.replaceChildren();
    resultElement.append(
      createTextElement('h3', 'h4 assessment-result-heading', result.passed ? labels.labelPassed : labels.labelFailed),
      createTextElement('p', 'assessment-score', formatLabel(labels.labelScore, {
        percentage,
        correct: result.correct_count,
        total: result.total_questions,
      })),
      createTextElement('p', 'note assessment-required', formatLabel(labels.labelRequired, {
        required: result.required_correct,
      })),
      createTextElement('h4', 'h5 assessment-review-title', labels.labelReviewTitle),
    );

    result.questions.forEach((question, index) => {
      const item = document.createElement('article');
      item.className = 'assessment-review-item card';
      const heading = document.createElement('div');
      heading.className = 'assessment-review-heading';
      heading.append(
        createTextElement('h5', 'h6 mb-0', `${index + 1}. ${question.title}`),
        createTextElement(
          'span',
          'assessment-weight',
          formatLabel(labels.labelWeight, { weight: Number(question.weight_percentage).toFixed(2).replace(/\.?0+$/, '') }),
        ),
        createTextElement(
          'span',
          `assessment-answer-status${question.is_correct ? ' is-correct' : ' is-incorrect'}`,
          question.is_correct ? labels.labelCorrect : labels.labelIncorrect,
        ),
      );
      item.append(
        heading,
        createTextElement('p', 'assessment-context', question.text),
        createTextElement('p', 'assessment-review-question', question.question),
        createTextElement('p', 'assessment-review-answer', `${labels.labelYourAnswer}: ${question.selected_answer}`),
        createTextElement('p', 'assessment-review-answer', `${labels.labelCorrectAnswer}: ${question.correct_answer}`),
        createTextElement('p', 'assessment-review-feedback note', question.feedback),
      );
      resultElement.append(item);
    });

    if (result.passed) {
      resultElement.append(createTextElement('p', 'assessment-completed-note note', labels.labelCompleted));
    } else {
      const retryButton = createTextElement('button', 'btn btn-outline-primary', labels.labelRetry);
      retryButton.type = 'button';
      retryButton.addEventListener('click', () => {
        cards.forEach((card) => {
          card.querySelectorAll('input[type="radio"]').forEach((input) => {
            input.checked = false;
          });
        });
        submitting = false;
        previousButton.disabled = true;
        nextButton.disabled = false;
        submitButton.disabled = false;
        submitButton.textContent = labels.labelSubmit;
        resultElement.hidden = true;
        formArea.hidden = false;
        setQuestion(0);
      });
      resultElement.append(retryButton);
    }

    recognitionLink.hidden = !result.passed;
    formArea.hidden = true;
    resultElement.hidden = false;
  }

  previousButton.addEventListener('click', () => {
    if (!submitting && currentQuestion > 0) setQuestion(currentQuestion - 1);
  });

  nextButton.addEventListener('click', () => {
    if (getSelectedAnswer(cards[currentQuestion]) === null) {
      status.textContent = labels.labelChoose;
      return;
    }
    if (currentQuestion < cards.length - 1) setQuestion(currentQuestion + 1);
  });

  submitButton.addEventListener('click', async () => {
    if (submitting) return;
    if (getSelectedAnswer(cards[currentQuestion]) === null) {
      status.textContent = labels.labelChoose;
      return;
    }

    const answers = cards.map(getSelectedAnswer);
    const missingAnswer = answers.findIndex((answer) => answer === null);
    if (missingAnswer !== -1) {
      setQuestion(missingAnswer);
      status.textContent = labels.labelChoose;
      return;
    }

    submitting = true;
    previousButton.disabled = true;
    nextButton.disabled = true;
    submitButton.disabled = true;
    submitButton.textContent = labels.labelSaving;
    status.textContent = '';

    try {
      const sessionResponse = await fetch('api/auth.php?action=session', { cache: 'no-store' });
      if (!sessionResponse.ok) throw new Error(`Session HTTP ${sessionResponse.status}`);
      const session = await sessionResponse.json();
      if (!session.user) throw new Error('authentication_required');

      const response = await fetch('api/progress.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': session.csrfToken },
        body: JSON.stringify({
          course_id: labels.courseId,
          answers,
          lang: labels.lang,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`);
      submitting = result.completed;
      renderAssessmentResult(result.assessment);
    } catch (error) {
      console.error('Could not submit course assessment:', error);
      status.textContent = labels.labelError;
      submitting = false;
      previousButton.disabled = currentQuestion === 0;
      nextButton.disabled = false;
      submitButton.disabled = false;
      submitButton.textContent = labels.labelSubmit;
    }
  });

  const initialResult = assessmentSection.querySelector('[data-assessment-initial-result]');
  if (initialResult) {
    try {
      renderAssessmentResult(JSON.parse(initialResult.dataset.review));
    } catch (error) {
      console.error('Could not display the saved course assessment:', error);
      status.textContent = labels.labelError;
    }
  } else {
    setQuestion(0);
  }
}

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

if (progressSection) {
  const progressStatus = progressSection.querySelector('[data-progress-status]');
  const labels = progressSection.dataset;

  async function loadProgress() {
    try {
      const sessionResponse = await fetch('api/auth.php?action=session', { cache: 'no-store' });
      if (!sessionResponse.ok) throw new Error(`Session HTTP ${sessionResponse.status}`);
      const session = await sessionResponse.json();
      if (!session.user) throw new Error('authentication_required');

      const progressResponse = await fetch('api/progress.php', { cache: 'no-store' });
      if (!progressResponse.ok) throw new Error(`Progress HTTP ${progressResponse.status}`);
      const progress = await progressResponse.json();
      const completed = Object.prototype.hasOwnProperty.call(progress.done, progressSection.dataset.courseId);
      progressStatus.textContent = completed ? labels.labelCompleted : labels.labelInProgress;
    } catch (error) {
      console.error('Could not load course progress:', error);
      progressStatus.textContent = labels.labelError;
    }
  }

  loadProgress();
}
