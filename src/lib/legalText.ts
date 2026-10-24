// Textos legales según el idioma. El español es el que vale; el inglés es una traducción de referencia.
import { DISCLAIMER, OPTIONAL_CHECKS, PRIVACY, REQUIRED_CHECKS, TERMS } from './legal.ts';
import { DISCLAIMER_EN, OPTIONAL_CHECKS_EN, PRIVACY_EN, REQUIRED_CHECKS_EN, TERMS_EN } from './legal.en.ts';
import type { Lang } from './i18n.ts';

export function legalText(lang: Lang) {
  return lang === 'en'
    ? { required: REQUIRED_CHECKS_EN, optional: OPTIONAL_CHECKS_EN, sections: [DISCLAIMER_EN, TERMS_EN, PRIVACY_EN] }
    : { required: REQUIRED_CHECKS, optional: OPTIONAL_CHECKS, sections: [DISCLAIMER, TERMS, PRIVACY] };
}
