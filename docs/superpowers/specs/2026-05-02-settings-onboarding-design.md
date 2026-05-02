# 设置页 + 首次引导 — 设计文档

## 来源

- Issue #5: [M2] 设置页 + 首次引导：CoupleProfile 表单 + 中间件重定向

## 背景

项目存储情侣双方的基本信息（昵称、在一起日期、网站标题）。首次访问无该数据时必须强制引导填写；之后允许修改。当前 `/settings` 仅是占位页，封面 `/` 已有内联的 `redirect('/settings')` 检查，但其他后续路由（`/diary` 等尚未实现）需要统一拦截策略。

## 决策摘要

| 决策点 | 选定方案 | 备选 |
|---|---|---|
| 拦截层 | (protected) 路由组 + Server Component layout 守卫 | nodejs middleware / 逐页自检 |
| 表单提交 | React 19 `useActionState` + Server Action 接 FormData | useState + onSubmit |
| 路由组迁移 | 将现有 `/` 封面页迁入 `(protected)`，删除其内联 redirect | 仅为未来路由设 layout |
| 日期控件 | 原生 `<input type="date">` | animal-island-ui Select 拼装 |

## 架构

### 路由结构

```
src/app/
├── layout.tsx                  # 根布局（不变）
├── (protected)/
│   ├── layout.tsx              # 新增：getCoupleProfile() 缺失则 redirect('/settings')
│   └── page.tsx                # 从 src/app/page.tsx 迁入；删除内联 redirect
└── settings/
    └── page.tsx                # 重写：Server Component + 客户端表单
```

`(protected)/layout.tsx` 是 Server Component，每次请求执行一次 `getCoupleProfile()`。`/settings` 物理上不在该 group 内，天然规避死循环。后续 `/diary`、`/diary/[id]`、`/memories`、`/calendar` 等需要 profile 的路由直接迁入 `(protected)/` 即可复用守卫。

### 组件拆分

| 文件 | 类型 | 职责 |
|------|------|------|
| `src/app/(protected)/layout.tsx` | Server | 调用 `getCoupleProfile()`；缺失则 `redirect('/settings')` |
| `src/app/(protected)/page.tsx` | Server | 封面页（迁移自 `src/app/page.tsx`，移除内部 redirect 与重复检查） |
| `src/app/settings/page.tsx` | Server | 取 profile，渲染 `<SettingsForm initial={profile ?? null} />` |
| `src/components/SettingsForm.tsx` | Client | `useActionState` 调用 action；字段输入；错误展示；loading |
| `src/lib/actions.ts` | Server | 新增 `saveCoupleProfileAction(prevState, formData)`；保留并复用既有 `updateCoupleProfile` |

## 数据流

```
用户访问任意 (protected) 路径
   ↓
(protected)/layout.tsx 执行 getCoupleProfile()
   ↓
   ├── profile 存在 → 渲染子页面
   └── profile 不存在 → redirect('/settings')

用户访问 /settings
   ↓
settings/page.tsx 执行 getCoupleProfile()
   ↓
   ├── profile 存在 → 渲染 SettingsForm（编辑模式，预填）
   └── profile 不存在 → 渲染 SettingsForm（首次模式，空表单）

用户提交表单
   ↓
saveCoupleProfileAction(prevState, formData)
   ↓
   ├── zod 校验失败 → return { ok: false, fieldErrors }
   ├── 未来日期 → return { ok: false, fieldErrors: { anniversaryDate } }
   ├── DB 异常 → return { ok: false, formError: '保存失败,请稍后重试' }
   └── 成功 → revalidatePath('/') + redirect('/')
```

## Server Action

### 函数签名

```ts
type SettingsFormState = {
  ok: boolean;
  fieldErrors?: Partial<Record<
    'personAName' | 'personBName' | 'anniversaryDate' | 'siteTitle',
    string
  >>;
  formError?: string;
};

export async function saveCoupleProfileAction(
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState>;
```

### 校验逻辑

1. 从 FormData 取 4 字段：personAName, personBName, anniversaryDate, siteTitle
2. 用 action 内构建的 `ActionSchema`（含 trim、自定义错误信息、未来日期 refine）`safeParse`
3. 任一失败 → 收集 zod issue 到 `fieldErrors`，返回 `{ ok: false, fieldErrors }`
4. 全部通过 → 把 trim 后为空字符串的 `siteTitle` 归一化为 `undefined`（避免下游 DB 存空串），然后调用既有 `updateCoupleProfile(normalized)`
5. DB 异常 → 捕获返回 `{ ok: false, formError: '保存失败,请稍后重试' }`
6. 成功 → `revalidatePath('/')`，最后 `redirect('/')`

> `redirect('/')` 必须在 try/catch 之外。Next.js 通过抛出 NEXT_REDIRECT 错误实现页面跳转，若被通用 catch 吞掉会导致 Action 静默返回，浏览器停留在表单页。

### 控制流伪代码

```ts
const parsed = ActionSchema.safeParse({
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
```

### Schema 增量

`src/lib/schemas.ts` 中既有 `CoupleProfileSchema`：

```ts
export const CoupleProfileSchema = z.object({
  personAName: z.string().min(1).max(50),
  personBName: z.string().min(1).max(50),
  anniversaryDate: z.coerce.date(),
  siteTitle: z.string().max(100).optional(),
});
```

在 action 内独立构造一份增强版 schema（不污染 schemas.ts 的纯结构定义，本地承担用户友好错误信息和业务规则）：

```ts
const ActionSchema = z.object({
  personAName: z.string().trim().min(1, '请填写第一位的昵称').max(50, '不超过 50 字'),
  personBName: z.string().trim().min(1, '请填写第二位的昵称').max(50, '不超过 50 字'),
  anniversaryDate: z.coerce
    .date({ error: '请选择日期' })
    .refine((d) => d.getTime() <= Date.now(), '在一起日期不能晚于今天'),
  siteTitle: z.string().trim().max(100, '不超过 100 字').optional(),
});
```

> 优先使用 `trim().min(1)` 而非 `nonempty()`,避免全空白通过校验;`siteTitle` 在 action 内将 trim 后空串归一化为 undefined,确保数据库存 null。

## SettingsForm 组件

### Props

```ts
type Props = {
  initial: {
    personAName: string;
    personBName: string;
    anniversaryDate: Date;
    siteTitle: string | null;
  } | null;
};
```

### 行为

- `useActionState(saveCoupleProfileAction, { ok: true })` 取 `[state, formAction, pending]`
- `<form action={formAction}>` 直接对接 Server Action
- 各字段使用 `defaultValue={initial?.x}` 而非受控 state（提交时由 FormData 收集）
- 错误从 `state.fieldErrors[name]` 取，红色小字显示在该 Input 下方
- 顶部 `state.formError` 显示通用错误条幅
- `<Button loading={pending} disabled={pending}>` 防重复点击
- 标题区根据 `initial` 是否为 null 切换：
  - `null` → "告诉我们一些关于你们的事" + 副标题"先留下你们的基本信息"
  - 非 null → "修改情侣信息" + 副标题"调整后保存,封面会立即更新"

### 布局

```
┌────────────────────────────────┐
│  告诉我们一些关于你们的事        │  ← h1 跳跳体 大字
│  先留下你们的基本信息            │  ← p 次级文字
│                                │
│  [Top Banner 错误条幅 (条件)]   │
│                                │
│  Ta 的昵称                      │
│  [ Input personAName        ]  │
│  [字段错误,如有]                │
│                                │
│  你的昵称                       │
│  [ Input personBName        ]  │
│  [字段错误,如有]                │
│                                │
│  在一起的日期                   │
│  [ <input type=date>         ] │
│  [字段错误,如有]                │
│                                │
│  网站标题（可选）               │
│  [ Input siteTitle          ]  │
│                                │
│  [    保存（Button block）     ]│
│                                │
│  ← 取消（仅编辑模式）           │
└────────────────────────────────┘
```

### CSS / Tailwind

- 容器：`min-h-screen bg-cream px-4 py-8`
- 内层：`mx-auto max-w-[480px]`
- 标题：`text-2xl font-bold text-text-main`
- 副标题：`text-sm text-text-sub mt-2 mb-8`
- 字段组：`space-y-5`
- 字段标签：`block text-sm text-text-sub mb-1.5`
- 字段错误：`text-xs text-red-500 mt-1`
- 顶部错误条幅：`bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2 mb-4`
- 日期 input：补一个 className 让它和 animal-island-ui Input 视觉对齐(`w-full h-10 px-3 rounded-lg border border-border-soft bg-card text-text-main`)
- 保存按钮：`block` 撑满
- 取消链接：`text-center mt-4 block text-sm text-text-sub hover:text-text-main`

## 边界情况

| 场景 | 行为 |
|------|------|
| 名字 trim 后为空 | zod trim().min(1)，下方："请填写昵称" |
| 名字超 50 字符 | `<Input maxLength={50}>` 客户端阻止 + zod 兜底 |
| anniversaryDate 未来日期 | `<input max={today}>` 客户端阻止 + zod refine 兜底，下方："在一起日期不能晚于今天" |
| anniversaryDate 留空 | HTML required + zod coerce 失败，下方："请选择日期" |
| siteTitle 超 100 字符 | `maxLength={100}` 限制 |
| siteTitle 留空 | 允许，存 null（schema optional），下游用默认"恋爱小岛日记" |
| 提交期间再次点击 | `Button.loading={pending}` + `disabled={pending}` 双重保护 |
| Server Action DB 异常 | 顶部红色条幅 "保存失败,请稍后重试"；表单内字段值保留（defaultValue 不变） |
| 保存成功 | `revalidatePath('/')` + `redirect('/')`，封面立即取最新 profile |
| 编辑模式预填后立即保存 | 同 update 路径，updatedAt 自动刷新 |
| 用户已设置后访问 `/settings` | 渲染编辑模式 |
| 跳过 (protected) layout | layout.tsx 必经，无法绕过；任何 `(protected)/**` 子路由都被守卫 |
| profile 存在但姓名为空（脏数据） | 编辑模式预填空字符串，提交时被 trim().min(1) 拦下 |
| 用户在编辑页直接修改 URL 跳到 `/settings` | 不在 (protected) 内，无守卫，正常渲染 |
| 同一时刻多个标签页同时编辑 | upsert 单例 id='profile'，最后保存者胜出（业务可接受） |

## 测试

仅扩展 Server Action 行为，组件层（client useActionState）测试成本高且当前未配置 RTL，本期跳过。

`src/lib/__tests__/actions.test.ts` 中 `describe('CoupleProfile Actions')` 增补：

```ts
describe('saveCoupleProfileAction', () => {
  test('拒绝未来日期', async () => {
    const fd = new FormData();
    fd.set('personAName', '小兔子');
    fd.set('personBName', '大灰狼');
    fd.set('anniversaryDate', dayjs().add(1, 'day').format('YYYY-MM-DD'));
    const state = await saveCoupleProfileAction({ ok: true }, fd);
    expect(state.ok).toBe(false);
    expect(state.fieldErrors?.anniversaryDate).toBeTruthy();
  });

  test('拒绝空白姓名', async () => {
    const fd = new FormData();
    fd.set('personAName', '   ');
    fd.set('personBName', '大灰狼');
    fd.set('anniversaryDate', '2024-07-18');
    const state = await saveCoupleProfileAction({ ok: true }, fd);
    expect(state.ok).toBe(false);
    expect(state.fieldErrors?.personAName).toBeTruthy();
  });

  test('成功路径调用 updateCoupleProfile', async () => {
    const fd = new FormData();
    fd.set('personAName', '小兔子');
    fd.set('personBName', '大灰狼');
    fd.set('anniversaryDate', '2024-07-18');
    fd.set('siteTitle', '恋爱小岛日记');
    // 预期 redirect 抛出 NEXT_REDIRECT，捕获即可
    await expect(saveCoupleProfileAction({ ok: true }, fd)).rejects.toThrow();
    const profile = await prisma.coupleProfile.findFirst();
    expect(profile?.personAName).toBe('小兔子');
  });
});
```

> redirect() 在 Server Action 中通过抛出特殊错误实现页面跳转，测试中 `rejects.toThrow()` 是预期行为，并非 bug。

## 与 Issue #5 验收映射

| Issue 验收项 | 实现位置 |
|---|---|
| 首次访问 `/` 不存在则重定向 `/settings` | `src/app/(protected)/layout.tsx` |
| 设置页表单 4 字段 | `SettingsForm.tsx` |
| 提交后创建 CoupleProfile | `saveCoupleProfileAction` → `updateCoupleProfile`（upsert） |
| 创建成功后跳转到 `/` | action 内 `redirect('/')` |
| 已设置后访问 `/settings` 可以修改 | `settings/page.tsx` 取 profile 作为 `initial` |
| 修改后 updatedAt 自动更新 | Prisma `@updatedAt` 装饰器 |
| 使用 animal-island-ui Input | `personAName/personBName/siteTitle` 三个 Input |
| 日期选择器使用原生 date input | `<input type="date">` 自定义样式 |
| 保存按钮有 loading 状态 | `Button loading={pending}` |
| 表单校验失败时显示错误提示 | 字段下方 + 顶部条幅双层 |
| 中间件对 `/settings` 自身不重定向 | route group 物理隔离，无环 |
| 空昵称提交时显示校验错误 | zod trim().min(1) |
| 未来日期不允许选择 | input `max` + zod refine 双重防护 |
| 中间件重定向逻辑测试 | layout 可走 e2e；本期通过 action 单测覆盖核心校验 |
| 表单校验逻辑测试 | actions.test.ts 三个新增用例 |

## 不在范围

- 访问密码（Issue #14）
- 主题切换、备份路径（P2）
- 头像/插画上传（P2）
- 国际化（暂仅简中）

## 实施步骤概览

1. 新增 `src/app/(protected)/layout.tsx`（守卫）
2. 移动 `src/app/page.tsx` → `src/app/(protected)/page.tsx`，删除其内部 redirect 调用
3. `src/lib/actions.ts` 新增 `saveCoupleProfileAction`（含 zod refine、redirect、revalidatePath）
4. 新增 `src/components/SettingsForm.tsx`（client）
5. 重写 `src/app/settings/page.tsx`（server，注入 initial）
6. `actions.test.ts` 新增 3 个测试用例
7. `pnpm lint`、`pnpm test`、`pnpm build` 全绿
8. 手动验证：清空 DB → 访问 `/` 重定向 → 填表 → 跳回封面；再次访问 `/settings` 进入编辑模式；提交修改 → 跳回封面；DB count 仍为 1

## 风险与注意

- redirect() 必须在 try/catch 之外抛出，否则 NEXT_REDIRECT 错误会被吞
- 若 `(protected)/layout.tsx` 内 `getCoupleProfile()` 因 DB 文件不可读抛错，目前会冒泡为 500；后续可加错误兜底页（不在本期范围）
- 原生 date input 在不同浏览器表现不一致（移动端 iOS/Android 一致体验良好，桌面端样式保留浏览器默认）；可接受
- useActionState 是 React 19 stable API，依赖 react@19 ✓ 已在 package.json
