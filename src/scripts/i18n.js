// Lightweight client-side i18n runtime.
// Spanish (es) is the language authored directly in the markup and is treated
// as the default. English (en) and Korean (ko) come from the translations
// dictionary. Static nodes are tagged with `data-i18n` (textContent) or
// `data-i18n-html` (innerHTML); their original Spanish content is cached on
// first run so switching back to `es` restores it exactly.

import { STATIC, DYNAMIC } from '../i18n/translations.js';

const LANGS = ['es', 'en', 'ko'];
const STORAGE_KEY = 'portfolio-lang';

const getStored = () => {
	try {
		const v = localStorage.getItem(STORAGE_KEY);
		return LANGS.includes(v) ? v : 'es';
	} catch {
		return 'es';
	}
};

// Cache of original (Spanish) markup keyed by element.
const originalText = new WeakMap();
const originalHtml = new WeakMap();

const applyStatic = (lang) => {
	document.querySelectorAll('[data-i18n]').forEach((el) => {
		if (!originalText.has(el)) originalText.set(el, el.textContent);
		const key = el.getAttribute('data-i18n');
		const value = lang === 'es' ? originalText.get(el) : STATIC[lang]?.[key];
		el.textContent = value ?? originalText.get(el);
	});

	document.querySelectorAll('[data-i18n-html]').forEach((el) => {
		if (!originalHtml.has(el)) originalHtml.set(el, el.innerHTML);
		const key = el.getAttribute('data-i18n-html');
		const value = lang === 'es' ? originalHtml.get(el) : STATIC[lang]?.[key];
		el.innerHTML = value ?? originalHtml.get(el);
	});

	document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
		// format: "attr:key;attr2:key2"
		el.getAttribute('data-i18n-attr').split(';').forEach((pair) => {
			const [attr, key] = pair.split(':');
			if (!attr || !key) return;
			const cacheKey = `__i18n_attr_${attr}`;
			if (el[cacheKey] === undefined) el[cacheKey] = el.getAttribute(attr) ?? '';
			const value = lang === 'es' ? el[cacheKey] : STATIC[lang]?.[key];
			el.setAttribute(attr, value ?? el[cacheKey]);
		});
	});
};

// Translate a dynamic key (used by JS-generated content). Falls back to es.
const t = (key) => {
	const lang = window.__lang || 'es';
	return DYNAMIC[lang]?.[key] ?? DYNAMIC.es?.[key] ?? key;
};

export const setLang = (lang) => {
	if (!LANGS.includes(lang)) lang = 'es';
	window.__lang = lang;
	try {
		localStorage.setItem(STORAGE_KEY, lang);
	} catch {}
	document.documentElement.lang = lang;
	applyStatic(lang);
	document.dispatchEvent(new CustomEvent('i18n:change', { detail: { lang } }));
};

export const initI18n = () => {
	if (typeof document === 'undefined') return;
	window.__lang = getStored();
	window.t = t;
	window.setLang = setLang;

	const run = () => setLang(window.__lang);
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', run);
	} else {
		run();
	}
};
