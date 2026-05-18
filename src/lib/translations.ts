/**
 * Returns the translated text for the current language.
 * Falls back to the default text if no translation exists.
 */
export function getTranslation(
  translations: Record<string, string> | undefined,
  defaultText: string,
  lang: string
): string {
  if (!translations) return defaultText;
  return translations[lang] || translations['ru'] || translations['en'] || defaultText;
}

/**
 * Helper to create a translations object from a default value
 */
export function createTranslations(
  langs: { ru?: string; en?: string; kz?: string } = {}
): Record<string, string> {
  const translations: Record<string, string> = {};
  if (langs.ru) translations.ru = langs.ru;
  if (langs.en) translations.en = langs.en;
  if (langs.kz) translations.kz = langs.kz;
  return translations;
}
