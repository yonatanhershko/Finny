/** Form checks. Each returns an i18n key for the problem, or null when fine. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
