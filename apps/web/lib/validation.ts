// Shared client-side validation for the sign-in / sign-up forms (app/page.tsx).
// Supabase Auth re-validates server-side regardless — this only exists to give
// the user a specific, immediate reason instead of a silently-disabled button.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

export function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) return "Email address is required.";
  if (!isValidEmail(trimmed)) return "Enter a valid email address.";
  return null;
}

export function validatePassword(password: string, minLength = 6): string | null {
  if (!password) return "Password is required.";
  if (password.length < minLength) return `Password must be at least ${minLength} characters.`;
  return null;
}

export function validateRequired(value: string, label: string, minLength = 2): string | null {
  const trimmed = value.trim();
  if (!trimmed) return `${label} is required.`;
  if (trimmed.length < minLength) return `${label} must be at least ${minLength} characters.`;
  return null;
}

/** Returns the first non-null error among the given checks, or null if all pass. */
export function firstError(...errors: Array<string | null>): string | null {
  return errors.find((e) => e !== null) ?? null;
}
