import { I18n } from 'i18n-js';
import { getLocales } from 'expo-localization';
import en from './locales/en.json';
import es from './locales/es.json';

const i18n = new I18n({
  en,
  es,
});

// Set the locale once at the beginning of your app
const deviceLocale = getLocales()?.[0]?.languageCode ?? 'en';
i18n.locale = deviceLocale;

// When a value is missing from a language it'll fallback to another language with the key present
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

export default i18n;
