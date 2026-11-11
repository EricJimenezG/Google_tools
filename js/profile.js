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
    saved: 'Preferencias guardadas en este navegador.',
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
    saved: 'Preferences saved in this browser.',
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
    showProfile(session.user);
  } catch (error) {
    console.error('Could not load profile:', error);
    profile$('#profile-status').textContent = profileText('loadError');
    profile$('#profile-details').hidden = true;
    profile$('#profile-signed-out').hidden = true;
  }
}

profile$('#profile-language').value = profileLanguage;
profile$('#profile-theme').value = storedPreference('theme', 'dark');
applyProfileLanguage();

profile$('#profile-language').addEventListener('change', (event) => {
  profileLanguage = event.target.value;
  localStorage.setItem('lang', JSON.stringify(profileLanguage));
  applyProfileLanguage();
  profile$('#preferences-status').textContent = profileText('saved');
});

profile$('#profile-theme').addEventListener('change', (event) => {
  document.documentElement.dataset.theme = event.target.value;
  localStorage.setItem('theme', JSON.stringify(event.target.value));
  profile$('#preferences-status').textContent = profileText('saved');
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
    csrfToken = '';
    showProfile(null);
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
