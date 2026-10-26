import crypto from 'node:crypto';
import type { AstroCookies } from 'astro';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ppg2026-syifa';
const ADMIN_SECRET = process.env.ADMIN_SESSION_SECRET || 'ppg-ahmad-nursyifa-secure-secret-2026';
const COOKIE_NAME = 'admin_session';

/**
 * Safely compares two strings using constant-time comparison to prevent timing attacks
 */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Verifies admin credentials
 */
export function verifyCredentials(username: string, password: string): boolean {
  if (!username || !password) return false;
  return safeEqual(username.trim(), ADMIN_USERNAME) && safeEqual(password, ADMIN_PASSWORD);
}

/**
 * Creates a signed HMAC-SHA256 session token valid for 7 days
 */
export function createSessionToken(): string {
  const payload = Buffer.from(
    JSON.stringify({
      user: ADMIN_USERNAME,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
    })
  ).toString('base64url');

  const signature = crypto
    .createHmac('sha256', ADMIN_SECRET)
    .update(payload)
    .digest('base64url');

  return `${payload}.${signature}`;
}

/**
 * Verifies if a given session token is valid and not expired
 */
export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token || typeof token !== 'string') return false;

  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [payload, signature] = parts;
  const expectedSig = crypto
    .createHmac('sha256', ADMIN_SECRET)
    .update(payload)
    .digest('base64url');

  if (!safeEqual(signature, expectedSig)) return false;

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
    if (!data.exp || typeof data.exp !== 'number') return false;
    return Date.now() < data.exp;
  } catch {
    return false;
  }
}

/**
 * Helper to check if the current request has a valid admin session cookie
 */
export function isAdminAuthenticated(cookies: AstroCookies): boolean {
  const cookie = cookies.get(COOKIE_NAME);
  return verifySessionToken(cookie?.value);
}

/**
 * Sets the admin session cookie (HTTP-only, Lax, 7 days)
 */
export function setAdminSession(cookies: AstroCookies): void {
  const token = createSessionToken();
  cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  });
}

/**
 * Clears the admin session cookie
 */
export function clearAdminSession(cookies: AstroCookies): void {
  cookies.delete(COOKIE_NAME, {
    path: '/',
  });
}
