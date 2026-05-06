import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET environment variable is required');
  }
  return new TextEncoder().encode(secret);
}

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
      const secret = getSecret();
      const { payload } = await jwtVerify(token, secret, { clockTolerance: 60 });
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

  // /settings 在首次引导时允许访问（CoupleProfile 不存在的情况由页面内逻辑处理）
  // 这里仅当已认证但不是 admin 时拦截；未认证用户访问 /settings 由页面内逻辑判断是否需要 redirect
  if (isAdminPath && role !== 'admin' && pathname !== '/settings') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};
