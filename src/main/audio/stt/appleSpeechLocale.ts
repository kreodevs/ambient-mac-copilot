/** Maps app `stt.language` codes to BCP-47 locales for Apple Speech. */
export function toAppleSpeechLocale(language: string): string {
  if (language.includes('-')) return language

  const locales: Record<string, string> = {
    es: 'es-MX',
    en: 'en-US',
    fr: 'fr-FR',
    de: 'de-DE',
    it: 'it-IT',
    pt: 'pt-BR',
    ja: 'ja-JP',
    ko: 'ko-KR',
    zh: 'zh-CN',
  }

  return locales[language] ?? 'es-MX'
}
