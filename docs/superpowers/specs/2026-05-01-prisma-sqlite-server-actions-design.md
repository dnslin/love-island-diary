# M1 Prisma + SQLite 数据库层设计文档

## 1. 背景与目标

### 1.1 背景

本项目「恋爱小岛日记」使用 SQLite 作为数据库，Prisma 作为 ORM。Issue #2 负责完成数据模型定义、Prisma Client 封装以及所有 CRUD 的 Server Actions 实现，为后续页面功能提供数据层支撑。

### 1.2 目标

- 定义 `DiaryEntry`、`DiaryImage`、`CoupleProfile` 三个 Prisma 模型
- 配置 SQLite 数据源（开发环境 `./prisma/dev.db`，生产环境 `/data/love-diary.db`）
- 封装 Prisma Client 单例，避免开发热重载导致连接过多
- 使用 zod 校验所有 Server Actions 输入
- 使用 Jest 为每个 Server Action 编写 happy path 单元测试
- 实现 `getDiaryNeighbors(id)` 用于翻书式导航

## 2. 范围界定

### 2.1 包含范围

- Prisma schema 定义与迁移
- Prisma Client 单例封装（`src/lib/prisma.ts`）
- zod 输入校验 schema（`src/lib/schemas.ts`）
- Server Actions 实现（`src/lib/actions.ts`）
- Jest 测试配置与单元测试（`src/lib/__tests__/actions.test.ts`）

### 2.2 不包含范围

- Docker Volume 配置（Issue #3）
- 页面 UI（后续 Issue）
- 外链图片上传（仅存储 URL 字符串）
- 中间件检测 `CoupleProfile` 缺失逻辑（后续 Issue，但 Server Action 提供检测能力）

## 3. 技术方案

### 3.1 依赖安装

```bash
pnpm add prisma @prisma/client zod
pnpm add -D jest ts-jest @types/jest
```

### 3.2 Prisma 初始化与 Schema

执行 `npx prisma init`，配置 `prisma/schema.prisma`：

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model DiaryEntry {
  id        String   @id @default(cuid())
  date      DateTime
  title     String?
  content   String
  mood      String   @default("sweet")
  weather   String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  images    DiaryImage[]
}

model DiaryImage {
  id        String   @id @default(cuid())
  url       String
  entryId   String
  entry     DiaryEntry @relation(fields: [entryId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
}

model CoupleProfile {
  id              String   @id @default(cuid())
  personAName     String
  personBName     String
  anniversaryDate DateTime
  siteTitle       String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

**Schema 决策说明：**
- `DiaryEntry.title` 设为可选（`String?`），与设计文档第 3.2 节一致
- `CoupleProfile` 只存一条记录，由业务层保证
- `DiaryImage` 级联删除，删除日记时自动清理关联图片记录

### 3.3 环境变量

`.env`：
```
DATABASE_URL="file:./dev.db"
```

生产环境通过 `DATABASE_URL="file:/data/love-diary.db"` 覆盖。

### 3.4 Prisma Client 单例

`src/lib/prisma.ts`：
```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

### 3.5 zod 输入校验 Schema

`src/lib/schemas.ts`：
```typescript
import { z } from 'zod';

export const CreateDiarySchema = z.object({
  date: z.coerce.date(),
  title: z.string().max(200).optional(),
  content: z.string().max(10000),
  mood: z.string().max(20).default('sweet'),
  weather: z.string().max(20).optional(),
  images: z.array(z.string().url()).optional(),
});

export type CreateDiaryInput = z.infer<typeof CreateDiarySchema>;

export const UpdateDiarySchema = CreateDiarySchema.partial();
export type UpdateDiaryInput = z.infer<typeof UpdateDiarySchema>;

export const CoupleProfileSchema = z.object({
  personAName: z.string().min(1).max(50),
  personBName: z.string().min(1).max(50),
  anniversaryDate: z.coerce.date(),
  siteTitle: z.string().max(100).optional(),
});

export type CoupleProfileInput = z.infer<typeof CoupleProfileSchema>;
```

### 3.6 Server Actions 实现

`src/lib/actions.ts` 导出的函数：

| 函数 | 说明 |
|------|------|
| `createDiary(data)` | 校验输入，创建日记及关联图片 |
| `getDiaryById(id)` | 按 ID 查询，包含 `images` 关联 |
| `getDiaryList()` | 按 `date` 倒序返回全部日记 |
| `updateDiary(id, data)` | 校验输入，更新日记，`updatedAt` 自动更新 |
| `deleteDiary(id)` | 删除日记，级联删除关联图片记录 |
| `getDiaryNeighbors(id)` | 按 `date` 排序，返回 `{ prev, next }`，首尾返回 `null` |
| `getCoupleProfile()` | 查询情侣信息，无记录返回 `null` |
| `updateCoupleProfile(data)` | 更新或创建（upsert）情侣信息 |

**关键逻辑说明：**
- `createDiary`：使用 Prisma 嵌套创建 `images`
- `updateDiary`：先删除旧图片再创建新图片，或根据 `images` 存在性决定
- `getDiaryNeighbors`：两次查询，一次找 `date < currentDate` 的最大值（prev），一次找 `date > currentDate` 的最小值（next）
- `updateCoupleProfile`：使用 `upsert`，保证始终只有一条记录

### 3.7 Jest 配置

`jest.config.ts`：
```typescript
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/src/lib/test-setup.ts'],
  testMatch: ['**/__tests__/**/*.test.ts'],
};

export default config;
```

`src/lib/test-setup.ts`：
```typescript
import { prisma } from './prisma';

afterAll(async () => {
  await prisma.$disconnect();
});
```

### 3.8 测试策略

`src/lib/__tests__/actions.test.ts`：

| 测试用例 | 验证点 |
|---------|--------|
| `createDiary` | 成功创建日记，返回对象包含正确字段 |
| `getDiaryById` | 按 ID 查询，包含关联图片 |
| `getDiaryList` | 按 `date` 倒序排列 |
| `updateDiary` | 更新字段，`updatedAt` 变化 |
| `deleteDiary` | 删除日记，级联删除关联图片 |
| `getDiaryNeighbors` | 中间日记返回 prev/next；首篇 prev 为 null；末篇 next 为 null |
| `getCoupleProfile` | 无记录返回 null |
| `updateCoupleProfile` | upsert 创建或更新记录 |

测试使用开发环境 SQLite 文件，每次测试前清理相关表数据。

## 4. 边界情况处理

| 场景 | 处理方案 |
|------|---------|
| 超长 content（>10000 字符） | zod `max(10000)` 校验拒绝 |
| `getDiaryNeighbors` 首篇/末篇 | 返回 `null` |
| `getCoupleProfile` 无记录 | 返回 `null`，由调用方决定是否跳转 `/settings` |
| 更新日记时 `images` 不传 | 不修改现有图片 |
| 更新日记时 `images` 传空数组 | 删除所有关联图片 |
| 开发热重载 | Prisma Client 单例模式避免连接泄漏 |

## 5. 文件清单

```
prisma/
  schema.prisma          # 数据模型定义
  dev.db                 # SQLite 文件（gitignore）
  migrations/
    ...                  # Prisma 迁移文件
.env                     # 环境变量（已存在，追加 DATABASE_URL）
src/lib/
  prisma.ts              # Prisma Client 单例
  schemas.ts             # zod 校验 schema
  actions.ts             # Server Actions
  test-setup.ts          # Jest 测试清理
  __tests__/
    actions.test.ts      # 单元测试
jest.config.ts           # Jest 配置
package.json             # 追加依赖和 test 脚本
```

## 6. 决策记录

| 决策 | 结论 | 原因 |
|------|------|------|
| 输入校验 | zod | BOSS 明确指定，类型推导一体化 |
| 测试框架 | Jest + ts-jest | BOSS 明确指定，与 Next.js 生态兼容 |
| 数据库路径 | 开发 `./prisma/dev.db`，生产 `/data/love-diary.db` | 与 Issue #3 Docker Volume 挂载路径对齐 |
| 邻居排序基准 | `date` 字段 | BOSS 明确指定，符合业务语义 |
| 图片更新策略 | 先删后建 | 简单可靠，外链 URL 无需保留旧 ID |
| CoupleProfile 更新 | `upsert` | 保证始终只有一条记录，简化首次引导逻辑 |
