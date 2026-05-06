'use server';

import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET environment variable is required');
  }
  return new TextEncoder().encode(secret);
}

export async function signAuthToken(role: 'viewer' | 'admin') {
  const secret = getSecret();
  const token = await new SignJWT({ role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);

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
  const secret = getSecret();
  const cookieStore = await cookies();
  const token = cookieStore.get('love-diary-auth')?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret, { clockTolerance: 60 });
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
