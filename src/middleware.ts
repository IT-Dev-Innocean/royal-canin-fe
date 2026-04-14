import { NextRequest, NextResponse } from 'next/server';

const VALID_VERIFICATION_PATHS = new Set([
  '/verification',
  '/verification/set-password',
]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/verification') &&
    !VALID_VERIFICATION_PATHS.has(pathname)
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/verification';
    url.search = '';
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon|assets|api/).*)'],
};
