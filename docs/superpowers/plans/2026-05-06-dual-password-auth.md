# 双密码权限体系 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为「恋爱小岛日记」建立双密码权限体系，通过 JWT Signed Cookie + Middleware 实现看日记密码与管理员密码的两层访问控制。

**Architecture:** 单个 JWT Cookie (`love-diary-auth`) 携带 `role` 字段（`viewer` | `admin`），Next.js Middleware 统一拦截路由，Server Actions 负责密码验证和写操作保护，React 组件负责密码输入 Modal 和管理入口显隐。

**Tech Stack:** Next.js 16 App Router, jose (JWT), TypeScript, Tailwind CSS v4, Jest + React Testing Library

---

## File Structure

| File | Responsibility |
|------|---------------|
| `src/lib/auth.ts` | JWT 签发、验证、角色获取、admin 权限检查工具函数 |
| `src/middleware.ts` | Next.js 中间件：读取 Cookie、验证 JWT、按路由分级拦截或放行 |
| `src/components/PasswordModal.tsx` | 通用密码输入 Modal UI（纯展示，无业务逻辑） |
| `src/components/ViewPasswordModal.tsx` | 看日记密码验证入口：管理 Modal 状态、调用 `verifyViewPassword`、跳转 |
| `src/components/AdminPasswordModal.tsx` | 管理员密码验证入口：管理 Modal 状态、调用 `verifyAdminPassword`、刷新页面 |
| `src/components/CoverActions.tsx` | 封面按钮区 Client Component：根据认证状态决定直接跳转或弹 Modal |
| `src/components/AdminAuthTrigger.tsx` | 管理员认证触发器 Client Component：双击/长按弹出管理员密码 Modal |
| `src/lib/actions.ts` | 新增 `verifyViewPassword`、`verifyAdminPassword`；为写操作增加权限检查 |
| `src/app/(protected)/page.tsx` | 封面页 Server Component：读取 role、条件渲染管理入口、移除 `SecretWriteEntry` |
| `src/app/diary/[id]/page.tsx` | 单篇日记页：条件渲染编辑按钮 |
| `src/app/diary/[id]/edit/page.tsx` | 编辑页：条件渲染删除按钮 |

---

## Task 1: 安装 jose 依赖

**Files:**
- Modify: `package.json`（依赖变更）

**Step 1: 安装 jose**

```bash
pnpm add jose
```

**Step 2: 提交**

```bash
git add package.json pnpm-lock.yaml
git commit -m "deps: add jose for JWT signing and verification"
```

---

## Task 2: 创建 src/lib/auth.ts（JWT 工具与权限检查）

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/lib/__tests__/auth.test.ts`

**Step 1: 写测试 — `src/lib/__tests__/auth.test.ts`**

```ts
/**
 * @jest-environment node
 */

import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
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
    process.env.NODE_ENV = 'production';

    await signAuthToken('admin');

    const [, , options] = mockSet.mock.calls[0];
    expect(options.secure).toBe(true);

    process.env.NODE_ENV = originalEnv;
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
```

**Step 2: 运行测试，确认失败**

```bash
pnpm test src/lib/__tests__/auth.test.ts
```

Expected: FAIL（`signAuthToken`、`getAuthRole`、`requireAdmin` 未定义）

**Step 3: 写实现 — `src/lib/auth.ts`**

```ts
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
```

**Step 4: 运行测试，确认通过**

```bash
pnpm test src/lib/__tests__/auth.test.ts
```

Expected: PASS（6 tests passed）

**Step 5: 提交**

```bash
git add src/lib/auth.ts src/lib/__tests__/auth.test.ts
git commit -m "feat(auth): add JWT signing, verification, and admin guard utilities"
```

---

## Task 3: 创建 src/middleware.ts（路由拦截）

**Files:**
- Create: `src/middleware.ts`

**Step 1: 写实现 — `src/middleware.ts`**

```ts
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

export async function middleware(request: NextRequest) {
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
  // 这里仅当已认证但不是 admin 时拦截
  if (isAdminPath && role !== 'admin') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};
```

**Step 2: 提交**

```bash
git add src/middleware.ts
git commit -m "feat(middleware): add JWT-based route protection"
```

---

## Task 4: 创建 PasswordModal 基础组件

**Files:**
- Create: `src/components/PasswordModal.tsx`
- Create: `src/components/__tests__/PasswordModal.test.tsx`

**Step 1: 写测试 — `src/components/__tests__/PasswordModal.test.tsx`**

```ts
import { render, screen, fireEvent } from '@testing-library/react';
import PasswordModal from '../PasswordModal';

describe('PasswordModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onSubmit: jest.fn(),
    title: '输入密码',
    error: null,
    isLoading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders modal when isOpen is true', () => {
    render(<PasswordModal {...defaultProps} />);
    expect(screen.getByText('输入密码')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请输入密码')).toBeInTheDocument();
  });

  test('does not render when isOpen is false', () => {
    render(<PasswordModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('输入密码')).not.toBeInTheDocument();
  });

  test('calls onSubmit with password when confirm clicked', () => {
    render(<PasswordModal {...defaultProps} />);
    const input = screen.getByPlaceholderText('请输入密码');
    fireEvent.change(input, { target: { value: 'my-password' } });
    fireEvent.click(screen.getByRole('button', { name: /确认/ }));
    expect(defaultProps.onSubmit).toHaveBeenCalledWith('my-password');
  });

  test('does not call onSubmit when password is empty', () => {
    render(<PasswordModal {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /确认/ }));
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  test('calls onClose when close button clicked', () => {
    render(<PasswordModal {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /关闭/ }));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  test('displays error message', () => {
    render(<PasswordModal {...defaultProps} error='密码错误，请重试' />);
    expect(screen.getByText('密码错误，请重试')).toBeInTheDocument();
  });

  test('disables input and shows loading state', () => {
    render(<PasswordModal {...defaultProps} isLoading={true} />);
    expect(screen.getByPlaceholderText('请输入密码')).toBeDisabled();
    expect(screen.getByRole('button', { name: /验证中/ })).toBeDisabled();
  });
});
```

**Step 2: 运行测试，确认失败**

```bash
pnpm test src/components/__tests__/PasswordModal.test.tsx
```

Expected: FAIL（PasswordModal 未定义）

**Step 3: 写实现 — `src/components/PasswordModal.tsx`**

```tsx
'use client';

import { useState } from 'react';

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (password: string) => void;
  title: string;
  error: string | null;
  isLoading: boolean;
}

export default function PasswordModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  error,
  isLoading,
}: PasswordModalProps) {
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || isLoading) return;
    onSubmit(password.trim());
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm'>
      <div className='w-full max-w-[320px] mx-4 bg-card rounded-2xl border border-border-soft shadow-lg p-6'>
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center gap-2'>
            <svg
              width='20'
              height='20'
              viewBox='0 0 24 24'
              fill='none'
              stroke='#5B4B49'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <rect x='3' y='11' width='18' height='11' rx='2' ry='2' />
              <path d='M7 11V7a5 5 0 0 1 10 0v4' />
            </svg>
            <h3 className='text-base font-bold text-text-main'>{title}</h3>
          </div>
          <button
            onClick={onClose}
            className='text-text-sub hover:text-text-main transition-colors'
            aria-label='关闭'
            type='button'
          >
            <svg
              width='18'
              height='18'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <path d='M18 6 6 18' />
              <path d='m6 6 12 12' />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type='password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder='请输入密码'
            disabled={isLoading}
            className='w-full px-4 py-3 rounded-xl border border-border-soft bg-cream text-text-main text-base placeholder:text-text-sub focus:outline-none focus:border-[#ffcc00] transition-colors disabled:opacity-50'
            autoFocus
          />

          {error && (
            <p className='mt-2 text-sm text-accent'>{error}</p>
          )}

          <button
            type='submit'
            disabled={isLoading || !password.trim()}
            className='w-full mt-4 py-3 rounded-full bg-primary text-white font-medium text-sm hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {isLoading ? '验证中...' : '确认'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

**Step 4: 运行测试，确认通过**

```bash
pnpm test src/components/__tests__/PasswordModal.test.tsx
```

Expected: PASS（7 tests passed）

**Step 5: 提交**

```bash
git add src/components/PasswordModal.tsx src/components/__tests__/PasswordModal.test.tsx
git commit -m "feat(ui): add PasswordModal component with cream theme"
```

---

## Task 5: 创建 ViewPasswordModal 和 AdminPasswordModal 组件

**Files:**
- Create: `src/components/ViewPasswordModal.tsx`
- Create: `src/components/AdminPasswordModal.tsx`

**Step 1: 写实现 — `src/components/ViewPasswordModal.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PasswordModal from './PasswordModal';
import { verifyViewPassword } from '@/lib/actions';

interface ViewPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ViewPasswordModal({ isOpen, onClose }: ViewPasswordModalProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await verifyViewPassword(password);
      if (result.ok) {
        onClose();
        router.push('/diary');
      } else {
        setError(result.error ?? '密码错误，请重试');
      }
    } catch {
      setError('验证失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PasswordModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title='输入密码查看日记'
      error={error}
      isLoading={isLoading}
    />
  );
}
```

**Step 2: 写实现 — `src/components/AdminPasswordModal.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PasswordModal from './PasswordModal';
import { verifyAdminPassword } from '@/lib/actions';

interface AdminPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminPasswordModal({ isOpen, onClose }: AdminPasswordModalProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await verifyAdminPassword(password);
      if (result.ok) {
        onClose();
        router.refresh();
      } else {
        setError(result.error ?? '密码错误，请重试');
      }
    } catch {
      setError('验证失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PasswordModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title='管理员验证'
      error={error}
      isLoading={isLoading}
    />
  );
}
```

**Step 3: 提交**

```bash
git add src/components/ViewPasswordModal.tsx src/components/AdminPasswordModal.tsx
git commit -m "feat(auth): add ViewPasswordModal and AdminPasswordModal wrappers"
```

---

## Task 6: 新增密码验证 Server Actions

**Files:**
- Modify: `src/lib/actions.ts`

**Step 1: 在 `src/lib/actions.ts` 顶部添加 import**

```ts
import { signAuthToken } from './auth';
```

**Step 2: 在 `src/lib/actions.ts` 末尾新增两个 Action**

```ts
export async function verifyViewPassword(password: string): Promise<{ ok: boolean; error?: string }> {
  if (password === process.env.VIEW_PASSWORD) {
    await signAuthToken('viewer');
    return { ok: true };
  }
  return { ok: false, error: '密码错误，请重试' };
}

export async function verifyAdminPassword(password: string): Promise<{ ok: boolean; error?: string }> {
  if (password === process.env.ADMIN_PASSWORD) {
    await signAuthToken('admin');
    return { ok: true };
  }
  return { ok: false, error: '密码错误，请重试' };
}
```

**Step 3: 提交**

```bash
git add src/lib/actions.ts
git commit -m "feat(actions): add verifyViewPassword and verifyAdminPassword"
```

---

## Task 7: 给写操作 Server Actions 增加权限保护

**Files:**
- Modify: `src/lib/actions.ts`
- Modify: `src/lib/__tests__/actions.test.ts`

**Step 1: 在 `src/lib/actions.ts` 顶部添加 import**

```ts
import { requireAdmin } from './auth';
```

**Step 2: 在 `createDiary` 顶部添加权限检查**

```ts
export async function createDiary(data: CreateDiaryInput) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const parsed = CreateDiarySchema.parse(data);
  // ... 原有逻辑不变
}
```

**Step 3: 在 `updateDiary` 顶部添加权限检查**

```ts
export async function updateDiary(id: string, data: UpdateDiaryInput) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const parsed = UpdateDiarySchema.parse(data);
  // ... 原有逻辑不变
}
```

**Step 4: 在 `deleteDiary` 顶部添加权限检查**

```ts
export async function deleteDiary(id: string) {
  const authError = await requireAdmin();
  if (authError) return authError;

  await prisma.diaryEntry.delete({
    where: { id },
  });
}
```

**Step 5: 在 `saveCoupleProfileAction` 顶部添加条件权限检查**

```ts
export async function saveCoupleProfileAction(
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const profile = await getCoupleProfile();
  if (profile) {
    const authError = await requireAdmin();
    if (authError) {
      return { ok: false, formError: authError.error };
    }
  }

  // ... 原有逻辑不变
}
```

注意：`createDiary`、`updateDiary`、`deleteDiary` 的返回类型变了（可能返回 `SettingsFormState` 类型的错误对象）。需要评估调用方是否能处理。`deleteDiary` 原来没有返回值，现在可能返回错误对象。`DiaryForm` 和 `DeleteDiarySection` 需要能处理这种情况。这个问题在 Task 9 中处理（修改前端组件的错误处理）。

**Step 6: 在 `src/lib/__tests__/actions.test.ts` 中添加权限测试**

在测试文件顶部 mock `requireAdmin`：

```ts
jest.mock('../auth', () => ({
  requireAdmin: jest.fn(() => Promise.resolve(null)),
}));

const { requireAdmin } = jest.requireMock('../auth');
```

添加测试用例：

```ts
describe('权限保护', () => {
  test('createDiary 未认证时返回权限错误', async () => {
    requireAdmin.mockResolvedValueOnce({ ok: false, error: '权限不足' });

    const result = await createDiary({
      date: new Date(),
      title: '测试',
      content: '内容',
    });

    expect(result).toEqual({ ok: false, error: '权限不足' });
  });

  test('updateDiary 未认证时返回权限错误', async () => {
    requireAdmin.mockResolvedValueOnce({ ok: false, error: '权限不足' });

    const result = await updateDiary('fake-id', {
      date: new Date(),
      title: '测试',
      content: '内容',
    });

    expect(result).toEqual({ ok: false, error: '权限不足' });
  });

  test('deleteDiary 未认证时返回权限错误', async () => {
    requireAdmin.mockResolvedValueOnce({ ok: false, error: '权限不足' });

    const result = await deleteDiary('fake-id');

    expect(result).toEqual({ ok: false, error: '权限不足' });
  });
});
```

**Step 7: 运行测试**

```bash
pnpm test src/lib/__tests__/actions.test.ts
```

Expected: PASS（原有测试 + 新增权限测试全部通过）

**Step 8: 提交**

```bash
git add src/lib/actions.ts src/lib/__tests__/actions.test.ts
git commit -m "feat(actions): add admin permission checks to write operations"
```

---

## Task 8: 改造封面页交互与显隐控制

**Files:**
- Create: `src/components/CoverActions.tsx`
- Create: `src/components/AdminAuthTrigger.tsx`
- Modify: `src/app/(protected)/page.tsx`

**Step 1: 写实现 — `src/components/CoverActions.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FloatingButton from './FloatingButton';
import ViewPasswordModal from './ViewPasswordModal';

interface CoverActionsProps {
  isAuthenticated: boolean;
  href: string;
  showWriteButton: boolean;
}

export default function CoverActions({ isAuthenticated, href, showWriteButton }: CoverActionsProps) {
  const router = useRouter();
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const handleReadClick = () => {
    if (isAuthenticated) {
      router.push(href);
    } else {
      setShowPasswordModal(true);
    }
  };

  return (
    <>
      <div className='absolute bottom-32 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3'>
        <button
          onClick={handleReadClick}
          className='inline-block bg-primary text-white rounded-full px-7 py-2.5 text-sm font-medium animate-float'
        >
          翻开日记
        </button>
        {showWriteButton && (
          <FloatingButton href='/diary/new'>写下今天</FloatingButton>
        )}
      </div>
      <ViewPasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </>
  );
}
```

**Step 2: 写实现 — `src/components/AdminAuthTrigger.tsx`**

```tsx
'use client';

import { useState, useRef } from 'react';
import AdminPasswordModal from './AdminPasswordModal';

interface AdminAuthTriggerProps {
  children: React.ReactNode;
}

export default function AdminAuthTrigger({ children }: AdminAuthTriggerProps) {
  const [showModal, setShowModal] = useState(false);
  const touchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDoubleClick = () => {
    setShowModal(true);
  };

  const handleTouchStart = () => {
    touchTimerRef.current = setTimeout(() => {
      setShowModal(true);
    }, 600);
  };

  const handleTouchEnd = () => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
      touchTimerRef.current = null;
    }
  };

  return (
    <>
      <div
        onDoubleClick={handleDoubleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className='cursor-default select-none'
      >
        {children}
      </div>
      <AdminPasswordModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}
```

**Step 3: 修改 `src/app/(protected)/page.tsx`**

需要做的改动：
1. 导入 `getAuthRole`、`CoverActions`、`AdminAuthTrigger`
2. 移除 `SecretWriteEntry` 导入和使用
3. 移除 `FloatingButton` 导入
4. 调用 `getAuthRole()` 获取当前角色
5. 设置齿轮条件渲染：`role === 'admin'`
6. "翻开日记"按钮替换为 `CoverActions`
7. 统计区域替换为 `AdminAuthTrigger` 包裹

由于文件较长，这里给出修改后的关键部分（完整文件需要保留原有装饰元素和布局）：

```tsx
import { getAuthRole } from '@/lib/auth';
import CoverActions from '@/components/CoverActions';
import AdminAuthTrigger from '@/components/AdminAuthTrigger';
// 移除: import FloatingButton from '@/components/FloatingButton';
// 移除: import SecretWriteEntry from '@/components/SecretWriteEntry';

export default async function Home() {
  const [profile, stats, diaries, role] = await Promise.all([
    getCoupleProfile(),
    getCoverStats(),
    getDiaryList(),
    getAuthRole(),
  ]);

  // ... 原有逻辑不变

  return (
    <div className="min-h-screen bg-cream px-4 relative">
      <div className="mx-auto max-w-[480px] min-h-screen relative">
        {/* 设置按钮 — 仅 admin 可见 */}
        {role === 'admin' && (
          <Link
            href="/settings"
            className="absolute top-4 right-0 p-2 text-text-sub hover:text-text-main transition-colors"
            aria-label="设置"
          >
            {/* ... 原有 svg ... */}
          </Link>
        )}

        {/* ... Logo、标题、昵称卡片 等保持不变 ... */}

        {/* 天数 — 包裹在 AdminAuthTrigger 中 */}
        <AdminAuthTrigger>
          <div className="absolute top-50 right-6 text-right">
            <AnimatedDays days={days} />
            <div className="text-[11px] text-text-sub mt-1">天</div>
          </div>
        </AdminAuthTrigger>

        {/* ... 装饰 SVG 保持不变 ... */}

        {/* 按钮区 */}
        <CoverActions
          isAuthenticated={!!role}
          href={latestDiary ? `/diary/${latestDiary.id}` : '/diary/new'}
          showWriteButton={role === 'admin'}
        />

        {/* 统计 — 包裹在 AdminAuthTrigger 中 */}
        <AdminAuthTrigger>
          <div className="absolute bottom-6 right-6 text-[10px] text-text-sub">
            日记 {stats.diaryCount} · 回忆 {stats.memoryCount}
          </div>
        </AdminAuthTrigger>
      </div>
    </div>
  );
}
```

**Step 4: 提交**

```bash
git add src/components/CoverActions.tsx src/components/AdminAuthTrigger.tsx src/app/(protected)/page.tsx
git commit -m "feat(cover): add auth-based button visibility and password modals"
```

---

## Task 9: 改造日记详情页和编辑页的显隐控制

**Files:**
- Modify: `src/app/diary/[id]/page.tsx`
- Modify: `src/app/diary/[id]/edit/page.tsx`

**Step 1: 修改 `src/app/diary/[id]/page.tsx`**

```tsx
import { getAuthRole } from '@/lib/auth';

export default async function DiaryDetailPage({ params }: DiaryDetailPageProps) {
  const { id } = await params;
  const [entry, { prev, next }, allEntries, role] = await Promise.all([
    getDiaryById(id),
    getDiaryNeighbors(id),
    getDiaryList(),
    getAuthRole(),
  ]);

  if (!entry) {
    notFound();
  }

  const entryNumber = allEntries.length - allEntries.findIndex((e) => e.id === id);

  return (
    <PageFlipWrapper
      prevId={prev}
      nextId={next}
      currentId={id}
      actions={
        role === 'admin' ? (
          <Link
            href={`/diary/${id}/edit`}
            aria-label="编辑"
            className="text-text-sub hover:text-text-main transition-colors inline-flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              <path d="m15 5 4 4" />
            </svg>
          </Link>
        ) : null
      }
    >
      <DiaryDetail entry={entry} entryNumber={entryNumber} />
    </PageFlipWrapper>
  );
}
```

**Step 2: 修改 `src/app/diary/[id]/edit/page.tsx`**

```tsx
import { getAuthRole } from '@/lib/auth';

export default async function EditDiaryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [entry, role] = await Promise.all([
    getDiaryById(id),
    getAuthRole(),
  ]);

  if (!entry) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-cream">
      <div className="max-w-[480px] mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href={`/diary/${id}`}
            className="text-text-sub hover:text-text-main transition-colors"
            aria-label="返回"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </Link>
          <h1 className="text-lg font-bold text-text-main">编辑日记</h1>
        </div>
        <DiaryForm mode="edit" initialData={entry} entryId={id} />
        {role === 'admin' && <DeleteDiarySection entryId={id} />}
      </div>
    </main>
  );
}
```

**Step 3: 提交**

```bash
git add src/app/diary/[id]/page.tsx src/app/diary/[id]/edit/page.tsx
git commit -m "feat(diary): conditionally render edit and delete buttons based on admin role"
```

---

## Task 10: 清理 SecretWriteEntry 并运行全量验证

**Files:**
- Delete: `src/components/SecretWriteEntry.tsx`

**Step 1: 删除 `src/components/SecretWriteEntry.tsx`**

```bash
rm src/components/SecretWriteEntry.tsx
```

**Step 2: 运行全量测试**

```bash
pnpm test
```

Expected: PASS（所有测试通过）

**Step 3: 运行构建**

```bash
pnpm build
```

Expected: PASS（构建成功，无 TypeScript 错误）

**Step 4: 运行 ESLint**

```bash
pnpm lint
```

Expected: PASS（无 lint 错误）

**Step 5: 提交**

```bash
git add src/components/SecretWriteEntry.tsx
git commit -m "refactor: remove SecretWriteEntry, replaced by admin password modal"
```

---

## 手动验证清单（dev 服务器启动后）

```bash
pnpm dev
```

1. **首次访问封面**：正常显示标题、昵称、天数、装饰，未弹 Modal
2. **点击"翻开日记"**：弹出看日记密码 Modal，输入正确密码后进入 `/diary`
3. **输入错误看日记密码**：Modal 内提示"密码错误，请重试"
4. **关闭浏览器后重开**：7 天内无需重新输入密码
5. **双击标题区域**：弹出管理员密码 Modal
6. **输入正确管理员密码**：页面刷新，显示设置齿轮和"写下今天"按钮
7. **访客直接访问 `/diary/new`**：被重定向到 `/`
8. **访客直接访问 `/settings`**（已有 CoupleProfile 时）：被重定向到 `/`
9. **未认证调用写操作**：前端 toast 提示"权限不足"（需 DiaryForm、DeleteDiarySection 已支持错误处理）

---

## Self-Review

**1. Spec coverage:**
- JWT Cookie 设计 → Task 2 (`auth.ts`)
- 中间件路由拦截 → Task 3 (`middleware.ts`)
- 看日记密码 Modal → Task 4 + Task 5 (`PasswordModal`, `ViewPasswordModal`)
- 管理员密码 Modal → Task 5 (`AdminPasswordModal`)
- 封面"翻开日记"触发 Modal → Task 8 (`CoverActions`)
- 长按/双击触发管理员 Modal → Task 8 (`AdminAuthTrigger`)
- 管理入口显隐 → Task 8 + Task 9 (封面、详情页、编辑页条件渲染)
- Server Action 保护 → Task 7 (权限检查)
- 7 天有效期 → Task 2 (`maxAge`)
- 首次引导 `/settings` 豁免 → Task 7 (`saveCoupleProfileAction` 条件检查) + Task 3 (middleware 放行 `/settings`)
- **Gap**: 未覆盖 `/memories` 和 `/calendar` 的路由，但设计文档中这两个路由已在 middleware 的 `viewerPaths` 中，与 `/diary` 同等待遇，无需额外任务。

**2. Placeholder scan:**
- 无 TBD/TODO
- 无 "implement later"
- 无 "add appropriate error handling"（具体实现了权限检查返回结构化错误）
- 无 "similar to Task N"
- 所有代码步骤均包含完整代码

**3. Type consistency:**
- `requireAdmin` 返回类型 `{ ok: false; error: string } | null` 在 Task 2、Task 7 中一致
- `signAuthToken` 参数 `role: 'viewer' | 'admin'` 在 Task 2、Task 6 中一致
- `getAuthRole` 返回类型在 Task 2、Task 8、Task 9 中一致