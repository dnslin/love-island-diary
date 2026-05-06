# 双密码权限体系设计文档

## 1. 背景与目标

### 1.1 背景

目前应用中访客和主人看到的界面完全相同，所有管理操作（新建日记、编辑日记、删除日记、设置）都暴露在访客视野中。恋爱日记是私密空间，需要区分"能看的人"和"能管理的人"，且不是所有人都能直接看日记。

### 1.2 目标

建立双密码权限体系，实现两层访问控制：

1. **看日记密码**（`VIEW_PASSWORD`）：验证后才能浏览日记内容
2. **管理员密码**（`ADMIN_PASSWORD`）：验证后才能看到管理入口

管理员通过认证后自动拥有看日记权限。

## 2. 范围界定

### 2.1 包含范围

- 环境变量配置：`VIEW_PASSWORD`、`ADMIN_PASSWORD`、`AUTH_SECRET`
- Cookie/Session 认证状态管理（JWT Signed Cookie）
- 中间件拦截未认证访问
- 封面"翻开日记"按钮触发看日记密码验证 Modal
- 长按/双击封面标题区域触发管理员密码验证 Modal
- 管理入口（新建、编辑、设置等）根据认证状态显隐控制
- 已认证后设置 Cookie，7 天有效期，刷新页面后保持状态
- 涉及写操作的 Server Actions 权限保护

### 2.2 不包含范围

- 数据库持久化用户（无注册体系）
- 密码加密存储（环境变量明文即可，个人项目）
- 会话超时自动登出
- 密码修改界面（P1，直接改环境变量重启）
- Cookie 即时失效（密码变更后旧 Cookie 仍有效至过期）

## 3. 技术方案

### 3.1 依赖

新增依赖：

```bash
pnpm add jose
```

`jose` 用于 JWT 的签名与验证，是 Next.js 生态处理 JWT 的标准选择，体积轻量。

### 3.2 环境变量

```bash
# .env
VIEW_PASSWORD="看日记密码"
ADMIN_PASSWORD="管理员密码"
AUTH_SECRET="随机32字节以上字符串，用于JWT签名"
```

启动时检查三个变量是否齐全，任一缺失即抛 `Error`，拒绝启动。

### 3.3 JWT Cookie 设计

- **Cookie 名**：`love-diary-auth`
- **算法**：HS256
- **Payload**：`{ role: 'viewer' | 'admin', iat: number, exp: number }`
- **有效期**：7 天（`exp = iat + 7 * 24 * 3600`）
- **Cookie 属性**：
  - `httpOnly: true`
  - `secure: process.env.NODE_ENV === 'production'`
  - `sameSite: 'lax'`
  - `maxAge: 7 * 24 * 3600`
- **签发**：密码验证 Server Action 中通过 `cookies().set()` 写入
- **验证**：middleware 和各页面 Server Component 中通过 `jose.jwtVerify()` 验证

**单 Cookie 设计理由**：

用一个 Cookie 携带 `role` 字段即可覆盖两层权限。管理员认证时 `role='admin'`，自然拥有 viewer 的所有权限。比两个独立 Cookie 更简洁，避免同步问题。

### 3.4 中间件路由保护

**文件**：`src/middleware.ts`

**路由分级**：

| 路由 | 访问要求 |
|------|---------|
| `/`（封面） | 公开 |
| `/diary`、`/diary/[id]`、`/memories`、`/calendar` | `role: 'viewer'` 或 `'admin'` |
| `/settings` | ① `CoupleProfile` 不存在时公开（首次引导）；② 已存在时需 `role: 'admin'` |
| `/diary/new`、`/diary/[id]/edit` | `role: 'admin'` |
| 静态资源、`_next`、API 路由 | 公开（matcher 排除） |

**中间件逻辑**：

1. 读取 `love-diary-auth` Cookie
2. 使用 `jose.jwtVerify()` 验证签名和有效期
3. 解码出 `role`
4. 按路由分级判断是否放行
5. 未授权则 `NextResponse.redirect('/')`

**`/settings` 双重逻辑处理**：

中间件仅做认证层拦截。首次引导逻辑（`CoupleProfile` 不存在时允许访问 `/settings`）保留在页面 layout 或 Server Component 中。两者职责不重叠。

### 3.5 密码验证 Modal

**文件**：

- `src/components/PasswordModal.tsx` — 通用密码验证 Modal
- `src/components/ViewPasswordModal.tsx` — 看日记密码入口（包装层）
- `src/components/AdminPasswordModal.tsx` — 管理员密码入口（包装层）

**Modal 样式**（奶油色系）：

- 背景遮罩：`bg-black/30 backdrop-blur-sm`
- Modal 卡片：`bg-card rounded-2xl border border-border-soft shadow-lg`
- 输入框：圆角 12px，聚焦边框 `#ffcc00`
- 按钮：pill 形状，`bg-primary hover:bg-accent`
- 错误提示：`text-accent`（粉色系，与整体和谐）
- 图标：自定义 SVG 锁图标，不使用 Emoji

**交互流程**：

1. 用户输入密码
2. 调用对应 Server Action（`verifyViewPassword` 或 `verifyAdminPassword`）
3. Server Action 比对明文密码
4. 验证通过：签发 JWT Cookie，关闭 Modal，`router.refresh()` 或 `router.push('/diary')`
5. 密码错误：Modal 内显示错误提示，不关闭、不清空输入

### 3.6 封面交互改造

**"翻开日记"按钮改造**：

- 当前：FloatingButton 直接 `<Link>` 跳转
- 改造：包装为 Client Component，先读取 cookie 认证状态
  - 已认证：直接跳转 `/diary/[latestId]`
  - 未认证：弹出看日记密码 Modal

**管理员认证入口**：

- 当前：`SecretWriteEntry` 组件（连续点击 3 次统计区域隐蔽进入 `/diary/new`）
- 改造：**直接移除 `SecretWriteEntry`**
- 新入口：在封面**标题区域**绑定 `onDoubleClick`，弹出管理员密码 Modal
- 移动端：用 `onTouchStart` / `onTouchEnd` 模拟长按（500ms 以上触发）

**封面按钮显隐规则**：

| 角色 | 可见按钮 |
|------|---------|
| 未认证 | "翻开日记" |
| viewer | "翻开日记" |
| admin | "翻开日记" + "写下今天" |

"写下今天"按钮链接 `/diary/new`，样式与"翻开日记"区分（如颜色略浅或位置不同）。

### 3.7 管理入口显隐控制

**需要显隐控制的管理入口**：

| 位置 | 入口 | 显示条件 |
|------|------|---------|
| 封面 `/` | 右上角设置齿轮 | `role === 'admin'` |
| 封面 `/` | "写下今天"浮动按钮 | `role === 'admin'` |
| 单篇日记 `/diary/[id]` | 编辑按钮 | `role === 'admin'` |
| 编辑页 `/diary/[id]/edit` | 删除按钮 | `role === 'admin'` |

**实现方式**：

封装工具函数：

```ts
// src/lib/auth.ts
export async function getAuthRole(): Promise<'viewer' | 'admin' | null> { ... }
```

在 Server Component 中调用，通过 props 传递给子组件条件渲染：

```tsx
const role = await getAuthRole();
{role === 'admin' && <SettingsButton />}
```

**安全说明**：UI 显隐仅提升用户体验，真正的访问控制由 middleware（路由层）和 Server Actions（数据层）保证。

### 3.8 Server Action 保护

**需要保护的写操作**：

| Server Action | 权限要求 |
|---------------|---------|
| `createDiary` | `role === 'admin'` |
| `updateDiary` | `role === 'admin'` |
| `deleteDiary` | `role === 'admin'` |
| `saveCoupleProfileAction` | 首次引导时公开，已有数据后需 `role === 'admin'` |

**只读操作无需保护**：

`getDiaryById`、`getDiaryList`、`getDiaryNeighbors`、`getCoupleProfile`、`getCoverStats` — 中间件层已拦截未认证访问。

**实现方式**：

```ts
// src/lib/auth.ts
export async function requireAdmin(): Promise<void> { ... }
```

在写操作 Server Actions 中调用。未通过时**不抛 Error**，而是返回结构化错误：

```ts
return { ok: false, error: '权限不足，请先登录' };
```

前端组件（DiaryForm、DeleteConfirmModal 等）接收该错误并通过 toast 提示用户。

**首次引导特殊处理**：

```ts
export async function saveCoupleProfileAction(...) {
  const profile = await getCoupleProfile();
  if (profile) {
    await requireAdmin(); // 已有数据后需要 admin 权限
  }
  // ... 保存逻辑
}
```

### 3.9 错误处理

**JWT/Cookie 异常**（middleware 中）：

| 场景 | 行为 |
|------|------|
| Cookie 缺失 | 视为未认证，按路由规则重定向 |
| JWT 签名无效 | 视为未认证，重定向到 `/` |
| JWT 已过期 | 视为未认证，重定向到 `/` |
| JWT 格式错误 | 视为未认证，重定向到 `/` |

**密码错误**（Modal 中）：

- 显示"密码错误，请重试"
- 不关闭 Modal、不清空输入
- 无最大尝试次数限制

**环境变量缺失**：

启动时检查，缺失即抛 `Error`，避免运行时静默失败。

**密码变更与 Cookie 失效**：

修改环境变量密码后，已签发的 Cookie 在过期前仍然有效。本期不实现即时失效机制，P1 可通过 `passwordVersion` 字段扩展。

## 4. 新增/修改文件清单

### 新增文件

| 文件 | 说明 |
|------|------|
| `src/middleware.ts` | Next.js 中间件，统一路由拦截 |
| `src/lib/auth.ts` | JWT 签发/验证、权限检查工具函数 |
| `src/components/PasswordModal.tsx` | 通用密码验证 Modal（基础 UI） |
| `src/components/ViewPasswordModal.tsx` | 看日记密码验证入口（Client Component） |
| `src/components/AdminPasswordModal.tsx` | 管理员密码验证入口（Client Component） |

### 修改文件

| 文件 | 修改内容 |
|------|---------|
| `.env` | 新增 `VIEW_PASSWORD`、`ADMIN_PASSWORD`、`AUTH_SECRET` |
| `src/app/(protected)/page.tsx` | ① 改造"翻开日记"按钮触发 Modal；② 标题区域绑定双击/长按触发管理员 Modal；③ 条件渲染设置齿轮和"写下今天"按钮；④ 移除 `SecretWriteEntry` |
| `src/app/diary/[id]/page.tsx` | 条件渲染编辑按钮 |
| `src/app/diary/[id]/edit/page.tsx` | 条件渲染删除按钮 |
| `src/lib/actions.ts` | 新增 `verifyViewPassword`、`verifyAdminPassword`；在写操作中调用权限检查 |
| `src/components/SecretWriteEntry.tsx` | **删除**（被管理员密码 Modal 替代） |

## 5. 验收标准

### 5.1 功能验收

- [ ] 未输入密码时点击"翻开日记"弹出看日记密码验证 Modal
- [ ] 看日记密码正确后进入日记浏览，错误则 Modal 内提示
- [ ] 双击/长按封面标题区域弹出管理员密码验证 Modal
- [ ] 管理员密码验证后显示所有管理入口（设置齿轮、写下今天、编辑、删除）
- [ ] 管理员认证后自动拥有看日记权限（无需二次输入看日记密码）
- [ ] 未认证访客无法访问 `/diary`、`/settings` 等路径（被中间件重定向到 `/`）
- [ ] 未认证访客调用写操作 Server Action 被拒绝，前端 toast 提示"权限不足"
- [ ] 首次引导时（无 CoupleProfile）任何人可访问 `/settings` 并保存
- [ ] 7 天内刷新页面保持认证状态

### 5.2 安全验收

- [ ] Cookie 为 HttpOnly，无法通过 JavaScript 读取
- [ ] 篡改 Cookie 后 JWT 签名验证失败，被中间件拦截
- [ ] 直接访问 `/diary/new` 未认证时被重定向到 `/`
- [ ] 绕过前端直接调用 Server Action 时权限检查生效

### 5.3 UI 验收

- [ ] Modal 风格与整体奶油色系一致
- [ ] 不使用 Emoji
- [ ] 密码错误提示友好，不强制清空输入
- [ ] 移动端适配（按钮高度、输入框字号）
