/** Form checks. Each returns an i18n key for the problem, or null when fine. */
// Letters, digits and the usual . _ % + - in the name; a real domain with a 2+ letter ending.
// Catches typos such as "g,ail.com" before the server has to reject them.
const EMAIL = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

export const MIN_PASSWORD_LENGTH = 8;

export function checkName(value: string): string | null {
  return value.trim().length >= 2 ? null : 'auth.errors.nameRequired';
}

export function checkEmail(value: string): string | null {
  return EMAIL.test(value.trim()) ? null : 'auth.errors.emailInvalid';
}

export function checkPassword(value: string): string | null {
  return value.length >= MIN_PASSWORD_LENGTH ? null : 'auth.errors.passwordShort';
}
