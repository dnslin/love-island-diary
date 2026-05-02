# 设置页 + 首次引导 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现 `/settings` 表单与首次引导守卫:CoupleProfile 不存在时强制跳转,允许首次创建与后续编辑。

**Architecture:** 新增 `(protected)` 路由组,其 `layout.tsx` (Server Component) 调用 `getCoupleProfile()` 缺失则 `redirect('/settings')`;封面 `/` 迁入该组。设置页用 React 19 `useActionState` + Server Action,zod 校验后 upsert 单例。

**Tech Stack:** Next.js 16 App Router (Server Components & Actions)、React 19、`useActionState`、Prisma、SQLite、zod、animal-island-ui (`Input`、`Button`)、Jest + ts-jest。

**Spec:** `docs/superpowers/specs/2026-05-02-settings-onboarding-design.md`

---

## File Structure

| 文件 | 操作 | 职责 |
|------|------|------|
| `src/lib/actions.ts` | 修改 | 新增 `saveCoupleProfileAction` 与 `SettingsFormState` 类型 |
| `src/lib/__tests__/actions.test.ts` | 修改 | 新增 `describe('saveCoupleProfileAction')` 三个用例 |
| `src/app/(protected)/layout.tsx` | 创建 | Server Component,profile 缺失则 redirect |
| `src/app/(protected)/page.tsx` | 创建(由 `src/app/page.tsx` 迁入) | 封面页;移除原内联 redirect |
| `src/app/page.tsx` | 删除 | 内容已迁入 (protected)/page.tsx |
| `src/app/settings/page.tsx` | 重写 | Server Component,取 profile 注入表单 |
| `src/components/SettingsForm.tsx` | 创建 | Client Component,useActionState 表单 |

---

## Task 1: Server Action — 拒绝未来日期(TDD 第一轮)

**Files:**
- Modify: `src/lib/__tests__/actions.test.ts`(顶部加 mock + 新 describe 块)
- Modify: `src/lib/actions.ts`(新增 type、ActionSchema、`saveCoupleProfileAction` 骨架)

**目标:** 建立 action 骨架 + 校验失败返回路径,确保未来日期被拒。

- [ ] **Step 1: 在测试文件顶部加 mock 与 dayjs 引入**

修改 `src/lib/__tests__/actions.test.ts` 顶部(在原有 import 之后追加):

```ts
import dayjs from 'dayjs';

jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('next/navigation', () => ({
  redirect: (url: string) => {
    const err = new Error(`NEXT_REDIRECT:${url}`);
    (err as Error & { digest?: string }).digest = `NEXT_REDIRECT;replace;${url};307;`;
    throw err;
  },
}));
```

并在文件顶部已有的 import 列表里追加 `saveCoupleProfileAction`:

```ts
import {
  // ...其他 import 保持
  saveCoupleProfileAction,
} from '../actions';
```

- [ ] **Step 2: 在文件末尾追加新的 describe 与第一个用例**

```ts
describe('saveCoupleProfileAction', () => {
  test('拒绝未来日期', async () => {
    const fd = new FormData();
    fd.set('personAName', '小兔子');
    fd.set('personBName', '大灰狼');
    fd.set('anniversaryDate', dayjs().add(1, 'day').format('YYYY-MM-DD'));
    fd.set('siteTitle', '');

    const state = await saveCoupleProfileAction({ ok: true }, fd);

    expect(state.ok).toBe(false);
    expect(state.fieldErrors?.anniversaryDate).toBe('在一起日期不能晚于今天');
  });
});
```

- [ ] **Step 3: 跑测试确认 FAIL(action 未导出)**

Run: `pnpm test -- --testPathPatterns=actions.test.ts -t "拒绝未来日期"`
Expected: FAIL,报 "saveCoupleProfileAction is not a function" 或 import 错误。

- [ ] **Step 4: 在 `src/lib/actions.ts` 新增类型与骨架**

在文件顶部 import 区域追加:

```ts
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
```

(注意:原文件已有 `import { CreateDiarySchema, ... } from './schemas';`,zod 自身可能未单独 import,需要新增。)

在文件末尾追加:

```ts
export type SettingsFormState = {
  ok: boolean;
  fieldErrors?: Partial<
    Record<'personAName' | 'personBName' | 'anniversaryDate' | 'siteTitle', string>
  >;
  formError?: string;
};

const SettingsActionSchema = z.object({
  personAName: z
    .string()
    .trim()
    .min(1, '请填写第一位的昵称')
    .max(50, '不超过 50 字'),
  personBName: z
    .string()
    .trim()
    .min(1, '请填写第二位的昵称')
    .max(50, '不超过 50 字'),
  anniversaryDate: z.coerce
    .date({ error: '请选择日期' })
    .refine((d) => d.getTime() <= Date.now(), '在一起日期不能晚于今天'),
  siteTitle: z.string().trim().max(100, '不超过 100 字').optional(),
});

function zodIssuesToFieldErrors(
  error: z.ZodError,
): SettingsFormState['fieldErrors'] {
  const fieldErrors: SettingsFormState['fieldErrors'] = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (
      typeof key === 'string' &&
      ['personAName', 'personBName', 'anniversaryDate', 'siteTitle'].includes(key)
    ) {
      const k = key as keyof NonNullable<SettingsFormState['fieldErrors']>;
      if (!fieldErrors[k]) fieldErrors[k] = issue.message;
    }
  }
  return fieldErrors;
}

export async function saveCoupleProfileAction(
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const parsed = SettingsActionSchema.safeParse({
    personAName: formData.get('personAName'),
    personBName: formData.get('personBName'),
    anniversaryDate: formData.get('anniversaryDate'),
    siteTitle: formData.get('siteTitle'),
  });

  if (!parsed.success) {
    return { ok: false, fieldErrors: zodIssuesToFieldErrors(parsed.error) };
  }

  const data = {
    ...parsed.data,
    siteTitle: parsed.data.siteTitle?.length ? parsed.data.siteTitle : undefined,
  };

  try {
    await updateCoupleProfile(data);
  } catch {
    return { ok: false, formError: '保存失败,请稍后重试' };
  }

  revalidatePath('/');
  redirect('/');
}
```

- [ ] **Step 5: 跑测试确认 PASS**

Run: `pnpm test -- --testPathPatterns=actions.test.ts -t "拒绝未来日期"`
Expected: PASS,且其他既有用例继续通过。

- [ ] **Step 6: 提交**

```bash
git add src/lib/actions.ts src/lib/__tests__/actions.test.ts
git commit -m "feat(actions): saveCoupleProfileAction 骨架 + 拒绝未来日期"
```

---

## Task 2: 拒绝空白姓名(TDD 第二轮)

**Files:**
- Modify: `src/lib/__tests__/actions.test.ts`

**目标:** 验证 trim().min(1) 能拦下纯空格姓名。

- [ ] **Step 1: 在 `describe('saveCoupleProfileAction')` 内新增用例**

```ts
test('拒绝空白姓名(trim 后为空)', async () => {
  const fd = new FormData();
  fd.set('personAName', '   ');
  fd.set('personBName', '大灰狼');
  fd.set('anniversaryDate', '2024-07-18');
  fd.set('siteTitle', '');

  const state = await saveCoupleProfileAction({ ok: true }, fd);

  expect(state.ok).toBe(false);
  expect(state.fieldErrors?.personAName).toBe('请填写第一位的昵称');
});
```

- [ ] **Step 2: 跑测试**

Run: `pnpm test -- --testPathPatterns=actions.test.ts -t "拒绝空白姓名"`
Expected: PASS(Task 1 已实现 trim,直接通过)。

- [ ] **Step 3: 提交**

```bash
git add src/lib/__tests__/actions.test.ts
git commit -m "test(actions): 拒绝空白姓名用例"
```

---

## Task 3: 成功路径(TDD 第三轮)

**Files:**
- Modify: `src/lib/__tests__/actions.test.ts`

**目标:** 校验通过后写入 DB,并触发 redirect。

- [ ] **Step 1: 在 `describe('saveCoupleProfileAction')` 内新增成功用例**

```ts
test('成功路径写入 profile 并 redirect 到 /', async () => {
  const fd = new FormData();
  fd.set('personAName', '小兔子');
  fd.set('personBName', '大灰狼');
  fd.set('anniversaryDate', '2024-07-18');
  fd.set('siteTitle', '恋爱小岛日记');

  await expect(
    saveCoupleProfileAction({ ok: true }, fd),
  ).rejects.toThrow('NEXT_REDIRECT:/');

  const profile = await prisma.coupleProfile.findFirst();
  expect(profile?.personAName).toBe('小兔子');
  expect(profile?.personBName).toBe('大灰狼');
  expect(profile?.siteTitle).toBe('恋爱小岛日记');
});

test('成功路径下空白 siteTitle 归一化为 null', async () => {
  const fd = new FormData();
  fd.set('personAName', '小兔子');
  fd.set('personBName', '大灰狼');
  fd.set('anniversaryDate', '2024-07-18');
  fd.set('siteTitle', '   ');

  await expect(
    saveCoupleProfileAction({ ok: true }, fd),
  ).rejects.toThrow('NEXT_REDIRECT:/');

  const profile = await prisma.coupleProfile.findFirst();
  expect(profile?.siteTitle).toBeNull();
});
```

- [ ] **Step 2: 跑全部 saveCoupleProfileAction 用例**

Run: `pnpm test -- --testPathPatterns=actions.test.ts -t "saveCoupleProfileAction"`
Expected: 4 个用例全部 PASS。

- [ ] **Step 3: 跑全套 jest**

Run: `pnpm test`
Expected: 既有用例 + 新增用例全部 PASS,无回归。

- [ ] **Step 4: 提交**

```bash
git add src/lib/__tests__/actions.test.ts
git commit -m "test(actions): saveCoupleProfileAction 成功路径与 siteTitle 归一化"
```

---

## Task 4: 路由组与守卫 layout

**Files:**
- Create: `src/app/(protected)/layout.tsx`
- Create: `src/app/(protected)/page.tsx`(从 `src/app/page.tsx` 迁移)
- Delete: `src/app/page.tsx`

**目标:** 建立 `(protected)` 路由组,layout 拦截无 profile 的请求;封面页迁入。

- [ ] **Step 1: 创建守卫 layout**

写入 `src/app/(protected)/layout.tsx`:

```tsx
import { redirect } from 'next/navigation';
import { getCoupleProfile } from '@/lib/actions';

export const dynamic = 'force-dynamic';

export default async function ProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const profile = await getCoupleProfile();
  if (!profile) {
    redirect('/settings');
  }
  return <>{children}</>;
}
```

- [ ] **Step 2: 把 src/app/page.tsx 迁到 (protected)/page.tsx,并去掉内联 redirect**

写入 `src/app/(protected)/page.tsx`(注意:删除原文件第 17-19 行 `if (!profile) redirect('/settings')`,因为 layout 已守卫;`profile` 在该路径下保证非空):

```tsx
import Link from 'next/link';
import dayjs from 'dayjs';
import { getCoupleProfile, getCoverStats } from '@/lib/actions';
import CoverLogo from '@/components/CoverLogo';
import AnimatedDays from '@/components/AnimatedDays';
import FloatingButton from '@/components/FloatingButton';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [profile, stats] = await Promise.all([
    getCoupleProfile(),
    getCoverStats(),
  ]);

  // layout 守卫已确保 profile 存在
  if (!profile) {
    return null;
  }

  const days = dayjs().diff(dayjs(profile.anniversaryDate), 'day');
  const formattedDate = dayjs(profile.anniversaryDate).format('YYYY.MM.DD');

  return (
    <div className="min-h-screen bg-cream px-4 relative">
      <div className="mx-auto max-w-[480px] min-h-screen relative">
        {/* 设置按钮 */}
        <Link
          href="/settings"
          className="absolute top-4 right-0 p-2 text-text-sub hover:text-text-main transition-colors"
          aria-label="设置"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </Link>

        {/* Logo */}
        <div className="absolute top-14 left-2">
          <CoverLogo />
        </div>

        {/* 标题 */}
        <div className="absolute top-16 left-16 text-[10px] text-text-sub tracking-[3px]">
          恋爱小岛日记
        </div>

        {/* 昵称卡片 */}
        <div className="absolute top-30 left-2 -rotate-2">
          <div className="bg-card border border-border-soft rounded-xl px-5 py-3 shadow-sm">
            <div className="text-[15px] font-bold text-text-main">
              {profile.personAName}{' '}
              <span className="text-accent">&</span>{' '}
              {profile.personBName}
            </div>
            <div className="text-[9px] text-text-sub mt-1">
              {formattedDate} — 至今
            </div>
          </div>
        </div>

        {/* 天数 */}
        <div className="absolute top-50 right-6 text-right">
          <AnimatedDays days={days} />
          <div className="text-[11px] text-text-sub mt-1">天</div>
        </div>

        {/* 按钮 */}
        <div className="absolute bottom-25 left-1/2 -translate-x-1/2">
          <FloatingButton href="/diary">翻开日记</FloatingButton>
        </div>

        {/* 统计 */}
        <div className="absolute bottom-6 right-6 text-[10px] text-text-sub">
          日记 {stats.diaryCount} · 回忆 {stats.memoryCount}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 删除旧的 src/app/page.tsx**

```bash
rm src/app/page.tsx
```

- [ ] **Step 4: 跑 lint + build,确保路由结构有效**

Run: `pnpm lint && pnpm build`
Expected: lint 无报错;build 输出 `/` 与 `/settings` 两条路由,无 "you cannot have two parallel pages" 之类的冲突。

- [ ] **Step 5: 提交**

```bash
git add -A
git commit -m "feat(routing): (protected) 路由组 + layout 守卫,封面页迁入"
```

---

## Task 5: SettingsForm 客户端组件

**Files:**
- Create: `src/components/SettingsForm.tsx`

**目标:** Client Component,useActionState 接 Server Action,字段 + 错误反馈 + loading。

- [ ] **Step 1: 创建组件**

写入 `src/components/SettingsForm.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { Input, Button } from 'animal-island-ui';
import dayjs from 'dayjs';
import {
  saveCoupleProfileAction,
  type SettingsFormState,
} from '@/lib/actions';

type Props = {
  initial: {
    personAName: string;
    personBName: string;
    anniversaryDate: Date;
    siteTitle: string | null;
  } | null;
};

const INITIAL_STATE: SettingsFormState = { ok: true };

export default function SettingsForm({ initial }: Props) {
  const [state, formAction, pending] = useActionState(
    saveCoupleProfileAction,
    INITIAL_STATE,
  );

  const isEdit = initial !== null;
  const today = dayjs().format('YYYY-MM-DD');
  const dateInputClass =
    'w-full h-10 px-3 rounded-lg border border-border-soft bg-card text-text-main outline-none focus:border-accent';

  return (
    <div className="min-h-screen bg-cream px-4 py-8">
      <div className="mx-auto max-w-[480px]">
        <h1 className="text-2xl font-bold text-text-main">
          {isEdit ? '修改情侣信息' : '告诉我们一些关于你们的事'}
        </h1>
        <p className="text-sm text-text-sub mt-2 mb-8">
          {isEdit ? '调整后保存,封面会立即更新' : '先留下你们的基本信息'}
        </p>

        {state.formError && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2 mb-4">
            {state.formError}
          </div>
        )}

        <form action={formAction} className="space-y-5">
          <div>
            <label
              htmlFor="personAName"
              className="block text-sm text-text-sub mb-1.5"
            >
              Ta 的昵称
            </label>
            <Input
              id="personAName"
              name="personAName"
              defaultValue={initial?.personAName ?? ''}
              maxLength={50}
              required
              status={state.fieldErrors?.personAName ? 'error' : undefined}
              disabled={pending}
            />
            {state.fieldErrors?.personAName && (
              <p className="text-xs text-red-500 mt-1">
                {state.fieldErrors.personAName}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="personBName"
              className="block text-sm text-text-sub mb-1.5"
            >
              你的昵称
            </label>
            <Input
              id="personBName"
              name="personBName"
              defaultValue={initial?.personBName ?? ''}
              maxLength={50}
              required
              status={state.fieldErrors?.personBName ? 'error' : undefined}
              disabled={pending}
            />
            {state.fieldErrors?.personBName && (
              <p className="text-xs text-red-500 mt-1">
                {state.fieldErrors.personBName}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="anniversaryDate"
              className="block text-sm text-text-sub mb-1.5"
            >
              在一起的日期
            </label>
            <input
              type="date"
              id="anniversaryDate"
              name="anniversaryDate"
              defaultValue={
                initial
                  ? dayjs(initial.anniversaryDate).format('YYYY-MM-DD')
                  : ''
              }
              max={today}
              required
              disabled={pending}
              className={dateInputClass}
            />
            {state.fieldErrors?.anniversaryDate && (
              <p className="text-xs text-red-500 mt-1">
                {state.fieldErrors.anniversaryDate}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="siteTitle"
              className="block text-sm text-text-sub mb-1.5"
            >
              网站标题（可选）
            </label>
            <Input
              id="siteTitle"
              name="siteTitle"
              defaultValue={initial?.siteTitle ?? ''}
              maxLength={100}
              placeholder="恋爱小岛日记"
              status={state.fieldErrors?.siteTitle ? 'error' : undefined}
              disabled={pending}
            />
            {state.fieldErrors?.siteTitle && (
              <p className="text-xs text-red-500 mt-1">
                {state.fieldErrors.siteTitle}
              </p>
            )}
          </div>

          <Button
            type="primary"
            htmlType="submit"
            block
            loading={pending}
            disabled={pending}
          >
            保存
          </Button>
        </form>

        {isEdit && (
          <Link
            href="/"
            className="text-center mt-4 block text-sm text-text-sub hover:text-text-main"
          >
            取消
          </Link>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 类型自检**

Run: `pnpm lint`
Expected: 无 ESLint / TS 报错(注意 `useActionState` 在 React 19 已 stable,types/react ^19 包含)。

- [ ] **Step 3: 提交**

```bash
git add src/components/SettingsForm.tsx
git commit -m "feat(components): SettingsForm 客户端表单(useActionState)"
```

---

## Task 6: 重写 settings 页(Server)

**Files:**
- Rewrite: `src/app/settings/page.tsx`

**目标:** Server Component 取 profile,渲染 `<SettingsForm initial=...>`。

- [ ] **Step 1: 用以下内容覆盖 src/app/settings/page.tsx**

```tsx
import { getCoupleProfile } from '@/lib/actions';
import SettingsForm from '@/components/SettingsForm';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const profile = await getCoupleProfile();

  const initial = profile
    ? {
        personAName: profile.personAName,
        personBName: profile.personBName,
        anniversaryDate: profile.anniversaryDate,
        siteTitle: profile.siteTitle,
      }
    : null;

  return <SettingsForm initial={initial} />;
}
```

- [ ] **Step 2: build 与 lint**

Run: `pnpm lint && pnpm build`
Expected: 全部通过,build 输出 `/` 与 `/settings` 路由。

- [ ] **Step 3: 提交**

```bash
git add src/app/settings/page.tsx
git commit -m "feat(settings): 设置页接入 SettingsForm,支持首次/编辑模式"
```

---

## Task 7: 收尾验证

**Files:** 无代码改动

**目标:** 跑全套校验 + 手动验证 4 条流程。

- [ ] **Step 1: 全套自动校验**

Run:
```bash
pnpm lint
pnpm test
pnpm build
```
Expected: 全部 PASS,无警告/错误。

- [ ] **Step 2: 手动验证流程 A — 首次引导**

```bash
rm -f prisma/dev.db
pnpm prisma migrate deploy   # 应用既有 migrations 创建空 DB
pnpm dev
```

浏览器打开 http://localhost:3000

预期:
1. `/` 自动跳转到 `/settings`
2. 标题为"告诉我们一些关于你们的事"
3. 无"取消"链接
4. 提交空姓名 → 该字段下方显示"请填写..."
5. 选未来日期 → input `max` 阻止;若手动 dispatch 表单,后端返回错误
6. 填合法值提交 → 跳转回 `/`,封面正确显示

- [ ] **Step 3: 手动验证流程 B — 再次进入(编辑模式)**

继续不重启:
1. 在封面右上角点齿轮进 `/settings`
2. 标题变为"修改情侣信息"
3. 字段已预填上一步的数据
4. 底部显示"取消"链接,点击返回 `/`
5. 修改昵称提交 → 跳回 `/`,新昵称生效
6. 在终端 `sqlite3 prisma/dev.db 'SELECT COUNT(*) FROM CoupleProfile;'` → 应为 1

- [ ] **Step 4: 手动验证流程 C — 守卫拦截**

```bash
rm -f prisma/dev.db
pnpm prisma migrate deploy
```

重启 dev server 后:
1. 直接访问 `/` → 跳到 `/settings`(layout 守卫起效)
2. 直接访问 `/settings` → 渲染空表单,**不被拦截**(无死循环)

- [ ] **Step 5: 提交收尾(若有 .gitignore 等小调整)**

```bash
git status
# 若一切干净,跳过本步;若有未跟踪文件,审查后再决定是否提交
```

- [ ] **Step 6: 关闭 Issue 引用**

无代码改动,留待 PR 合入主线后通过 PR 描述里 `Closes #5` 自动关闭。

---

## 备注

- **redirect 在 Server Action 中的行为**:`redirect('/')` 通过抛出 `NEXT_REDIRECT` 错误实现跳转。Action 函数本应返回 `Promise<SettingsFormState>`,但抛出错误会终止函数,客户端 useActionState 不会更新 state,而是浏览器接收 307 跳到 `/`。测试中 `rejects.toThrow()` 即为预期。
- **revalidatePath 在测试中**:由 `jest.mock('next/cache')` 替换为 noop,真实运行时则刷新封面缓存。
- **路由组 `(protected)`**:括号语法不会出现在 URL 中,纯组织作用;放在 group 内的页面与外部页面共享根 layout。
- **redirect 不可被 try/catch 包围**:伪代码已把 `redirect('/')` 放在 try/catch 之外,实施时务必保留该顺序。
