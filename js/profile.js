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
  profile$('#profile-name').textContent = user.name;
  profile$('#profile-email').textContent = user.email;
  const picture = safeProfilePicture(user.picture);
  profile$('#profile-avatar').hidden = !picture;
  profile$('#profile-initials').hidden = Boolean(picture);
  profile$('#profile-initials').textContent = [...(user.name || user.email || '?')][0].toLocaleUpperCase();
  if (picture) profile$('#profile-avatar').src = picture;
  else profile$('#profile-avatar').removeAttribute('src');
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
    }
    showProfile(session.user);
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

profile$('#profile-language').addEventListener('change', savePreferences);
profile$('#profile-theme').addEventListener('change', savePreferences);

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
