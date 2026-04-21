/**
 * i18n — Localization module for Spin Merge
 * Agent 6: Integrator
 *
 * Loads locale JSON based on SDK language, provides t() for translations.
 * Fallback chain: current locale → English → raw key.
 */

import ruStrings from './ru.json';
import enStrings from './en.json';

// ─── Types ──────────────────────────────────────────

type LocaleData = Record<string, string>;

// ─── State ──────────────────────────────────────────

let currentLocale: LocaleData = ruStrings;
let fallbackLocale: LocaleData = enStrings;
let currentLang = 'ru';

// ─── Public API ─────────────────────────────────────

/**
 * Load locale by language code.
 * Supported: 'ru', 'en'. Anything else falls back to 'ru'.
 */
export function loadLocale(lang: string): void {
  currentLang = lang;

  switch (lang) {
    case 'en':
      currentLocale = enStrings;
      fallbackLocale = enStrings;
      break;
    case 'ru':
    default:
      currentLocale = ruStrings;
      fallbackLocale = enStrings;
      break;
  }

  console.log(`[i18n] Loaded locale: ${currentLang}`);
}

/**
 * Get translated string by key.
 * Fallback chain: current locale → English → key itself.
 */
export function t(key: string): string {
  return currentLocale[key] ?? fallbackLocale[key] ?? key;
}

/** Get current language code */
export function getCurrentLang(): string {
  return currentLang;
}
