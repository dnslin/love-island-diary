# Issue #9 编辑日记 + 删除日记 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有新建日记功能基础上，实现日记编辑和删除功能，包括编辑页、复用表单、删除二次确认 Modal。

**Architecture:** DiaryForm 通过 `mode` prop 支持 create/edit 双模式，编辑页预填充数据并复用表单。删除按钮位于编辑页底部，点击弹出基于 animal-island-ui Modal 的二次确认对话框。单篇日记页顶部导航栏通过 PageFlipWrapper 的 `actions` 插槽注入编辑入口。

**Tech Stack:** Next.js 16 App Router, TypeScript, React 19, animal-island-ui, Tailwind CSS v4, Framer Motion, Jest + React Testing Library

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/components/DiaryForm.tsx` | Modify | 改造为支持 create/edit 双模式，区分草稿 key 和 Server Action |
| `src/components/DeleteConfirmModal.tsx` | Create | 删除二次确认 Modal，基于 animal-island-ui Modal |
| `src/app/diary/[id]/edit/page.tsx` | Create | 编辑页 Server Component，获取日记数据并渲染 DiaryForm |
| `src/components/PageFlipWrapper.tsx` | Modify | 新增可选 `actions` prop，渲染在顶部导航栏右侧 |
| `src/app/diary/[id]/page.tsx` | Modify | 传入编辑按钮作为 `actions` |
| `src/components/__tests__/DeleteConfirmModal.test.tsx` | Create | DeleteConfirmModal 单元测试 |
| `src/components/__tests__/DiaryForm.test.tsx` | Create | DiaryForm 编辑模式单元测试 |
| `src/components/__tests__/PageFlipWrapper.test.tsx` | Modify | 补充 actions 插槽的测试 |

---

## Task 1: 改造 DiaryForm 支持编辑模式

**Files:**
- Modify: `src/components/DiaryForm.tsx`
- Create: `src/components/__tests__/DiaryForm.test.tsx`

**Context:** 当前 DiaryForm 只支持创建模式。需要新增 `mode`/`initialData`/`entryId` props，编辑时预填充数据、调用 `updateDiary`、使用独立的草稿 key。

- [ ] **Step 1: 写 DiaryForm 编辑模式的测试**

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DiaryForm } from '../DiaryForm';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/lib/actions', () => ({
  createDiary: jest.fn(),
  updateDiary: jest.fn(),
}));

jest.mock('@/hooks/useDiaryDraft', () => ({
  useDiaryDraft: jest.fn((_key: string, defaultValue: unknown) => {
    const [value, setValue] = [defaultValue, jest.fn()];
    return [value, setValue, jest.fn()] as const;
  }),
}));

import { createDiary, updateDiary } from '@/lib/actions';

describe('DiaryForm edit mode', () => {
  const mockEntry = {
    id: 'entry-1',
    date: new Date('2025-03-15'),
    title: 'Original Title',
    content: 'Original content',
    mood: 'happy',
    weather: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    images: [
      { id: 'img-1', url: 'https://example.com/1.jpg', entryId: 'entry-1', createdAt: new Date() },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('编辑模式下预填充已有数据', () => {
    render(<DiaryForm mode="edit" initialData={mockEntry as never} entryId="entry-1" />);

    const titleInput = screen.getByPlaceholderText('给今天起个名字（可选）') as HTMLInputElement;
    const contentInput = screen.getByPlaceholderText('今天发生了什么？') as HTMLTextAreaElement;
    const dateInput = screen.getByDisplayValue('2025-03-15') as HTMLInputElement;

    expect(titleInput.value).toBe('Original Title');
    expect(contentInput.value).toBe('Original content');
    expect(dateInput).toBeInTheDocument();
  });

  it('编辑模式下点击保存调用 updateDiary 并跳转详情页', async () => {
    (updateDiary as jest.Mock).mockResolvedValue({ id: 'entry-1' });

    render(<DiaryForm mode="edit" initialData={mockEntry as never} entryId="entry-1" />);

    fireEvent.click(screen.getByText('保存'));

    await waitFor(() => {
      expect(updateDiary).toHaveBeenCalledWith(
        'entry-1',
        expect.objectContaining({
          content: 'Original content',
          mood: 'happy',
        }),
      );
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/diary/entry-1');
    });
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx jest src/components/__tests__/DiaryForm.test.tsx --no-coverage`

Expected: FAIL — `mode` prop 不存在、`updateDiary` 未调用

- [ ] **Step 3: 改造 DiaryForm**

修改 `src/components/DiaryForm.tsx`，完整替换为：

```tsx
'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { Input, Button } from 'animal-island-ui';
import { createDiary, updateDiary } from '@/lib/actions';
import { useDiaryDraft } from '@/hooks/useDiaryDraft';
import { MoodSelector, type MoodValue } from './MoodSelector';
import { ImageUrlInput } from './ImageUrlInput';
import { validateDiaryForm } from './DiaryForm.validation';
import type { DiaryEntry, DiaryImage } from '@prisma/client';

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

function entryToFormData(entry: DiaryEntry & { images: DiaryImage[] }): DiaryFormData {
  return {
    date: dayjs(entry.date).format('YYYY-MM-DD'),
    title: entry.title ?? '',
    content: entry.content,
    mood: entry.mood as MoodValue,
    images: entry.images.map((img) => img.url),
  };
}

export interface DiaryFormProps {
  mode?: 'create' | 'edit';
  initialData?: DiaryEntry & { images: DiaryImage[] };
  entryId?: string;
}

export function DiaryForm({ mode = 'create', initialData, entryId }: DiaryFormProps) {
  const router = useRouter();
  const draftKey = mode === 'edit' && entryId ? `diary-draft-edit-${entryId}` : 'diary-draft';
  const initialForm = initialData ? entryToFormData(initialData) : defaultForm;

  const [form, setForm, clearDraft] = useDiaryDraft<DiaryFormData>(draftKey, initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const updateField = useCallback(
    <K extends keyof DiaryFormData>(key: K, value: DiaryFormData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [setForm],
  );

  const handleSubmit = useCallback(async () => {
    setError('');
    setSuccess(false);

    const validation = validateDiaryForm(form);
    if (!validation.ok) {
      setError(validation.error!);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        date: new Date(form.date),
        title: form.title || undefined,
        content: form.content,
        mood: form.mood,
        images: form.images.length > 0 ? form.images : undefined,
      };

      if (mode === 'edit' && entryId) {
        await updateDiary(entryId, payload);
        clearDraft();
        setSuccess(true);
        timerRef.current = setTimeout(() => {
          router.push(`/diary/${entryId}`);
        }, 1500);
      } else {
        const entry = await createDiary(payload);
        clearDraft();
        setSuccess(true);
        timerRef.current = setTimeout(() => {
          router.push(`/diary/${entry.id}`);
        }, 1500);
      }
    } catch (err) {
      console.error('保存日记失败:', err);
      setError('保存失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  }, [form, router, clearDraft, mode, entryId]);

  return (
    <div className="space-y-4">
      {success && (
        <div className="px-4 py-3 rounded-lg bg-primary/20 text-text-main text-sm text-center">
          {mode === 'edit' ? '修改已经收藏好了' : '今天的心情已经收藏好了'}
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

      <Input
        value={form.title}
        onChange={(e) => updateField('title', e.target.value)}
        placeholder="给今天起个名字（可选）"
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

      <Button
        type="primary"
        block
        loading={saving}
        disabled={saving}
        htmlType="button"
        onClick={handleSubmit}
      >
        保存
      </Button>
    </div>
  );
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx jest src/components/__tests__/DiaryForm.test.tsx --no-coverage`

Expected: PASS

Run: `npx jest --no-coverage`

Expected: 全部 PASS（确保没有破坏现有测试）

- [ ] **Step 5: Commit**

```bash
git add src/components/DiaryForm.tsx src/components/__tests__/DiaryForm.test.tsx
git commit -m "$(cat <<'EOF'
feat(DiaryForm): 支持编辑模式

- 新增 mode/initialData/entryId props
- 编辑时预填充已有数据
- 编辑模式调用 updateDiary Server Action
- 编辑草稿 key 独立（diary-draft-edit-${id}）
EOF
)"
```

---

## Task 2: 新增 DeleteConfirmModal 组件

**Files:**
- Create: `src/components/DeleteConfirmModal.tsx`
- Create: `src/components/__tests__/DeleteConfirmModal.test.tsx`

**Context:** 基于 animal-island-ui Modal 组件，封装删除二次确认对话框。

- [ ] **Step 1: 写 DeleteConfirmModal 测试**

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { DeleteConfirmModal } from '../DeleteConfirmModal';

describe('DeleteConfirmModal', () => {
  const defaultProps = {
    open: true,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('渲染标题和说明文字', () => {
    render(<DeleteConfirmModal {...defaultProps} />);
    expect(screen.getByText('要删除这篇日记吗？')).toBeInTheDocument();
    expect(screen.getByText('删除后就不能在这里看到它了')).toBeInTheDocument();
  });

  it('点击取消调用 onClose', () => {
    render(<DeleteConfirmModal {...defaultProps} />);
    fireEvent.click(screen.getByText('取消'));
    expect(defaultProps.onClose).toHaveBeenCalled();
    expect(defaultProps.onConfirm).not.toHaveBeenCalled();
  });

  it('点击删除调用 onConfirm', () => {
    render(<DeleteConfirmModal {...defaultProps} />);
    fireEvent.click(screen.getByText('删除'));
    expect(defaultProps.onConfirm).toHaveBeenCalled();
  });

  it('loading 状态下删除按钮显示加载中', () => {
    render(<DeleteConfirmModal {...defaultProps} loading />);
    expect(screen.getByText('删除中...')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx jest src/components/__tests__/DeleteConfirmModal.test.tsx --no-coverage`

Expected: FAIL — 组件不存在

- [ ] **Step 3: 实现 DeleteConfirmModal**

创建 `src/components/DeleteConfirmModal.tsx`：

```tsx
'use client';

import { Modal, Button } from 'animal-island-ui';

interface DeleteConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export function DeleteConfirmModal({
  open,
  onClose,
  onConfirm,
  loading = false,
}: DeleteConfirmModalProps) {
  return (
    <Modal
      open={open}
      title="要删除这篇日记吗？"
      onClose={onClose}
      footer={
        <div className="flex gap-3 justify-end">
          <Button
            type="default"
            onClick={onClose}
            disabled={loading}
          >
            取消
          </Button>
          <Button
            type="danger"
            onClick={onConfirm}
            loading={loading}
            disabled={loading}
          >
            {loading ? '删除中...' : '删除'}
          </Button>
        </div>
      }
    >
      <p className="text-text-sub text-sm">删除后就不能在这里看到它了</p>
    </Modal>
  );
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx jest src/components/__tests__/DeleteConfirmModal.test.tsx --no-coverage`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/DeleteConfirmModal.tsx src/components/__tests__/DeleteConfirmModal.test.tsx
git commit -m "$(cat <<'EOF'
feat(DeleteConfirmModal): 删除二次确认弹窗

- 基于 animal-island-ui Modal 组件
- 标题 + 说明 + 取消/删除 双按钮
- 支持 loading 状态
EOF
)"
```

---

## Task 3: 新增编辑页 Server Component

**Files:**
- Create: `src/app/diary/[id]/edit/page.tsx`

**Context:** 编辑页通过 `getDiaryById` 获取数据，不存在则 `notFound()`，存在则渲染带 `mode="edit"` 的 DiaryForm。

- [ ] **Step 1: 创建编辑页**

创建 `src/app/diary/[id]/edit/page.tsx`：

```tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDiaryById } from '@/lib/actions';
import { DiaryForm } from '@/components/DiaryForm';

interface EditDiaryPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EditDiaryPageProps): Promise<Metadata> {
  const { id } = await params;
  const entry = await getDiaryById(id);
  return { title: entry?.title ? `编辑：${entry.title}` : '编辑日记' };
}

export default async function EditDiaryPage({ params }: EditDiaryPageProps) {
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
      </div>
    </main>
  );
}
```

- [ ] **Step 2: 运行 build 检查**

Run: `pnpm build`

Expected: 构建成功（确保新页面没有类型错误）

- [ ] **Step 3: Commit**

```bash
git add src/app/diary/[id]/edit/page.tsx
git commit -m "$(cat <<'EOF'
feat(diary/[id]/edit): 新增编辑页

- Server Component 获取日记数据
- 不存在时 notFound()
- 复用 DiaryForm 编辑模式
EOF
)"
```

---

## Task 4: 改造 PageFlipWrapper 添加 actions 插槽

**Files:**
- Modify: `src/components/PageFlipWrapper.tsx`
- Modify: `src/components/__tests__/PageFlipWrapper.test.tsx`

**Context:** 在顶部导航栏右侧（翻页按钮旁边）增加 `actions` 插槽，用于注入编辑按钮。

- [ ] **Step 1: 写 actions 插槽的测试**

在 `src/components/__tests__/PageFlipWrapper.test.tsx` 末尾追加：

```tsx
describe('PageFlipWrapper actions slot', () => {
  it('传入 actions 时渲染在顶部导航栏', () => {
    render(
      <PageFlipWrapper
        prevId="prev-1"
        nextId="next-1"
        currentId="curr-1"
        actions={<button data-testid="edit-btn">编辑</button>}
      >
        <div>内容</div>
      </PageFlipWrapper>,
    );
    expect(screen.getByTestId('edit-btn')).toBeInTheDocument();
  });

  it('不传 actions 时不渲染插槽', () => {
    render(
      <PageFlipWrapper prevId="prev-1" nextId="next-1" currentId="curr-1">
        <div>内容</div>
      </PageFlipWrapper>,
    );
    expect(screen.queryByTestId('edit-btn')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx jest src/components/__tests__/PageFlipWrapper.test.tsx --no-coverage`

Expected: FAIL — `actions` prop 不存在

- [ ] **Step 3: 改造 PageFlipWrapper**

修改 `src/components/PageFlipWrapper.tsx`，在接口和 JSX 中新增 `actions`：

```tsx
// 在接口定义处新增 actions
interface PageFlipWrapperProps {
  children: React.ReactNode;
  prevId: string | null;
  nextId: string | null;
  currentId: string;
  actions?: React.ReactNode; // 新增
}

// 在函数参数解构处新增 actions
export function PageFlipWrapper({
  children,
  prevId,
  nextId,
  currentId,
  actions, // 新增
}: PageFlipWrapperProps) {
```

在顶部导航栏 `<div className="flex gap-2">` 内部，翻页按钮之前插入 `actions`：

```tsx
<div className="flex gap-2">
  {actions}
  {prevId !== null && (
    <button ...>上一篇</button>
  )}
  {nextId !== null && (
    <button ...>下一篇</button>
  )}
</div>
```

完整 PageFlipWrapper 顶部导航栏区域修改后如下：

```tsx
<div className="flex items-center justify-between mb-6">
  <Link
    href="/"
    className="inline-flex items-center gap-1 text-sm text-text-sub hover:text-text-main transition-colors"
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
    封面
  </Link>

  <div className="flex gap-2">
    {actions}
    {prevId !== null && (
      <button
        type="button"
        aria-label="上一篇"
        disabled={isExiting}
        onClick={goToPrev}
        className="text-text-sub hover:text-text-main transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
      </button>
    )}
    {nextId !== null && (
      <button
        type="button"
        aria-label="下一篇"
        disabled={isExiting}
        onClick={goToNext}
        className="text-text-sub hover:text-text-main transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
          <path d="m9 18 6-6-6-6" />
        </svg>
      </button>
    )}
  </div>
</div>
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npx jest src/components/__tests__/PageFlipWrapper.test.tsx --no-coverage`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/PageFlipWrapper.tsx src/components/__tests__/PageFlipWrapper.test.tsx
git commit -m "$(cat <<'EOF'
feat(PageFlipWrapper): 新增 actions 插槽

- 顶部导航栏右侧支持注入自定义操作按钮
- 用于编辑按钮等场景
EOF
)"
```

---

## Task 5: 单篇日记页集成编辑入口

**Files:**
- Modify: `src/app/diary/[id]/page.tsx`

**Context:** 在单篇日记页顶部导航栏注入编辑按钮。

- [ ] **Step 1: 修改 diary/[id]/page.tsx**

修改 `src/app/diary/[id]/page.tsx`，在 PageFlipWrapper 中传入 `actions`：

```tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDiaryById, getDiaryNeighbors, getDiaryList } from '@/lib/actions';
import { PageFlipWrapper } from '@/components/PageFlipWrapper';
import { DiaryDetail } from '@/components/DiaryDetail';

interface DiaryDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: DiaryDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const entry = await getDiaryById(id);
  return { title: entry?.title || '日记详情' };
}

export default async function DiaryDetailPage({ params }: DiaryDetailPageProps) {
  const { id } = await params;
  const [entry, { prev, next }, allEntries] = await Promise.all([
    getDiaryById(id),
    getDiaryNeighbors(id),
    getDiaryList(),
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
      }
    >
      <DiaryDetail entry={entry} entryNumber={entryNumber} />
    </PageFlipWrapper>
  );
}
```

- [ ] **Step 2: 运行 build + lint**

Run: `pnpm build && pnpm lint`

Expected: 全部通过

- [ ] **Step 3: Commit**

```bash
git add src/app/diary/[id]/page.tsx
git commit -m "$(cat <<'EOF'
feat(diary/[id]): 单篇日记页新增编辑入口

- 顶部导航栏通过 PageFlipWrapper actions 插槽注入编辑按钮
- 铅笔图标跳转到 /diary/[id]/edit
EOF
)"
```

---

## Task 6: 编辑页集成删除功能

**Files:**
- Modify: `src/app/diary/[id]/edit/page.tsx`

**Context:** 在编辑页底部添加删除按钮和 DeleteConfirmModal，点击删除后调用 `deleteDiary` Server Action，成功跳转到 `/diary`。

由于删除操作需要 Client Component 状态管理（Modal 显隐、loading），而当前编辑页是 Server Component，需要引入一个 Client Component 作为删除功能的容器。

方案：创建 `DeleteDiarySection` Client Component，在编辑页底部渲染。

- [ ] **Step 1: 创建 DeleteDiarySection Client Component**

创建 `src/components/DeleteDiarySection.tsx`：

```tsx
'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from 'animal-island-ui';
import { deleteDiary } from '@/lib/actions';
import { DeleteConfirmModal } from './DeleteConfirmModal';

interface DeleteDiarySectionProps {
  entryId: string;
}

export function DeleteDiarySection({ entryId }: DeleteDiarySectionProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleOpen = useCallback(() => {
    setDeleteError('');
    setShowModal(true);
  }, []);

  const handleClose = useCallback(() => {
    if (deleting) return;
    setShowModal(false);
  }, [deleting]);

  const handleConfirm = useCallback(async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteDiary(entryId);
      setShowModal(false);
      router.push('/diary');
    } catch {
      setDeleteError('删除失败，日记可能已被删除');
      setDeleting(false);
    }
  }, [entryId, router]);

  return (
    <>
      <div className="mt-6 pt-4 border-t border-border-soft">
        <Button
          type="danger"
          block
          onClick={handleOpen}
        >
          删除这篇日记
        </Button>
      </div>

      <DeleteConfirmModal
        open={showModal}
        onClose={handleClose}
        onConfirm={handleConfirm}
        loading={deleting}
      />

      {deleteError && (
        <div className="mt-3 px-4 py-3 rounded-lg bg-red-50 text-red-600 text-sm text-center">
          {deleteError}
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 2: 修改编辑页引入 DeleteDiarySection**

修改 `src/app/diary/[id]/edit/page.tsx`，在底部添加 `<DeleteDiarySection entryId={id} />`：

```tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDiaryById } from '@/lib/actions';
import { DiaryForm } from '@/components/DiaryForm';
import { DeleteDiarySection } from '@/components/DeleteDiarySection';

interface EditDiaryPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EditDiaryPageProps): Promise<Metadata> {
  const { id } = await params;
  const entry = await getDiaryById(id);
  return { title: entry?.title ? `编辑：${entry.title}` : '编辑日记' };
}

export default async function EditDiaryPage({ params }: EditDiaryPageProps) {
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
        <DeleteDiarySection entryId={id} />
      </div>
    </main>
  );
}
```

- [ ] **Step 3: 运行 build + lint + 测试**

Run: `pnpm build && pnpm lint && npx jest --no-coverage`

Expected: 全部通过

- [ ] **Step 4: Commit**

```bash
git add src/components/DeleteDiarySection.tsx src/app/diary/[id]/edit/page.tsx
git commit -m "$(cat <<'EOF'
feat(diary/[id]/edit): 编辑页集成删除功能

- 新增 DeleteDiarySection Client Component
- 底部红色删除按钮
- 二次确认 Modal + loading 状态
- 删除成功后跳转 /diary
EOF
)"
```

---

## Task 7: 全量验证

- [ ] **Step 1: 运行完整测试套件**

Run: `npx jest --no-coverage`

Expected: 全部 PASS

- [ ] **Step 2: 运行 ESLint**

Run: `pnpm lint`

Expected: 无错误无警告

- [ ] **Step 3: 运行生产构建**

Run: `pnpm build`

Expected: 构建成功

- [ ] **Step 4: Commit（如做了修复）**

如果有修复，单独 commit：

```bash
git add ...
git commit -m "fix: 验证阶段修复"
```

---

## Self-Review Checklist

### Spec Coverage

| 设计文档要求 | 对应任务 |
|-------------|---------|
| DiaryForm 支持 edit 模式（props） | Task 1 |
| 编辑时预填充已有数据 | Task 1 |
| 编辑草稿 key 独立 | Task 1 |
| 编辑调用 updateDiary | Task 1 |
| 新增编辑页 /diary/[id]/edit | Task 3 |
| 编辑页 notFound 处理 | Task 3 |
| PageFlipWrapper actions 插槽 | Task 4 |
| 单篇日记页编辑入口 | Task 5 |
| DeleteConfirmModal 组件 | Task 2 |
| 删除二次确认文案 | Task 2 |
| 编辑页删除按钮 | Task 6 |
| 删除后跳转 /diary | Task 6 |
| 删除错误处理 | Task 6 |

### Placeholder Scan
- [x] 无 TBD/TODO
- [x] 无 "add appropriate error handling" 等模糊描述
- [x] 无 "similar to Task N"
- [x] 每个步骤包含完整代码

### Type Consistency
- [x] `DiaryFormProps` 中的 `mode`/`initialData`/`entryId` 在所有任务中一致
- [x] `DeleteConfirmModalProps` 中的 `open`/`onClose`/`onConfirm`/`loading` 在所有任务中一致
- [x] `PageFlipWrapperProps` 中的 `actions` 类型一致
