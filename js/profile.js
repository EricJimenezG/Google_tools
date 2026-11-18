const PROFILE_I18N = {
  es: {
    back: 'Volver a GTools Academy',
    account: 'Cuenta',
    title: 'Perfil y preferencias',
    intro: 'Administra tu perfil y personaliza la experiencia de la academia.',
    preferences: 'Preferencias del sitio',
    language: 'Idioma del sitio',
    spanish: 'Español',
    english: 'Inglés',
    theme: 'Tema visual',
    dark: 'Oscuro',
    light: 'Claro',
    logout: 'Cerrar sesión',
    login: 'Iniciar sesión con Google',
    loading: 'Cargando tu perfil...',
    signedOut: 'Inicia sesión con Google para consultar tu perfil.',
    loadError: 'No se pudo cargar tu perfil. Comprueba que Apache y PHP estén activos.',
    recognitionName: 'Nombre para los reconocimientos',
    editCertificateName: 'Editar nombre Certificados',
    firstName: 'Nombre',
    lastName: 'Apellidos',
    saveName: 'Guardar nombre',
    savingName: 'Guardando nombre...',
    nameSaved: 'Nombre guardado. Se usará en tus reconocimientos.',
    nameRequiredPrompt: 'Completa tu nombre y apellidos para generar tu reconocimiento.',
    nameSaveError: 'No se pudieron guardar tu nombre y apellidos. Inténtalo otra vez.',
    continueRecognition: 'Continuar al reconocimiento',
    saved: 'Preferencias guardadas en tu cuenta.',
    localSaved: 'Preferencias guardadas en este navegador.',
    saveError: 'No se pudieron guardar tus preferencias. Inténtalo otra vez.',
    logoutError: 'No se pudo cerrar la sesión. Inténtalo otra vez.',
  },
  en: {
    back: 'Back to GTools Academy',
    account: 'Account',
    title: 'Profile and preferences',
    intro: 'Manage your profile and personalize your academy experience.',
    preferences: 'Site preferences',
    language: 'Site language',
    spanish: 'Spanish',
    english: 'English',
    theme: 'Appearance',
    dark: 'Dark',
    light: 'Light',
    logout: 'Sign out',
    login: 'Sign in with Google',
    loading: 'Loading your profile...',
    signedOut: 'Sign in with Google to view your profile.',
    loadError: 'Could not load your profile. Make sure Apache and PHP are running.',
    recognitionName: 'Name for recognitions',
    editCertificateName: 'Edit certificate name',
    firstName: 'First name',
    lastName: 'Last name',
    saveName: 'Save name',
    savingName: 'Saving name...',
    nameSaved: 'Name saved. It will appear on your recognitions.',
    nameRequiredPrompt: 'Add your first and last name to generate your recognition.',
    nameSaveError: 'Could not save your name. Please try again.',
    continueRecognition: 'Continue to recognition',
    saved: 'Preferences saved to your account.',
    localSaved: 'Preferences saved in this browser.',
    saveError: 'Could not save your preferences. Please try again.',
    logoutError: 'Could not sign out. Please try again.',
  },
};

const profile$ = (selector) => document.querySelector(selector);
const storedPreference = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
};

let profileLanguage = storedPreference('lang', navigator.language?.startsWith('en') ? 'en' : 'es');
let csrfToken = '';
let profileUser = null;
let profileNames = { firstName: '', lastName: '' };
let profileTheme = storedPreference('theme', 'dark');
let savedLanguage = profileLanguage;
let savedTheme = profileTheme;
const profileText = (key) => PROFILE_I18N[profileLanguage][key];

function applyProfileLanguage() {
  document.documentElement.lang = profileLanguage;
  document.querySelectorAll('[data-i18n]').forEach((element) => {
    element.textContent = profileText(element.dataset.i18n);
  });
  document.title = `${profileText('title')} | GTools Academy`;
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

function showProfile(user) {
  profile$('#profile-details').hidden = !user;
  profile$('#profile-signed-out').hidden = Boolean(user);
  if (!user) {
    profile$('#profile-status').textContent = profileText('signedOut');
    return;
  }

  profile$('#profile-status').textContent = '';
  const displayName = [profileNames.firstName, profileNames.lastName].filter(Boolean).join(' ') || user.name;
  profile$('#profile-name').textContent = displayName;
  profile$('#profile-email').textContent = user.email;
  const picture = safeProfilePicture(user.picture);
  profile$('#profile-avatar').hidden = !picture;
  profile$('#profile-initials').hidden = Boolean(picture);
  profile$('#profile-initials').textContent = [...(displayName || user.email || '?')][0].toLocaleUpperCase();
  if (picture) profile$('#profile-avatar').src = picture;
  else profile$('#profile-avatar').removeAttribute('src');
}

function setProfileNameEditorOpen(isOpen) {
  const form = profile$('#profile-name-form');
  form.hidden = !isOpen;
  profile$('#profile-name-toggle').setAttribute('aria-expanded', String(isOpen));
  if (isOpen) profile$('#profile-first-name').focus();
}

async function loadProfile() {
  profile$('#profile-status').textContent = profileText('loading');
  try {
    const response = await fetch('api/auth.php?action=session', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const session = await response.json();
    csrfToken = session.csrfToken;
    profileUser = session.user;
    if (profileUser) {
      const preferencesResponse = await fetch('api/preferences.php', { cache: 'no-store' });
      if (!preferencesResponse.ok) throw new Error(`Preferences HTTP ${preferencesResponse.status}`);
      const preferences = await preferencesResponse.json();
      if (!['es', 'en'].includes(preferences.language) || !['dark', 'light'].includes(preferences.theme)) {
        throw new Error('Invalid account preferences');
      }
      profileLanguage = preferences.language;
      profileTheme = preferences.theme;
      savedLanguage = profileLanguage;
      savedTheme = profileTheme;
      localStorage.setItem('lang', JSON.stringify(profileLanguage));
      localStorage.setItem('theme', JSON.stringify(profileTheme));
      profile$('#profile-language').value = profileLanguage;
      profile$('#profile-theme').value = profileTheme;
      document.documentElement.dataset.theme = profileTheme;
      applyProfileLanguage();

      const profileResponse = await fetch('api/profile.php', { cache: 'no-store' });
      if (!profileResponse.ok) throw new Error(`Profile details HTTP ${profileResponse.status}`);
      const names = await profileResponse.json();
      if (typeof names.firstName !== 'string' || typeof names.lastName !== 'string') {
        throw new Error('Invalid profile names');
      }
      profileNames = {
        firstName: names.firstName.trim(),
        lastName: names.lastName.trim(),
      };
      profile$('#profile-first-name').value = profileNames.firstName;
      profile$('#profile-last-name').value = profileNames.lastName;
    }
    showProfile(session.user);
    if (profileUser && new URLSearchParams(window.location.search).get('complete_name') === '1') {
      profile$('#profile-name-status').textContent = profileText('nameRequiredPrompt');
      setProfileNameEditorOpen(true);
    }
  } catch (error) {
    console.error('Could not load profile:', error);
    profile$('#profile-status').textContent = profileText('loadError');
    profile$('#profile-details').hidden = true;
    profile$('#profile-signed-out').hidden = true;
  }
}

profile$('#profile-language').value = profileLanguage;
profile$('#profile-theme').value = profileTheme;
applyProfileLanguage();

async function savePreferences() {
  const language = profile$('#profile-language').value;
  const theme = profile$('#profile-theme').value;
  profileLanguage = language;
  profileTheme = theme;
  applyProfileLanguage();
  document.documentElement.dataset.theme = theme;
  profile$('#preferences-status').textContent = '';

  if (!profileUser) {
    localStorage.setItem('lang', JSON.stringify(language));
    localStorage.setItem('theme', JSON.stringify(theme));
    profile$('#preferences-status').textContent = profileText('localSaved');
    return;
  }

  const languageSelect = profile$('#profile-language');
  const themeSelect = profile$('#profile-theme');
  languageSelect.disabled = true;
  themeSelect.disabled = true;
  try {
    const response = await fetch('api/preferences.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
      body: JSON.stringify({ language, theme }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`);
    profileLanguage = result.language;
    profileTheme = result.theme;
    savedLanguage = profileLanguage;
    savedTheme = profileTheme;
    languageSelect.value = profileLanguage;
    themeSelect.value = profileTheme;
    localStorage.setItem('lang', JSON.stringify(profileLanguage));
    localStorage.setItem('theme', JSON.stringify(profileTheme));
    document.documentElement.dataset.theme = profileTheme;
    applyProfileLanguage();
    profile$('#preferences-status').textContent = profileText('saved');
  } catch (error) {
    console.error('Could not save account preferences:', error);
    profileLanguage = savedLanguage;
    profileTheme = savedTheme;
    languageSelect.value = savedLanguage;
    themeSelect.value = savedTheme;
    document.documentElement.dataset.theme = savedTheme;
    applyProfileLanguage();
    profile$('#preferences-status').textContent = profileText('saveError');
  } finally {
    languageSelect.disabled = false;
    themeSelect.disabled = false;
  }
}

async function saveProfileName(event) {
  event.preventDefault();
  const form = profile$('#profile-name-form');
  const firstNameInput = profile$('#profile-first-name');
  const lastNameInput = profile$('#profile-last-name');
  const submitButton = form.querySelector('button[type="submit"]');
  if (!profileUser) {
    profile$('#profile-name-status').textContent = profileText('signedOut');
    return;
  }

  const firstName = firstNameInput.value.trim();
  const lastName = lastNameInput.value.trim();
  profile$('#profile-name-status').textContent = '';
  firstNameInput.disabled = true;
  lastNameInput.disabled = true;
  submitButton.disabled = true;
  submitButton.textContent = profileText('savingName');
  try {
    const response = await fetch('api/profile.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
      body: JSON.stringify({ firstName, lastName }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`);
    if (typeof result.firstName !== 'string' || typeof result.lastName !== 'string') {
      throw new Error('Invalid profile names');
    }

    profileNames = {
      firstName: result.firstName.trim(),
      lastName: result.lastName.trim(),
    };
    firstNameInput.value = profileNames.firstName;
    lastNameInput.value = profileNames.lastName;
    showProfile(profileUser);
    profile$('#profile-name-status').textContent = profileText('nameSaved');
    const parameters = new URLSearchParams(window.location.search);
    const courseId = parameters.get('course_id') || '';
    if (parameters.get('complete_name') === '1' && /^[a-z0-9-]{1,100}$/.test(courseId)) {
      const returnLink = profile$('#profile-name-continue');
      returnLink.href = `reconocimiento.php?id=${encodeURIComponent(courseId)}&lang=${profileLanguage}`;
      returnLink.hidden = false;
    }
  } catch (error) {
    console.error('Could not save profile names:', error);
    profile$('#profile-name-status').textContent = profileText('nameSaveError');
  } finally {
    firstNameInput.disabled = false;
    lastNameInput.disabled = false;
    submitButton.disabled = false;
    submitButton.textContent = profileText('saveName');
  }
}

profile$('#profile-language').addEventListener('change', savePreferences);
profile$('#profile-theme').addEventListener('change', savePreferences);
profile$('#profile-name-form').addEventListener('submit', saveProfileName);
profile$('#profile-name-toggle').addEventListener('click', () => {
  setProfileNameEditorOpen(profile$('#profile-name-form').hidden);
});

profile$('#profile-signout').addEventListener('click', async () => {
  const button = profile$('#profile-signout');
  button.disabled = true;
  try {
    const response = await fetch('api/auth.php?action=logout', {
      method: 'POST',
      headers: { 'X-CSRF-Token': csrfToken },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    localStorage.setItem('authChanged', String(Date.now()));
    window.location.replace('index.html');
  } catch (error) {
    console.error('Could not sign out:', error);
    profile$('#profile-status').textContent = profileText('logoutError');
  } finally {
    button.disabled = false;
  }
});

window.addEventListener('storage', (event) => {
  if (event.key === 'lang' && event.newValue) {
    try {
      const newLanguage = JSON.parse(event.newValue);
      if (['es', 'en'].includes(newLanguage)) {
        profileLanguage = newLanguage;
        profile$('#profile-language').value = newLanguage;
        applyProfileLanguage();
      }
    } catch (error) {
      console.error('Could not read the changed language preference:', error);
    }
  }
  if (event.key === 'theme' && event.newValue) {
    try {
      const newTheme = JSON.parse(event.newValue);
      if (['dark', 'light'].includes(newTheme)) {
        profile$('#profile-theme').value = newTheme;
        document.documentElement.dataset.theme = newTheme;
      }
    } catch (error) {
      console.error('Could not read the changed theme preference:', error);
    }
  }
  if (event.key === 'authChanged') loadProfile();
});

loadProfile();
