export type Locale = "ru" | "en";

export const LOCALES: Locale[] = ["ru", "en"];
export const LOCALE_COOKIE = "pulse_locale";

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "ru" || value === "en";
}

export function intlLocale(locale: Locale): string {
  return locale === "ru" ? "ru-RU" : "en-US";
}
