/**
 * @jest-environment node
 */

import { SignJWT } from 'jose';
import { signAuthToken, getAuthRole, requireAdmin } from '../auth';

const mockGet = jest.fn();
const mockSet = jest.fn();

jest.mock('next/headers', () => ({
  cookies: jest.fn(() =>
    Promise.resolve({
      get: mockGet,
      set: mockSet,
    }),
  ),
}));

beforeEach(() => {
  jest.clearAllMocks();
  process.env.AUTH_SECRET = 'test-secret-32-bytes-long!!!!!';
});

describe('signAuthToken', () => {
  test('sets love-diary-auth cookie with correct options', async () => {
    await signAuthToken('viewer');

    expect(mockSet).toHaveBeenCalledTimes(1);
    const [name, value, options] = mockSet.mock.calls[0];
    expect(name).toBe('love-diary-auth');
    expect(value).toBeTruthy();
    expect(options).toMatchObject({
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });
  });

  test('sets secure flag in production', async () => {
    const originalEnv = process.env.NODE_ENV;
    (process.env as { NODE_ENV: string }).NODE_ENV = 'production';

    await signAuthToken('admin');

    const [, , options] = mockSet.mock.calls[0];
    expect(options.secure).toBe(true);

    (process.env as { NODE_ENV: string }).NODE_ENV = originalEnv;
  });
});

describe('getAuthRole', () => {
  test('returns null when cookie is missing', async () => {
    mockGet.mockReturnValue(undefined);

    const role = await getAuthRole();
    expect(role).toBeNull();
  });

  test('returns role from valid token', async () => {
    const token = await new SignJWT({ role: 'viewer' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(new TextEncoder().encode(process.env.AUTH_SECRET));

    mockGet.mockReturnValue({ value: token });

    const role = await getAuthRole();
    expect(role).toBe('viewer');
  });

  test('returns null for expired token', async () => {
    const token = await new SignJWT({ role: 'viewer' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('-1h')
      .sign(new TextEncoder().encode(process.env.AUTH_SECRET));

    mockGet.mockReturnValue({ value: token });

    const role = await getAuthRole();
    expect(role).toBeNull();
  });

  test('returns null for tampered token', async () => {
    mockGet.mockReturnValue({ value: 'invalid-token' });

    const role = await getAuthRole();
    expect(role).toBeNull();
  });
});

describe('requireAdmin', () => {
  test('returns null when role is admin', async () => {
    const token = await new SignJWT({ role: 'admin' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(new TextEncoder().encode(process.env.AUTH_SECRET));

    mockGet.mockReturnValue({ value: token });

    const result = await requireAdmin();
    expect(result).toBeNull();
  });

  test('returns error object when role is viewer', async () => {
    const token = await new SignJWT({ role: 'viewer' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(new TextEncoder().encode(process.env.AUTH_SECRET));

    mockGet.mockReturnValue({ value: token });

    const result = await requireAdmin();
    expect(result).toEqual({ ok: false, error: '权限不足，请先登录' });
  });

  test('returns error object when not authenticated', async () => {
    mockGet.mockReturnValue(undefined);

    const result = await requireAdmin();
    expect(result).toEqual({ ok: false, error: '权限不足，请先登录' });
  });
});
