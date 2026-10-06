// Language of the Atlas Lens showcase: ?lang=zh|en, else the visitor's last choice, else the browser language.
const KEY = 'closure_atlas_lang';
const valid = v => (v === 'zh' || v === 'en' ? v : null);

export function getLang() {
  const fromUrl = valid(new URLSearchParams(location.search).get('lang'));
  if (fromUrl) return fromUrl;
  try {
    const saved = valid(localStorage.getItem(KEY));
    if (saved) return saved;
  } catch { /* storage may be blocked */ }
  return /^zh/i.test(navigator.language || '') ? 'zh' : 'en';
}

export function setLang(lang) {
  try { localStorage.setItem(KEY, lang); } catch { /* storage may be blocked */ }
}
