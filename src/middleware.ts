import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getCoupleProfile } from './lib/actions';

export async function middleware(request: NextRequest) {
  const profile = await getCoupleProfile();

  if (!profile && !request.nextUrl.pathname.startsWith('/settings')) {
    return NextResponse.redirect(new URL('/settings', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};
