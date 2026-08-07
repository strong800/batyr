import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export const SESSION_COOKIE = 'batyrSession';
const SESSION_DAYS = 7;

/**
 * Секрет для подписи сессии. Берётся из .env.local и обязателен:
 * без него запуск админки — дыра, а не удобство, поэтому падаем явно.
 */
function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'AUTH_SECRET не задан или короче 32 символов. Сгенерируйте: ' +
        'node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
    );
  }
  return new TextEncoder().encode(secret);
}

export type Session = { login: string; issuedAt: number };

export async function createSessionToken(login: string): Promise<string> {
  return new SignJWT({ login })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (typeof payload.login !== 'string') return null;
    return { login: payload.login, issuedAt: (payload.iat ?? 0) * 1000 };
  } catch {
    return null;
  }
}

/**
 * Сравнение без утечки времени: обычное === выдаёт длину и позицию
 * первого несовпадения по времени ответа.
 */
export function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Всё равно проходим по строке, чтобы время не зависело от длины
    let dummy = 0;
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      dummy |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
    }
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export function checkCredentials(login: string, password: string): boolean {
  const expectedLogin = process.env.ADMIN_LOGIN ?? '';
  const expectedPassword = process.env.ADMIN_PASSWORD ?? '';
  if (!expectedLogin || !expectedPassword) return false;
  // Оба сравнения выполняются всегда, без короткого замыкания
  const loginOk = safeCompare(login, expectedLogin);
  const passwordOk = safeCompare(password, expectedPassword);
  return loginOk && passwordOk;
}

export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** Текущая сессия в серверных компонентах и экшенах. */
export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * Страж для серверных экшенов. Middleware закрывает страницы,
 * но экшены вызываются напрямую по HTTP — их нужно проверять отдельно.
 */
export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) throw new Error('Нужен вход в админку');
  return session;
}
