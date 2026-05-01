# Prisma + SQLite + Server Actions 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完成 Prisma Schema 定义、SQLite 迁移、Prisma Client 单例封装、zod 输入校验、所有日记与情侣信息的 Server Actions CRUD，以及 Jest 单元测试。

**Architecture:** 数据层采用 Prisma ORM + SQLite，业务层通过 Next.js Server Actions 暴露 CRUD 接口，输入层使用 zod 做结构化校验，测试层使用 Jest + ts-jest 直接连接 SQLite 验证 happy path。

**Tech Stack:** Prisma, SQLite, zod, Jest, ts-jest, Next.js Server Actions

---

## 文件结构

| 文件 | 职责 |
|------|------|
| `prisma/schema.prisma` | 定义 DiaryEntry、DiaryImage、CoupleProfile 三个模型 |
| `.env` | DATABASE_URL 环境变量 |
| `src/lib/prisma.ts` | Prisma Client 单例封装，开发热重载保护 |
| `src/lib/schemas.ts` | zod 校验 schema 与类型导出 |
| `src/lib/actions.ts` | 所有 Server Actions（Diary CRUD + CoupleProfile CRUD） |
| `src/lib/test-setup.ts` | Jest 全局测试清理（断开 Prisma 连接） |
| `src/lib/__tests__/actions.test.ts` | 全部 Server Actions 的单元测试 |
| `jest.config.ts` | Jest 配置（ts-jest preset，node 环境） |
| `package.json` | 追加 prisma、jest 等依赖与 test 脚本 |

---

### Task 1: 安装依赖与 Jest 配置

**Files:**
- Modify: `package.json`
- Create: `jest.config.ts`
- Create: `.env`

- [ ] **Step 1: 安装生产依赖**

Run:
```bash
pnpm add prisma @prisma/client zod
```
Expected: 安装成功，`pnpm-lock.yaml` 更新。

- [ ] **Step 2: 安装开发依赖**

Run:
```bash
pnpm add -D jest ts-jest @types/jest
```
Expected: 安装成功。

- [ ] **Step 3: 修改 package.json 添加 scripts**

Modify `package.json` 的 `scripts` 字段，追加 `"test": "jest"`：
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "test": "jest"
}
```

- [ ] **Step 4: 创建 Jest 配置文件**

Create `jest.config.ts`:
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

- [ ] **Step 5: 创建环境变量文件**

Create `.env`:
```
DATABASE_URL="file:./prisma/dev.db"
```

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml jest.config.ts .env
git commit -m "chore: 安装 prisma、zod、jest 并配置测试环境"
```

---

### Task 2: Prisma Schema 定义与迁移

**Files:**
- Create: `prisma/schema.prisma`

- [ ] **Step 1: 初始化 Prisma**

Run:
```bash
npx prisma init
```
Expected: 生成 `prisma/schema.prisma` 和 `.env`（`.env` 已存在，会被追加）。

- [ ] **Step 2: 写入 Schema**

Replace `prisma/schema.prisma` content:
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

- [ ] **Step 3: 执行迁移**

Run:
```bash
npx prisma migrate dev --name init
```
Expected: 迁移成功，`prisma/dev.db` 生成，`prisma/migrations/` 目录创建。

- [ ] **Step 4: Commit**

```bash
git add prisma/
git commit -m "feat: 定义 Prisma Schema 并执行 SQLite 初始迁移"
```

---

### Task 3: Prisma Client 单例与 zod Schema

**Files:**
- Create: `src/lib/prisma.ts`
- Create: `src/lib/schemas.ts`
- Create: `src/lib/test-setup.ts`

- [ ] **Step 1: 创建 Prisma Client 单例**

Create `src/lib/prisma.ts`:
```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

- [ ] **Step 2: 创建 zod 校验 Schema**

Create `src/lib/schemas.ts`:
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

- [ ] **Step 3: 创建 Jest 测试清理文件**

Create `src/lib/test-setup.ts`:
```typescript
import { prisma } from './prisma';

afterAll(async () => {
  await prisma.$disconnect();
});
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/prisma.ts src/lib/schemas.ts src/lib/test-setup.ts
git commit -m "feat: Prisma Client 单例封装 + zod 输入校验 Schema"
```

---

### Task 4: Server Actions - 日记 CRUD

**Files:**
- Create: `src/lib/actions.ts`

- [ ] **Step 1: 实现日记相关 Server Actions**

Create `src/lib/actions.ts`:
```typescript
'use server';

import { prisma } from './prisma';
import {
  CreateDiarySchema,
  UpdateDiarySchema,
  type CreateDiaryInput,
  type UpdateDiaryInput,
} from './schemas';

export async function createDiary(data: CreateDiaryInput) {
  const parsed = CreateDiarySchema.parse(data);
  const { images, ...entryData } = parsed;

  return prisma.diaryEntry.create({
    data: {
      ...entryData,
      images: images
        ? {
            create: images.map((url) => ({ url })),
          }
        : undefined,
    },
    include: { images: true },
  });
}

export async function getDiaryById(id: string) {
  return prisma.diaryEntry.findUnique({
    where: { id },
    include: { images: true },
  });
}

export async function getDiaryList() {
  return prisma.diaryEntry.findMany({
    orderBy: { date: 'desc' },
    include: { images: true },
  });
}

export async function updateDiary(id: string, data: UpdateDiaryInput) {
  const parsed = UpdateDiarySchema.parse(data);
  const { images, ...entryData } = parsed;

  if (images !== undefined) {
    await prisma.diaryImage.deleteMany({
      where: { entryId: id },
    });
  }

  return prisma.diaryEntry.update({
    where: { id },
    data: {
      ...entryData,
      images:
        images !== undefined
          ? {
              create: images.map((url) => ({ url })),
            }
          : undefined,
    },
    include: { images: true },
  });
}

export async function deleteDiary(id: string) {
  await prisma.diaryEntry.delete({
    where: { id },
  });
}

export async function getDiaryNeighbors(id: string) {
  const current = await prisma.diaryEntry.findUnique({
    where: { id },
    select: { date: true },
  });

  if (!current) {
    return { prev: null, next: null };
  }

  const [prevEntry, nextEntry] = await Promise.all([
    prisma.diaryEntry.findFirst({
      where: { date: { lt: current.date } },
      orderBy: { date: 'desc' },
      select: { id: true },
    }),
    prisma.diaryEntry.findFirst({
      where: { date: { gt: current.date } },
      orderBy: { date: 'asc' },
      select: { id: true },
    }),
  ]);

  return {
    prev: prevEntry?.id ?? null,
    next: nextEntry?.id ?? null,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/actions.ts
git commit -m "feat: 实现日记 Server Actions（CRUD + 邻居查询）"
```

---

### Task 5: Server Actions - 情侣信息 CRUD

**Files:**
- Modify: `src/lib/actions.ts`

- [ ] **Step 1: 追加 CoupleProfile Server Actions**

Append to `src/lib/actions.ts`:
```typescript
import { CoupleProfileSchema, type CoupleProfileInput } from './schemas';

export async function getCoupleProfile() {
  return prisma.coupleProfile.findFirst();
}

export async function updateCoupleProfile(data: CoupleProfileInput) {
  const parsed = CoupleProfileSchema.parse(data);
  const existing = await prisma.coupleProfile.findFirst();

  if (existing) {
    return prisma.coupleProfile.update({
      where: { id: existing.id },
      data: parsed,
    });
  }

  return prisma.coupleProfile.create({
    data: parsed,
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/actions.ts
git commit -m "feat: 实现情侣信息 Server Actions（查询 + upsert）"
```

---

### Task 6: 单元测试

**Files:**
- Create: `src/lib/__tests__/actions.test.ts`

- [ ] **Step 1: 创建测试文件**

Create `src/lib/__tests__/actions.test.ts`:
```typescript
import { prisma } from '../prisma';
import {
  createDiary,
  getDiaryById,
  getDiaryList,
  updateDiary,
  deleteDiary,
  getDiaryNeighbors,
  getCoupleProfile,
  updateCoupleProfile,
} from '../actions';

beforeEach(async () => {
  await prisma.diaryImage.deleteMany();
  await prisma.diaryEntry.deleteMany();
  await prisma.coupleProfile.deleteMany();
});

describe('Diary Actions', () => {
  test('createDiary creates a diary with images', async () => {
    const diary = await createDiary({
      date: new Date('2025-01-15'),
      title: '第一次见面',
      content: '今天是我们第一次见面的日子，超级开心！',
      mood: 'happy',
      weather: 'sunny',
      images: ['https://example.com/photo1.jpg'],
    });

    expect(diary.title).toBe('第一次见面');
    expect(diary.content).toBe('今天是我们第一次见面的日子，超级开心！');
    expect(diary.mood).toBe('happy');
    expect(diary.weather).toBe('sunny');
    expect(diary.images).toHaveLength(1);
    expect(diary.images[0].url).toBe('https://example.com/photo1.jpg');
  });

  test('getDiaryById returns diary with images', async () => {
    const created = await createDiary({
      date: new Date('2025-01-15'),
      title: '测试',
      content: '内容',
      images: ['https://example.com/a.jpg'],
    });

    const found = await getDiaryById(created.id);
    expect(found?.id).toBe(created.id);
    expect(found?.images).toHaveLength(1);
  });

  test('getDiaryList returns diaries ordered by date desc', async () => {
    await createDiary({ date: new Date('2025-01-10'), title: 'A', content: 'a' });
    await createDiary({ date: new Date('2025-01-20'), title: 'B', content: 'b' });
    await createDiary({ date: new Date('2025-01-15'), title: 'C', content: 'c' });

    const list = await getDiaryList();
    expect(list).toHaveLength(3);
    expect(list[0].title).toBe('B');
    expect(list[1].title).toBe('C');
    expect(list[2].title).toBe('A');
  });

  test('updateDiary updates fields and images', async () => {
    const created = await createDiary({
      date: new Date('2025-01-15'),
      title: '旧标题',
      content: '旧内容',
      images: ['https://example.com/old.jpg'],
    });

    const updated = await updateDiary(created.id, {
      title: '新标题',
      content: '新内容',
      images: ['https://example.com/new.jpg'],
    });

    expect(updated.title).toBe('新标题');
    expect(updated.content).toBe('新内容');
    expect(updated.images).toHaveLength(1);
    expect(updated.images[0].url).toBe('https://example.com/new.jpg');
  });

  test('updateDiary preserves images when images not provided', async () => {
    const created = await createDiary({
      date: new Date('2025-01-15'),
      title: '标题',
      content: '内容',
      images: ['https://example.com/keep.jpg'],
    });

    const updated = await updateDiary(created.id, {
      title: '新标题',
    });

    expect(updated.title).toBe('新标题');
    expect(updated.images).toHaveLength(1);
    expect(updated.images[0].url).toBe('https://example.com/keep.jpg');
  });

  test('deleteDiary removes diary and cascades images', async () => {
    const created = await createDiary({
      date: new Date('2025-01-15'),
      title: '待删除',
      content: '内容',
      images: ['https://example.com/del.jpg'],
    });

    await deleteDiary(created.id);

    const found = await getDiaryById(created.id);
    expect(found).toBeNull();

    const images = await prisma.diaryImage.findMany({
      where: { entryId: created.id },
    });
    expect(images).toHaveLength(0);
  });

  test('getDiaryNeighbors returns prev and next', async () => {
    const first = await createDiary({ date: new Date('2025-01-10'), title: 'First', content: 'a' });
    const second = await createDiary({ date: new Date('2025-01-20'), title: 'Second', content: 'b' });
    const third = await createDiary({ date: new Date('2025-01-30'), title: 'Third', content: 'c' });

    const midNeighbors = await getDiaryNeighbors(second.id);
    expect(midNeighbors.prev).toBe(first.id);
    expect(midNeighbors.next).toBe(third.id);

    const firstNeighbors = await getDiaryNeighbors(first.id);
    expect(firstNeighbors.prev).toBeNull();
    expect(firstNeighbors.next).toBe(second.id);

    const lastNeighbors = await getDiaryNeighbors(third.id);
    expect(lastNeighbors.prev).toBe(second.id);
    expect(lastNeighbors.next).toBeNull();
  });

  test('getDiaryNeighbors returns null for non-existent id', async () => {
    const neighbors = await getDiaryNeighbors('non-existent-id');
    expect(neighbors.prev).toBeNull();
    expect(neighbors.next).toBeNull();
  });
});

describe('CoupleProfile Actions', () => {
  test('getCoupleProfile returns null when no record', async () => {
    const profile = await getCoupleProfile();
    expect(profile).toBeNull();
  });

  test('updateCoupleProfile creates a new record', async () => {
    const profile = await updateCoupleProfile({
      personAName: '小兔子',
      personBName: '大灰狼',
      anniversaryDate: new Date('2024-07-18'),
      siteTitle: '恋爱小岛日记',
    });

    expect(profile.personAName).toBe('小兔子');
    expect(profile.personBName).toBe('大灰狼');
    expect(profile.siteTitle).toBe('恋爱小岛日记');
  });

  test('updateCoupleProfile updates existing record', async () => {
    await updateCoupleProfile({
      personAName: '小兔子',
      personBName: '大灰狼',
      anniversaryDate: new Date('2024-07-18'),
    });

    const updated = await updateCoupleProfile({
      personAName: '小白兔',
      personBName: '大灰狼',
      anniversaryDate: new Date('2024-07-18'),
      siteTitle: '新的标题',
    });

    expect(updated.personAName).toBe('小白兔');
    expect(updated.siteTitle).toBe('新的标题');

    const count = await prisma.coupleProfile.count();
    expect(count).toBe(1);
  });
});
```

- [ ] **Step 2: 运行测试**

Run:
```bash
pnpm test
```
Expected: 所有 11 个测试通过。

- [ ] **Step 3: Commit**

```bash
git add src/lib/__tests__/actions.test.ts
git commit -m "test: 添加 Server Actions 单元测试"
```

---

### Task 7: 最终验证

**Files:**
- All files

- [ ] **Step 1: 运行完整测试套件**

Run:
```bash
pnpm test
```
Expected: 全部 11 个测试 PASS。

- [ ] **Step 2: 运行 ESLint**

Run:
```bash
pnpm lint
```
Expected: 无错误。

- [ ] **Step 3: 确认文件清单完整**

Run:
```bash
git status
```
Expected: 工作区干净，所有变更已提交。

- [ ] **Step 4: 最终提交（如有遗漏）**

如果有未提交文件：
```bash
git add .
git commit -m "chore: Issue #2 最终整理"
```

---

## 自我审查

### Spec 覆盖检查

| Spec 要求 | 对应 Task |
|-----------|-----------|
| Prisma schema 定义三个模型 | Task 2 |
| SQLite 配置 | Task 2 + `.env` |
| Prisma Client 单例 | Task 3 |
| zod 输入校验 | Task 3 |
| `createDiary` | Task 4 |
| `getDiaryById` | Task 4 |
| `getDiaryList` | Task 4 |
| `updateDiary` | Task 4 |
| `deleteDiary` | Task 4 |
| `getDiaryNeighbors` | Task 4 |
| `getCoupleProfile` | Task 5 |
| `updateCoupleProfile` | Task 5 |
| 每个 Action 至少一个 happy path 测试 | Task 6 |
| 级联删除验证 | Task 6 (`deleteDiary` test) |
| 首尾邻居返回 null | Task 6 (`getDiaryNeighbors` test) |
| 无记录返回 null | Task 6 (`getCoupleProfile` test) |
| 超长 content 校验 | Task 3 (zod `max(10000)`) |

### Placeholder 扫描

- 无 "TBD"、"TODO"、"implement later"。
- 无 "add appropriate error handling" 等模糊描述。
- 每个步骤包含完整代码或命令。

### 类型一致性检查

- `CreateDiaryInput`、`UpdateDiaryInput`、`CoupleProfileInput` 在 `schemas.ts` 定义后，在 `actions.ts` 中正确导入使用。
- `UpdateDiarySchema` 使用 `CreateDiarySchema.partial()`，确保 `images` 字段可为 `undefined`。
- `updateDiary` 中通过 `images !== undefined` 区分"不传"和"传空数组"。
