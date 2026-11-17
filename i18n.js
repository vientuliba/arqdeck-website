import { translations } from './translations.js';

let language = 'lv';
export function t(key) {
  const entry = translations[key];
  if (!entry) throw new Error(`Missing translation: ${key}`);
  return entry[language];
}

export function setLanguage(nextLanguage) {
  if (!['lv', 'en'].includes(nextLanguage)) return;
  language = nextLanguage;
  document.documentElement.lang = language;

  document.querySelectorAll('[data-i18n]').forEach(element => {
    element.textContent = t(element.dataset.i18n);
  });
  for (const attribute of ['alt', 'aria-label', 'content']) {
    document.querySelectorAll(`[data-i18n-${attribute}]`).forEach(element => {
      element.setAttribute(attribute, t(element.getAttribute(`data-i18n-${attribute}`)));
    });
  }

  const button = document.getElementById('language-switch');
  button.setAttribute('aria-pressed', String(language === 'en'));
  document.getElementById('language-status').textContent = t('language.status');
  document.dispatchEvent(new CustomEvent('arqdeck:languagechange', { detail: { language } }));
}

// Every fresh page load starts in Latvian, independent of browser preferences.
// Native button activation supports pointer, touch, Enter and Space without moving focus.
document.getElementById('language-switch').addEventListener('click', () => {
  setLanguage(language === 'lv' ? 'en' : 'lv');
});

// An explicit English link is supported; the normal URL always defaults to Latvian.
if (new URLSearchParams(window.location.search).get('lang') === 'en') setLanguage('en');
