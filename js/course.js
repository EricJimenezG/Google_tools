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
