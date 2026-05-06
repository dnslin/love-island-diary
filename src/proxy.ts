import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = (() => {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET environment variable is required');
  }
  return new TextEncoder().encode(secret);
})();

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 公开路径直接放行
  if (
    pathname === '/' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api')
  ) {
    return NextResponse.next();
  }

  // 读取并验证 JWT
  const token = request.cookies.get('love-diary-auth')?.value;
  let role: 'viewer' | 'admin' | null = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, SECRET, { clockTolerance: 60 });
      if (payload.role === 'viewer' || payload.role === 'admin') {
        role = payload.role as 'viewer' | 'admin';
      }
    } catch {
      // token 无效，保持 role = null
    }
  }

  // 看日记路径需要 viewer 或 admin
  const viewerPaths = ['/diary', '/memories', '/calendar'];
  const isViewerPath = viewerPaths.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (isViewerPath && !role) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 管理路径需要 admin
  const isAdminPath =
    pathname === '/diary/new' ||
    pathname === '/settings' ||
    pathname.startsWith('/settings/') ||
    pathname.endsWith('/edit');

  if (isAdminPath && role !== 'admin') {
    // /settings 允许未认证用户访问（首次设置引导）
    if (pathname === '/settings' && !role) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};
