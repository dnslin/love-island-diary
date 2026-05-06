'use server';

import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

let secretCache: Uint8Array | null = null;

function getSecret(): Uint8Array {
  if (secretCache) return secretCache;
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET environment variable is required');
  }
  secretCache = new TextEncoder().encode(secret);
  return secretCache;
}

export async function signAuthToken(role: 'viewer' | 'admin') {
  const token = await new SignJWT({ role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set('love-diary-auth', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  });
}

export async function getAuthRole(): Promise<'viewer' | 'admin' | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('love-diary-auth')?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret(), { clockTolerance: 60 });
    if (payload.role === 'viewer' || payload.role === 'admin') {
      return payload.role as 'viewer' | 'admin';
    }
    return null;
  } catch {
    return null;
  }
}

export async function requireAdmin(): Promise<{ ok: false; error: string } | null> {
  const role = await getAuthRole();
  if (role !== 'admin') {
    return { ok: false, error: '权限不足，请先登录' };
  }
  return null;
}
