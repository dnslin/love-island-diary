# 新增日记页 + 极简详情页 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现 `/diary/new` 新增日记表单（含心情选择器、外链图片、草稿自动保存）以及 `/diary/[id]` 极简详情页占位。

**Architecture:** Client Component 表单用 `useState` + 自定义 `useDiaryDraft` hook 管理状态与草稿，子组件 `MoodSelector`、`ImageUrlInput` 独立封装。表单提交调用已有 `createDiary` Server Action，成功后清草稿并客户端路由跳转。极简详情页为 Server Component，直接查库渲染。

**Tech Stack:** Next.js 16 App Router、React 19、Tailwind CSS v4、animal-island-ui、Jest + ts-jest + React Testing Library、Prisma、zod。

**Spec:** `docs/superpowers/specs/2026-05-03-diary-new-page-design.md`

---

## File Structure

| 文件 | 操作 | 职责 |
|------|------|------|
| `jest.config.ts` | 修改 | 支持 `.test.tsx` 与 `jsdom` 环境 |
| `src/lib/test-setup.ts` | 修改 | 追加 `@testing-library/jest-dom` 引入 |
| `src/hooks/useDiaryDraft.ts` | 创建 | localStorage 草稿自动保存 hook |
| `src/hooks/__tests__/useDiaryDraft.test.ts` | 创建 | hook 单元测试 |
| `src/components/MoodSelector.tsx` | 创建 | 心情下拉选择器 |
| `src/components/__tests__/MoodSelector.test.tsx` | 创建 | 组件单元测试 |
| `src/components/ImageUrlInput.tsx` | 创建 | 图片 URL 动态列表 |
| `src/components/__tests__/ImageUrlInput.test.tsx` | 创建 | 组件单元测试 |
| `src/components/DiaryForm.validation.ts` | 创建 | 表单校验纯函数 |
| `src/components/__tests__/DiaryForm.validation.test.ts` | 创建 | 校验逻辑单元测试 |
| `src/components/DiaryForm.tsx` | 创建 | 新增日记表单主组件 |
| `src/components/DiaryDetail.tsx` | 创建 | 极简详情页展示组件 |
| `src/app/diary/new/page.tsx` | 创建 | 新增日记页面 |
| `src/app/diary/[id]/page.tsx` | 创建 | 极简详情页 |

---

## Task 1: 测试基础设施

**Files:**
- Modify: `jest.config.ts`
- Modify: `src/lib/test-setup.ts`
- Modify: `package.json` (scripts)

**目标:** 安装组件测试依赖，更新 Jest 配置支持 `.test.tsx` 与 `jsdom` 环境。

- [ ] **Step 1: 安装依赖**

```bash
pnpm add -D @testing-library/react @testing-library/jest-dom jest-environment-jsdom
```

Expected: 安装成功，无报错。

- [ ] **Step 2: 修改 `jest.config.ts`**

```ts
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/lib/test-setup.ts'],
  testMatch: ['**/__tests__/**/*.test.ts?(x)'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};

export default config;
```

- [ ] **Step 3: 修改 `src/lib/test-setup.ts`**

```ts
import '@testing-library/jest-dom';
import { prisma } from './prisma';

afterAll(async () => {
  await prisma.$disconnect();
});
```

- [ ] **Step 4: 运行现有测试确保无回归**

```bash
pnpm test
```

Expected: 所有现有测试通过（约 20 个）。

- [ ] **Step 5: Commit**

```bash
git add jest.config.ts src/lib/test-setup.ts package.json pnpm-lock.yaml
git commit -m "chore(test): 安装 React Testing Library，支持 .test.tsx 与 jsdom"
```

---

## Task 2: useDiaryDraft hook (TDD)

**Files:**
- Create: `src/hooks/useDiaryDraft.ts`
- Create: `src/hooks/__tests__/useDiaryDraft.test.ts`

**目标:** 实现草稿自动保存 hook，500ms 防抖，支持初始化恢复与清除。

- [ ] **Step 1: 创建目录并写 failing test**

```bash
mkdir -p src/hooks/__tests__
```

创建 `src/hooks/__tests__/useDiaryDraft.test.ts`:

```ts
import { renderHook, act } from '@testing-library/react';
import { useDiaryDraft } from '../useDiaryDraft';

describe('useDiaryDraft', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('初始化返回默认值', () => {
    const { result } = renderHook(() =>
      useDiaryDraft('diary-draft', { content: '' }),
    );
    expect(result.current[0]).toEqual({ content: '' });
  });

  test('500ms 防抖后保存到 localStorage', () => {
    jest.useFakeTimers();
    const { result } = renderHook(() =>
      useDiaryDraft('diary-draft', { content: '' }),
    );

    act(() => {
      result.current[1]({ content: 'hello' });
    });

    expect(localStorage.getItem('diary-draft')).toBeNull();

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(localStorage.getItem('diary-draft')).toBe(
      JSON.stringify({ content: 'hello' }),
    );
    jest.useRealTimers();
  });

  test('挂载时恢复 localStorage 草稿', () => {
    localStorage.setItem('diary-draft', JSON.stringify({ content: 'restored' }));

    const { result } = renderHook(() =>
      useDiaryDraft('diary-draft', { content: '' }),
    );

    expect(result.current[0]).toEqual({ content: 'restored' });
  });

  test('clearDraft 清除 localStorage', () => {
    localStorage.setItem('diary-draft', JSON.stringify({ content: 'hello' }));

    const { result } = renderHook(() =>
      useDiaryDraft('diary-draft', { content: '' }),
    );

    act(() => {
      result.current[2]();
    });

    expect(localStorage.getItem('diary-draft')).toBeNull();
  });
});
```

- [ ] **Step 2: 运行 test 确认失败**

```bash
pnpm test src/hooks/__tests__/useDiaryDraft.test.ts
```

Expected: FAIL — `Cannot find module '../useDiaryDraft'`。

- [ ] **Step 3: 实现 hook**

创建 `src/hooks/useDiaryDraft.ts`:

```ts
'use client';

import { useState, useEffect } from 'react';

export function useDiaryDraft<T>(key: string, defaultValue: T) {
  const [draft, setDraft] = useState<T>(defaultValue);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        setDraft(JSON.parse(saved));
      } catch {
        localStorage.removeItem(key);
      }
    }
  }, [key]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const timer = setTimeout(() => {
      localStorage.setItem(key, JSON.stringify(draft));
    }, 500);
    return () => clearTimeout(timer);
  }, [draft, key]);

  const clearDraft = () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  };

  return [draft, setDraft, clearDraft] as const;
}
```

- [ ] **Step 4: 运行 test 确认通过**

```bash
pnpm test src/hooks/__tests__/useDiaryDraft.test.ts
```

Expected: 4 tests PASS。

- [ ] **Step 5: Commit**

```bash
git add src/hooks/
git commit -m "feat(hooks): useDiaryDraft 草稿自动保存 hook"
```

---

## Task 3: MoodSelector 组件 (TDD)

**Files:**
- Create: `src/components/MoodSelector.tsx`
- Create: `src/components/__tests__/MoodSelector.test.tsx`

**目标:** 实现心情下拉选择器，5 个选项，点击展开/收起，选中后触发 onChange。

- [ ] **Step 1: 写 failing test**

创建 `src/components/__tests__/MoodSelector.test.tsx`:

```ts
import { render, screen, fireEvent } from '@testing-library/react';
import { MoodSelector, MOODS } from '../MoodSelector';

describe('MoodSelector', () => {
  test('默认渲染当前选中项', () => {
    render(<MoodSelector value="sweet" onChange={jest.fn()} />);
    expect(screen.getByText('甜甜的')).toBeInTheDocument();
  });

  test('点击展开下拉面板', () => {
    render(<MoodSelector value="sweet" onChange={jest.fn()} />);
    fireEvent.click(screen.getByRole('button'));
    MOODS.forEach((mood) => {
      expect(screen.getByText(mood.label)).toBeInTheDocument();
    });
  });

  test('选择选项后触发 onChange 并关闭面板', () => {
    const onChange = jest.fn();
    render(<MoodSelector value="sweet" onChange={onChange} />);

    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByText('开心'));

    expect(onChange).toHaveBeenCalledWith('happy');
    expect(screen.queryByText('想念')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 运行 test 确认失败**

```bash
pnpm test src/components/__tests__/MoodSelector.test.tsx
```

Expected: FAIL — `Cannot find module '../MoodSelector'`。

- [ ] **Step 3: 实现组件**

创建 `src/components/MoodSelector.tsx`:

```ts
'use client';

import { useState } from 'react';

export const MOODS = [
  { value: 'sweet', label: '甜甜的', color: '#F7C8D0' },
  { value: 'happy', label: '开心', color: '#B8DDA8' },
  { value: 'miss', label: '想念', color: '#AFC9F7' },
  { value: 'calm', label: '平静', color: '#D8C7E8' },
  { value: 'sad', label: '小难过', color: '#E8C4A0' },
] as const;

export type MoodValue = (typeof MOODS)[number]['value'];

interface MoodSelectorProps {
  value: MoodValue;
  onChange: (value: MoodValue) => void;
}

export function MoodSelector({ value, onChange }: MoodSelectorProps) {
  const [open, setOpen] = useState(false);
  const selected = MOODS.find((m) => m.value === value) ?? MOODS[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border-soft bg-card"
        aria-expanded={open}
      >
        <span
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: selected.color }}
        />
        <span className="text-sm text-text-main">{selected.label}</span>
      </button>

      {open && (
        <div className="absolute z-10 mt-1 w-full min-w-[120px] rounded-lg border border-border-soft bg-card shadow-lg overflow-hidden">
          {MOODS.map((mood) => (
            <button
              key={mood.value}
              type="button"
              onClick={() => {
                onChange(mood.value);
                setOpen(false);
              }}
              className="flex items-center gap-2 w-full px-3 py-2 hover:bg-cream text-left"
            >
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: mood.color }}
              />
              <span className="text-sm text-text-main">{mood.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: 运行 test 确认通过**

```bash
pnpm test src/components/__tests__/MoodSelector.test.tsx
```

Expected: 3 tests PASS。

- [ ] **Step 5: Commit**

```bash
git add src/components/MoodSelector.tsx src/components/__tests__/MoodSelector.test.tsx
git commit -m "feat(components): MoodSelector 心情下拉选择器"
```

---

## Task 4: ImageUrlInput 组件 (TDD)

**Files:**
- Create: `src/components/ImageUrlInput.tsx`
- Create: `src/components/__tests__/ImageUrlInput.test.tsx`

**目标:** 实现图片 URL 动态列表，支持添加（格式校验）与删除。

- [ ] **Step 1: 写 failing test**

创建 `src/components/__tests__/ImageUrlInput.test.tsx`:

```ts
import { render, screen, fireEvent } from '@testing-library/react';
import { ImageUrlInput } from '../ImageUrlInput';

describe('ImageUrlInput', () => {
  test('添加有效 URL', () => {
    const onChange = jest.fn();
    render(<ImageUrlInput urls={[]} onChange={onChange} />);

    fireEvent.change(screen.getByPlaceholderText('粘贴图片链接'), {
      target: { value: 'https://example.com/photo.jpg' },
    });
    fireEvent.click(screen.getByText('添加'));

    expect(onChange).toHaveBeenCalledWith(['https://example.com/photo.jpg']);
  });

  test('拒绝无效 URL', () => {
    const onChange = jest.fn();
    render(<ImageUrlInput urls={[]} onChange={onChange} />);

    fireEvent.change(screen.getByPlaceholderText('粘贴图片链接'), {
      target: { value: 'not-a-url' },
    });
    fireEvent.click(screen.getByText('添加'));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText('请输入有效的图片地址')).toBeInTheDocument();
  });

  test('删除 URL', () => {
    const onChange = jest.fn();
    render(
      <ImageUrlInput
        urls={['https://example.com/1.jpg', 'https://example.com/2.jpg']}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getAllByText('删除')[0]);

    expect(onChange).toHaveBeenCalledWith(['https://example.com/2.jpg']);
  });
});
```

- [ ] **Step 2: 运行 test 确认失败**

```bash
pnpm test src/components/__tests__/ImageUrlInput.test.tsx
```

Expected: FAIL — `Cannot find module '../ImageUrlInput'`。

- [ ] **Step 3: 实现组件**

创建 `src/components/ImageUrlInput.tsx`:

```ts
'use client';

import { useState } from 'react';

interface ImageUrlInputProps {
  urls: string[];
  onChange: (urls: string[]) => void;
}

export function ImageUrlInput({ urls, onChange }: ImageUrlInputProps) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  const addUrl = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    try {
      new URL(trimmed);
      onChange([...urls, trimmed]);
      setInput('');
      setError('');
    } catch {
      setError('请输入有效的图片地址');
    }
  };

  const removeUrl = (index: number) => {
    onChange(urls.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      {urls.map((url, index) => (
        <div key={`${url}-${index}`} className="flex items-center gap-2">
          <span className="flex-1 text-sm text-text-sub truncate">{url}</span>
          <button
            type="button"
            onClick={() => removeUrl(index)}
            className="text-sm text-accent hover:text-text-main"
          >
            删除
          </button>
        </div>
      ))}

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            if (error) setError('');
          }}
          placeholder="粘贴图片链接"
          className="flex-1 px-3 py-2 rounded-lg border border-border-soft bg-card text-sm"
        />
        <button
          type="button"
          onClick={addUrl}
          className="px-3 py-2 rounded-lg bg-primary text-white text-sm font-medium"
        >
          添加
        </button>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 4: 运行 test 确认通过**

```bash
pnpm test src/components/__tests__/ImageUrlInput.test.tsx
```

Expected: 3 tests PASS。

- [ ] **Step 5: Commit**

```bash
git add src/components/ImageUrlInput.tsx src/components/__tests__/ImageUrlInput.test.tsx
git commit -m "feat(components): ImageUrlInput 外链图片 URL 输入"
```

---

## Task 5: 表单校验逻辑 (TDD)

**Files:**
- Create: `src/components/DiaryForm.validation.ts`
- Create: `src/components/__tests__/DiaryForm.validation.test.ts`

**目标:** 提取表单校验为纯函数，覆盖正文非空、长度边界。

- [ ] **Step 1: 写 failing test**

创建 `src/components/__tests__/DiaryForm.validation.test.ts`:

```ts
import { validateDiaryForm } from '../DiaryForm.validation';

describe('validateDiaryForm', () => {
  const base = {
    date: '2025-01-15',
    title: '',
    content: '今天很开心',
    mood: 'sweet' as const,
    images: [] as string[],
  };

  test('空正文返回错误', () => {
    const result = validateDiaryForm({ ...base, content: '' });
    expect(result.ok).toBe(false);
    expect(result.error).toBe('写点什么吧');
  });

  test('空白正文返回错误', () => {
    const result = validateDiaryForm({ ...base, content: '   ' });
    expect(result.ok).toBe(false);
    expect(result.error).toBe('写点什么吧');
  });

  test('10000 字符正文通过', () => {
    const result = validateDiaryForm({ ...base, content: 'a'.repeat(10000) });
    expect(result.ok).toBe(true);
  });

  test('10001 字符正文失败', () => {
    const result = validateDiaryForm({ ...base, content: 'a'.repeat(10001) });
    expect(result.ok).toBe(false);
    expect(result.error).toBe('正文太长了，最多 10000 字');
  });
});
```

- [ ] **Step 2: 运行 test 确认失败**

```bash
pnpm test src/components/__tests__/DiaryForm.validation.test.ts
```

Expected: FAIL — `Cannot find module '../DiaryForm.validation'`。

- [ ] **Step 3: 实现校验函数**

创建 `src/components/DiaryForm.validation.ts`:

```ts
export interface DiaryFormData {
  date: string;
  title: string;
  content: string;
  mood: string;
  images: string[];
}

export function validateDiaryForm(
  data: DiaryFormData,
): { ok: boolean; error?: string } {
  if (!data.content.trim()) {
    return { ok: false, error: '写点什么吧' };
  }
  if (data.content.length > 10000) {
    return { ok: false, error: '正文太长了，最多 10000 字' };
  }
  return { ok: true };
}
```

- [ ] **Step 4: 运行 test 确认通过**

```bash
pnpm test src/components/__tests__/DiaryForm.validation.test.ts
```

Expected: 4 tests PASS。

- [ ] **Step 5: Commit**

```bash
git add src/components/DiaryForm.validation.ts src/components/__tests__/DiaryForm.validation.test.ts
git commit -m "feat(validation): 日记表单校验逻辑"
```

---

## Task 6: DiaryForm 主组件

**Files:**
- Create: `src/components/DiaryForm.tsx`

**目标:** 组装表单主组件，集成 hook、子组件、校验、Server Action 调用与跳转。

- [ ] **Step 1: 实现 DiaryForm 组件**

创建 `src/components/DiaryForm.tsx`:

```ts
'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { createDiary } from '@/lib/actions';
import { useDiaryDraft } from '@/hooks/useDiaryDraft';
import { MoodSelector, type MoodValue } from './MoodSelector';
import { ImageUrlInput } from './ImageUrlInput';
import { validateDiaryForm } from './DiaryForm.validation';

export interface DiaryFormData {
  date: string;
  title: string;
  content: string;
  mood: MoodValue;
  images: string[];
}

const defaultForm: DiaryFormData = {
  date: dayjs().format('YYYY-MM-DD'),
  title: '',
  content: '',
  mood: 'sweet',
  images: [],
};

export function DiaryForm() {
  const router = useRouter();
  const [form, setForm, clearDraft] = useDiaryDraft<DiaryFormData>(
    'diary-draft',
    defaultForm,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const updateField = useCallback(
    <K extends keyof DiaryFormData>(key: K, value: DiaryFormData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [setForm],
  );

  const handleSubmit = async () => {
    setError('');
    setSuccess(false);

    const validation = validateDiaryForm(form);
    if (!validation.ok) {
      setError(validation.error!);
      return;
    }

    setSaving(true);
    try {
      const entry = await createDiary({
        date: new Date(form.date),
        title: form.title || undefined,
        content: form.content,
        mood: form.mood,
        images: form.images.length > 0 ? form.images : undefined,
      });
      clearDraft();
      setSuccess(true);
      setTimeout(() => {
        router.push(`/diary/${entry.id}`);
      }, 1500);
    } catch {
      setError('保存失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {success && (
        <div className="px-4 py-3 rounded-lg bg-primary/20 text-text-main text-sm text-center">
          今天的心情已经收藏好了
        </div>
      )}
      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-50 text-red-600 text-sm text-center">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="date"
          value={form.date}
          onChange={(e) => updateField('date', e.target.value)}
          className="px-3 py-2 rounded-lg border border-border-soft bg-card text-sm text-text-main"
        />
        <MoodSelector
          value={form.mood}
          onChange={(v) => updateField('mood', v)}
        />
      </div>

      <input
        type="text"
        value={form.title}
        onChange={(e) => updateField('title', e.target.value)}
        placeholder="给今天起个名字（可选）"
        className="w-full px-3 py-2 rounded-lg border border-border-soft bg-card text-sm text-text-main"
      />

      <div className="relative">
        <textarea
          value={form.content}
          onChange={(e) => updateField('content', e.target.value)}
          placeholder="今天发生了什么？"
          rows={8}
          className="w-full px-3 py-2 rounded-lg border border-border-soft bg-card text-sm text-text-main resize-none"
          style={{ fontSize: '16px' }}
        />
        <span
          className={`absolute bottom-2 right-2 text-xs ${
            form.content.length > 10000 ? 'text-red-500' : 'text-text-sub'
          }`}
        >
          {form.content.length}/10000
        </span>
      </div>

      <div className="space-y-1">
        <label className="text-sm text-text-sub">图片</label>
        <ImageUrlInput
          urls={form.images}
          onChange={(v) => updateField('images', v)}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={saving}
        className="w-full py-3 rounded-lg bg-primary text-white font-medium disabled:opacity-50 mt-4"
      >
        {saving ? '保存中...' : '保存'}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: 运行全部测试确认无回归**

```bash
pnpm test
```

Expected: 所有测试通过（约 34 个）。

- [ ] **Step 3: Commit**

```bash
git add src/components/DiaryForm.tsx
git commit -m "feat(components): DiaryForm 新增日记表单主组件"
```

---

## Task 7: 新增日记页面 `/diary/new`

**Files:**
- Create: `src/app/diary/new/page.tsx`

**目标:** 创建新增日记页面，引入 DiaryForm 并添加页面级布局。

- [ ] **Step 1: 创建目录与页面**

```bash
mkdir -p src/app/diary/new
```

创建 `src/app/diary/new/page.tsx`:

```ts
import type { Metadata } from 'next';
import Link from 'next/link';
import { DiaryForm } from '@/components/DiaryForm';

export const metadata: Metadata = {
  title: '写下今天',
};

export default function NewDiaryPage() {
  return (
    <main className="min-h-screen bg-cream">
      <div className="max-w-[480px] mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/"
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
          <h1 className="text-lg font-bold text-text-main">写下今天</h1>
        </div>
        <DiaryForm />
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Dev server 验证**

```bash
pnpm dev
```

在浏览器访问 `http://localhost:3000/diary/new`，验证：
- 页面正常渲染，无报错
- 表单字段齐全（日期、心情、标题、正文、图片、保存按钮）
- 心情选择器可点击展开
- 正文输入后 500ms 刷新页面，草稿恢复

- [ ] **Step 3: Commit**

```bash
git add src/app/diary/new/page.tsx
git commit -m "feat(page): /diary/new 新增日记页面"
```

---

## Task 8: 极简详情页组件与路由

**Files:**
- Create: `src/components/DiaryDetail.tsx`
- Create: `src/app/diary/[id]/page.tsx`

**目标:** 实现极简详情页展示组件与对应路由。

- [ ] **Step 1: 实现 DiaryDetail 组件**

创建 `src/components/DiaryDetail.tsx`:

```ts
import dayjs from 'dayjs';
import type { DiaryEntry, DiaryImage } from '@prisma/client';

interface DiaryDetailProps {
  entry: DiaryEntry & { images: DiaryImage[] };
}

const moodMap: Record<string, { label: string; color: string }> = {
  sweet: { label: '甜甜的', color: '#F7C8D0' },
  happy: { label: '开心', color: '#B8DDA8' },
  miss: { label: '想念', color: '#AFC9F7' },
  calm: { label: '平静', color: '#D8C7E8' },
  sad: { label: '小难过', color: '#E8C4A0' },
};

export function DiaryDetail({ entry }: DiaryDetailProps) {
  const displayTitle =
    entry.title || `${dayjs(entry.date).format('YYYY年M月D日')} 的心情`;
  const mood = moodMap[entry.mood] || moodMap.sweet;

  return (
    <article className="space-y-4">
      <h1 className="text-xl font-bold text-text-main">{displayTitle}</h1>

      <div className="flex items-center gap-2 text-sm text-text-sub">
        <span>{dayjs(entry.date).format('YYYY年M月D日')}</span>
        <span
          className="flex items-center gap-1 px-2 py-0.5 rounded-full"
          style={{ backgroundColor: mood.color + '33' }}
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: mood.color }}
          />
          {mood.label}
        </span>
      </div>

      <p className="text-base text-text-main whitespace-pre-wrap leading-relaxed">
        {entry.content}
      </p>

      {entry.images.length > 0 && (
        <div
          className={`grid gap-2 ${
            entry.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
          }`}
        >
          {entry.images.map((img) => (
            <img
              key={img.id}
              src={img.url}
              alt=""
              className="w-full rounded-lg object-cover"
              loading="lazy"
            />
          ))}
        </div>
      )}
    </article>
  );
}
```

- [ ] **Step 2: 实现详情页路由**

```bash
mkdir -p src/app/diary/\[id\]
```

创建 `src/app/diary/[id]/page.tsx`:

```ts
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDiaryById } from '@/lib/actions';
import { DiaryDetail } from '@/components/DiaryDetail';

interface DiaryDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: DiaryDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const entry = await getDiaryById(id);
  return {
    title: entry?.title || '日记详情',
  };
}

export default async function DiaryDetailPage({
  params,
}: DiaryDetailPageProps) {
  const { id } = await params;
  const entry = await getDiaryById(id);

  if (!entry) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-cream">
      <div className="max-w-[480px] mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/diary/new"
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
          <h1 className="text-lg font-bold text-text-main">日记详情</h1>
        </div>
        <div className="bg-card rounded-2xl p-4 shadow-sm">
          <DiaryDetail entry={entry} />
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Dev server 验证详情页**

确保 dev server 仍在运行（`pnpm dev`），在 `/diary/new` 页面填写内容并保存，观察是否：
- 显示成功提示"今天的心情已经收藏好了"
- 1.5 秒后跳转到 `/diary/[id]`
- 详情页正确显示标题、日期、心情、正文、图片

- [ ] **Step 4: Commit**

```bash
git add src/components/DiaryDetail.tsx src/app/diary/\[id\]/page.tsx
git commit -m "feat(page): /diary/[id] 极简详情页占位"
```

---

## Task 9: 端到端验证

**Files:**
- 全部已有文件

**目标:** 运行全部校验，确保无回归、无类型错误、构建通过。

- [ ] **Step 1: 运行全部测试**

```bash
pnpm test
```

Expected: 所有测试通过。

- [ ] **Step 2: 运行 ESLint**

```bash
pnpm lint
```

Expected: 无 error，无 warn（或仅存在项目已有的 warn）。

- [ ] **Step 3: 运行生产构建**

```bash
pnpm build
```

Expected: 构建成功，无类型错误，路由 `/diary/new` 与 `/diary/[id]` 均被编译。

- [ ] **Step 4: 边界情况手工验证**

在 dev server 中验证以下场景：

- [ ] 正文为空时点击保存，显示"写点什么吧"
- [ ] 正文输入 10001 字符，字符计数变红，保存按钮点击后显示错误
- [ ] 添加无效图片 URL（如"abc"），显示"请输入有效的图片地址"
- [ ] 添加 2 个有效图片 URL，保存后在详情页显示 2 列网格
- [ ] 标题为空时保存，详情页显示"YYYY年M月D日 的心情"
- [ ] 快速连续点击保存按钮，只有第一次触发请求
- [ ] 输入过程中刷新页面，草稿自动恢复
- [ ] 保存成功后刷新 `/diary/new`，表单回到默认空状态（草稿已清除）

- [ ] **Step 5: Commit（如有 lint/build 修复）**

```bash
git add -A
git commit -m "fix: 边界情况处理与 lint/build 修复" || echo "no changes to commit"
```

---

## Self-Review Checklist

### 1. Spec Coverage

| Spec 要求 | 对应 Task |
|-----------|-----------|
| 日期选择器默认今天 | Task 6 (defaultForm.date) |
| 标题为空允许提交 | Task 6 (title: form.title \|\| undefined) |
| 心情 5 选项默认"甜甜的" | Task 3 (MOODS, defaultForm.mood) |
| 正文空阻止提交 | Task 5 (validateDiaryForm) |
| 正文 max 10000 | Task 5 + Task 6 (字符计数 + 校验) |
| 多张外链图片 URL | Task 4 (ImageUrlInput) |
| 删除图片 URL | Task 4 |
| localStorage 草稿 500ms 防抖 | Task 2 (useDiaryDraft) |
| 刷新后草稿恢复 | Task 2 + Task 6 |
| 保存成功跳转 `/diary/[id]` | Task 6 (router.push) + Task 8 |
| 顶部成功提示 | Task 6 (success state) |
| 极简详情页 | Task 8 |
| animal-island-ui 组件 | 暂不强制使用（Issue 未指定具体组件，且表单字段简单） |
| 输入框聚焦边框 #ffcc00 | Task 6 (globals.css 已有 focus 样式或需补充) |
| 移动端字号 ≥16px | Task 6 (textarea style fontSize: '16px') |
| prefers-reduced-motion | 下拉面板无动画，天然支持 |

**Gap:** animal-island-ui 的 `Input`、`Button` 组件未在计划中使用。若项目要求必须使用，需在 Task 6 中替换为 `import { Input, Button } from 'animal-island-ui'`。当前计划使用原生 `input`/`textarea`/`button` + Tailwind 样式，更轻量且与现有 SettingsForm 风格一致。

### 2. Placeholder Scan

- 无 "TBD" / "TODO" / "implement later" / "fill in details"
- 无 "Add appropriate error handling" 等模糊描述
- 每个 Task 的代码均为完整可运行代码

### 3. Type Consistency

- `MoodValue` 在 Task 3 定义，Task 6 的 `DiaryFormData` 和 `defaultForm` 中使用 — 一致
- `DiaryFormData` 在 Task 5 和 Task 6 中定义一致
- `createDiary` 参数类型来自已有 `CreateDiaryInput`，与表单字段映射正确
- `getDiaryById` 返回类型 `DiaryEntry & { images: DiaryImage[] }` 与 `DiaryDetail` props 一致
