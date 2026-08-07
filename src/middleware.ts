import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth';

/**
 * Защита админки. Всё под /admin, кроме страницы входа,
 * требует действующей подписанной куки.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/admin/login') {
    // Уже вошедших уводим внутрь, чтобы не показывать форму зря
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (token && (await verifySessionToken(token))) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    const loginUrl = new URL('/admin/login', request.url);
    // Запоминаем, куда человек шёл, чтобы вернуть после входа
    if (pathname !== '/admin') loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
