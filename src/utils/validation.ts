/**
 * Shared input validation/sanitisation helpers so name & mobile rules are
 * identical everywhere.
 */

/** Strip everything except digits; cap length (default 10 for Indian mobiles). */
export const onlyDigits = (s: string, max = 10): string =>
  (s || '').replace(/\D/g, '').slice(0, max);

/** A valid display name: letters/spaces/.'- only, starts with a letter, ≥2 chars. */
export const isValidName = (s: string): boolean => {
  const t = (s || '').trim();
  return t.length >= 2 && /^[A-Za-z][A-Za-z .'-]*$/.test(t);
};

export const NAME_ERROR = 'Enter a valid name (letters only, at least 2 characters).';

/** A valid Indian mobile: exactly 10 digits starting 6-9. */
export const isValidMobile = (s: string): boolean => /^[6-9]\d{9}$/.test(onlyDigits(s));

export const MOBILE_ERROR = 'Enter a valid 10-digit mobile number (starting 6-9).';
