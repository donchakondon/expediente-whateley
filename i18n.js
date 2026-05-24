/* =============================
   i18n — Carga ES/EN, aplica traducciones, notifica suscriptores
   ============================= */

const I18N = (() => {
  const SUPPORTED = ['es', 'en'];
  const DEFAULT_LANG = 'es';
  const STORAGE_KEY = 'expediente.lang';

  let currentLang = DEFAULT_LANG;
  let dictionary = {};
  const subscribers = [];

  function getStoredLang() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && SUPPORTED.includes(stored)) return stored;
    } catch (_) {}
    const browser = (navigator.language || '').slice(0, 2).toLowerCase();
    if (SUPPORTED.includes(browser)) return browser;
    return DEFAULT_LANG;
  }

  function setStoredLang(lang) {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (_) {}
  }

  async function loadDictionary(lang) {
    const res = await fetch(`textos-${lang}.json?v=2`, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`No se pudo cargar idioma ${lang}`);
    return await res.json();
  }

  function pluck(path, dict) {
    return path.split('.').reduce((acc, k) => (acc && acc[k] !== undefined ? acc[k] : null), dict);
  }

  function applyTranslations() {
    document.documentElement.lang = currentLang;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const value = pluck(key, dictionary);
      if (typeof value === 'string') {
        el.textContent = value;
      }
    });
    updateLangButtons();
    subscribers.forEach(fn => {
      try { fn(dictionary, currentLang); } catch (e) { console.error('[i18n subscriber]', e); }
    });
  }

  function updateLangButtons() {
    document.querySelectorAll('.lang-btn').forEach(btn => {
      const lang = btn.getAttribute('data-lang');
      btn.classList.toggle('is-active', lang === currentLang);
    });
  }

  async function setLanguage(lang) {
    if (!SUPPORTED.includes(lang)) return;
    if (lang === currentLang && Object.keys(dictionary).length) {
      applyTranslations();
      return;
    }
    currentLang = lang;
    dictionary = await loadDictionary(lang);
    setStoredLang(lang);
    applyTranslations();
  }

  function onChange(fn) {
    subscribers.push(fn);
    if (Object.keys(dictionary).length) {
      try { fn(dictionary, currentLang); } catch (e) { console.error('[i18n subscriber init]', e); }
    }
  }

  async function init() {
    const initial = getStoredLang();
    await setLanguage(initial);
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const lang = btn.getAttribute('data-lang');
        setLanguage(lang);
      });
    });
  }

  return {
    init,
    setLanguage,
    onChange,
    pluck: (path) => pluck(path, dictionary),
    get currentLang() { return currentLang; },
    get dict() { return dictionary; }
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  I18N.init().catch(err => console.error('[i18n]', err));
});
